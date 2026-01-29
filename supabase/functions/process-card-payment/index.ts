import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface PaymentFormData {
  token: string;
  issuer_id: string;
  payment_method_id: string;
  transaction_amount: number;
  installments: number;
  payer: {
    email: string;
    identification: {
      type: string;
      number: string;
    };
  };
}

interface RequestPayload {
  formData: PaymentFormData;
  externalReference: string;
  planName: string;
  planType: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const accessToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");

    if (!accessToken) {
      return new Response(
        JSON.stringify({ error: "Mercado Pago access token not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const payload: RequestPayload = await req.json();
    const { formData, externalReference, planName, planType } = payload;

    const paymentBody = {
      token: formData.token,
      issuer_id: formData.issuer_id || null,
      payment_method_id: formData.payment_method_id,
      transaction_amount: formData.transaction_amount,
      installments: formData.installments,
      description: `RSData - Plano ${planName} (${planType})`,
      statement_descriptor: "RSDATA SST",
      external_reference: externalReference,
      payer: {
        email: formData.payer.email,
        identification: {
          type: formData.payer.identification.type,
          number: formData.payer.identification.number,
        },
      },
    };

    const response = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        "X-Idempotency-Key": `${externalReference}-${Date.now()}`,
      },
      body: JSON.stringify(paymentBody),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Mercado Pago API error:", data);
      return new Response(
        JSON.stringify({
          error: "Failed to process payment",
          message: data.message || "Erro ao processar pagamento",
          details: data
        }),
        {
          status: response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (supabaseUrl && supabaseServiceKey) {
      try {
        await fetch(`${supabaseUrl}/rest/v1/payments?external_reference=eq.${externalReference}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${supabaseServiceKey}`,
            apikey: supabaseServiceKey,
          },
          body: JSON.stringify({
            mp_payment_id: String(data.id),
            status: data.status,
            status_detail: data.status_detail,
            payment_method: data.payment_method_id,
            payment_type: data.payment_type_id,
          }),
        });

        if (data.status === "approved") {
          try {
            const paymentResponse = await fetch(
              `${supabaseUrl}/rest/v1/payments?external_reference=eq.${externalReference}&select=*,customer:customers(*),subscription:subscriptions(*,plan:plans(*))`,
              {
                headers: {
                  Authorization: `Bearer ${supabaseServiceKey}`,
                  apikey: supabaseServiceKey,
                }
              }
            );

            const payments = await paymentResponse.json();

            if (payments && payments.length > 0) {
              const paymentRecord = payments[0];

              if (paymentRecord.subscription) {
                const startedAt = new Date();
                let expiresAt = new Date();

                if (paymentRecord.subscription.billing_period === 'mensal') {
                  expiresAt.setDate(expiresAt.getDate() + 30);
                } else {
                  expiresAt.setFullYear(expiresAt.getFullYear() + 1);
                }

                await fetch(`${supabaseUrl}/rest/v1/subscriptions?id=eq.${paymentRecord.subscription.id}`, {
                  method: "PATCH",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${supabaseServiceKey}`,
                    apikey: supabaseServiceKey,
                  },
                  body: JSON.stringify({
                    status: 'active',
                    started_at: startedAt.toISOString(),
                    expires_at: expiresAt.toISOString(),
                  }),
                });

                const addressResponse = await fetch(
                  `${supabaseUrl}/rest/v1/addresses?customer_id=eq.${paymentRecord.customer_id}&is_default=eq.true`,
                  {
                    headers: {
                      Authorization: `Bearer ${supabaseServiceKey}`,
                      apikey: supabaseServiceKey,
                    }
                  }
                );

                const addresses = await addressResponse.json();
                const addressData = addresses && addresses.length > 0 ? addresses[0] : null;

                const sendEmailUrl = `${supabaseUrl}/functions/v1/send-email`;

                await fetch(sendEmailUrl, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${supabaseServiceKey}`,
                  },
                  body: JSON.stringify({
                    action: "send_customer_confirmation",
                    data: {
                      customerName: paymentRecord.customer.name,
                      customerEmail: paymentRecord.customer.email,
                      planName: paymentRecord.subscription.plan.name,
                      planType: paymentRecord.subscription.billing_period === "mensal" ? "monthly" : "yearly",
                      planPrice: paymentRecord.amount,
                      subscriptionStartDate: startedAt.toISOString(),
                      subscriptionEndDate: expiresAt.toISOString(),
                    },
                    paymentId: paymentRecord.id,
                    subscriptionId: paymentRecord.subscription.id,
                  }),
                });

                await fetch(sendEmailUrl, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${supabaseServiceKey}`,
                  },
                  body: JSON.stringify({
                    action: "send_internal_notification",
                    data: {
                      customerName: paymentRecord.customer.name,
                      customerDocument: paymentRecord.customer.document,
                      customerEmail: paymentRecord.customer.email,
                      customerPhone: paymentRecord.customer.phone,
                      addressStreet: addressData?.street || "",
                      addressNumber: addressData?.number || "",
                      addressComplement: addressData?.complement || "",
                      addressNeighborhood: addressData?.neighborhood || "",
                      addressCity: addressData?.city || "",
                      addressState: addressData?.state || "",
                      addressCep: addressData?.cep || "",
                      planName: paymentRecord.subscription.plan.name,
                      planType: paymentRecord.subscription.billing_period === "mensal" ? "monthly" : "yearly",
                      planPrice: paymentRecord.amount,
                      subscriptionId: paymentRecord.subscription.id,
                      subscriptionStartDate: startedAt.toISOString(),
                      subscriptionEndDate: expiresAt.toISOString(),
                      paymentId: paymentRecord.id,
                      mercadoPagoPaymentId: data.id.toString(),
                      paymentMethod: data.payment_method_id,
                      installments: data.installments,
                      approvalDate: data.date_approved || new Date().toISOString(),
                    },
                    paymentId: paymentRecord.id,
                    subscriptionId: paymentRecord.subscription.id,
                  }),
                });

                console.log("Emails sent successfully for approved payment");
              }
            }
          } catch (emailError) {
            console.error("Error sending emails after approval:", emailError);
          }
        }
      } catch (dbError) {
        console.error("Error updating payment in database:", dbError);
      }
    }

    return new Response(
      JSON.stringify({
        id: data.id,
        status: data.status,
        status_detail: data.status_detail,
        payment_method_id: data.payment_method_id,
        payment_type_id: data.payment_type_id,
        transaction_amount: data.transaction_amount,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error processing payment:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", message: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
