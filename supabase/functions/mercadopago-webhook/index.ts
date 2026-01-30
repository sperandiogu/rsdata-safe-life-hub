import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

async function processSubscriptionEvent(
  supabase: any,
  accessToken: string,
  subscriptionId: string,
  supabaseUrl: string,
  supabaseServiceKey: string
) {
  const subscriptionResponse = await fetch(
    `https://api.mercadopago.com/preapproval/${subscriptionId}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!subscriptionResponse.ok) {
    console.error("Failed to fetch subscription details");
    return;
  }

  const subscription = await subscriptionResponse.json();
  console.log("Subscription details:", subscription);

  const { data: subscriptionRecord } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("mp_subscription_id", subscriptionId)
    .maybeSingle();

  if (!subscriptionRecord) {
    console.log("Subscription not found in database, checking by external_reference");

    const { data: subByRef } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("id", subscription.external_reference)
      .maybeSingle();

    if (subByRef) {
      await supabase
        .from("subscriptions")
        .update({ mp_subscription_id: subscriptionId })
        .eq("id", subByRef.id);
    }
  }

  if (subscription.status === "authorized") {
    const { data: subRecord } = await supabase
      .from("subscriptions")
      .select("*, customer:customers(*), plan:plans(*)")
      .eq("mp_subscription_id", subscriptionId)
      .maybeSingle();

    if (subRecord) {
      const startedAt = new Date();
      let expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      await supabase
        .from("subscriptions")
        .update({
          status: "active",
          started_at: startedAt.toISOString(),
          expires_at: expiresAt.toISOString(),
        })
        .eq("id", subRecord.id);

      console.log("Subscription activated successfully");

      const { data: addressData } = await supabase
        .from("addresses")
        .select("*")
        .eq("customer_id", subRecord.customer_id)
        .eq("is_default", true)
        .maybeSingle();

      const { data: paymentRecord } = await supabase
        .from("payments")
        .select("*")
        .eq("subscription_id", subRecord.id)
        .maybeSingle();

      const makeWebhookUrl = "https://hook.us2.make.com/0itcp73mvrj2gh4pke27jxoc2xkfqt1h";

      const webhookPayload = {
        lead: {
          tipoCliente: subRecord.customer.document_type,
          documento: subRecord.customer.document,
          documentoLimpo: subRecord.customer.document,
          nome: subRecord.customer.name,
          telefone: subRecord.customer.phone,
          email: subRecord.customer.email,
          observacoes: null,
        },
        endereco: addressData ? {
          cep: addressData.cep,
          rua: addressData.street,
          numero: addressData.number,
          complemento: addressData.complement,
          bairro: addressData.neighborhood,
          cidade: addressData.city,
          estado: addressData.state,
          enderecoCompleto: `${addressData.street}, ${addressData.number}${addressData.complement ? `, ${addressData.complement}` : ''}, ${addressData.neighborhood}, ${addressData.city}/${addressData.state}, CEP: ${addressData.cep}`
        } : null,
        plano: {
          nome: subRecord.plan.name,
          tipo: subRecord.billing_period === 'anual' ? 'Anual' : 'Mensal',
          valor: subRecord.plan.price,
          valorFormatado: `R$ ${subRecord.plan.price.toFixed(2).replace(".", ",")}`,
          categoria: subRecord.billing_period === 'anual' ? "ANUAL" : "MENSAL",
        },
        assinatura: {
          id: subRecord.id,
          status: 'active',
          inicioEm: startedAt.toISOString(),
          expiraEm: expiresAt.toISOString(),
          periodo: subRecord.billing_period,
        },
        sessao: {
          timestamp: new Date().toISOString(),
          timestampBrasil: new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }),
          fonte: "MERCADOPAGO_WEBHOOK_SUBSCRIPTION",
        },
        status: {
          etapa: "ASSINATURA_AUTORIZADA",
          proximaEtapa: "CRIAR_CONTA_RSDATA",
          fonte: "LANDING_PAGE_RSDATA",
        },
      };

      try {
        await fetch(makeWebhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(webhookPayload),
        });
        console.log("Make.com webhook notified for subscription");
      } catch (webhookError) {
        console.error("Error notifying Make.com webhook:", webhookError);
      }

      const sendEmailUrl = `${supabaseUrl}/functions/v1/send-email`;

      try {
        const customerEmailResponse = await fetch(sendEmailUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({
            action: "send_customer_confirmation",
            data: {
              customerName: subRecord.customer.name,
              customerEmail: subRecord.customer.email,
              planName: subRecord.plan.name,
              planType: subRecord.billing_period === "mensal" ? "monthly" : "yearly",
              planPrice: subRecord.plan.price,
              subscriptionStartDate: startedAt.toISOString(),
              subscriptionEndDate: expiresAt.toISOString(),
            },
            paymentId: paymentRecord?.id || null,
            subscriptionId: subRecord.id,
          }),
        });
        const customerEmailResult = await customerEmailResponse.json();
        console.log("Customer confirmation email:", customerEmailResult.success ? "sent" : "failed");
      } catch (emailError) {
        console.error("Error sending customer email:", emailError);
      }

      try {
        const welcomeEmailResponse = await fetch(sendEmailUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({
            action: "send_welcome",
            data: {
              customerName: subRecord.customer.name,
              customerEmail: subRecord.customer.email,
              planName: subRecord.plan.name,
            },
            subscriptionId: subRecord.id,
          }),
        });
        const welcomeEmailResult = await welcomeEmailResponse.json();
        console.log("Welcome email:", welcomeEmailResult.success ? "sent" : "failed");
      } catch (emailError) {
        console.error("Error sending welcome email:", emailError);
      }

      try {
        const internalEmailResponse = await fetch(sendEmailUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({
            action: "send_internal_notification",
            data: {
              customerName: subRecord.customer.name,
              customerDocument: subRecord.customer.document,
              customerEmail: subRecord.customer.email,
              customerPhone: subRecord.customer.phone,
              addressStreet: addressData?.street || "",
              addressNumber: addressData?.number || "",
              addressComplement: addressData?.complement || "",
              addressNeighborhood: addressData?.neighborhood || "",
              addressCity: addressData?.city || "",
              addressState: addressData?.state || "",
              addressCep: addressData?.cep || "",
              planName: subRecord.plan.name,
              planType: subRecord.billing_period === "mensal" ? "monthly" : "yearly",
              planPrice: subRecord.plan.price,
              subscriptionId: subRecord.id,
              subscriptionStartDate: startedAt.toISOString(),
              subscriptionEndDate: expiresAt.toISOString(),
              paymentId: paymentRecord?.id || "N/A",
              mercadoPagoPaymentId: subscriptionId,
              paymentMethod: "subscription",
              installments: 1,
              approvalDate: new Date().toISOString(),
            },
            paymentId: paymentRecord?.id || null,
            subscriptionId: subRecord.id,
          }),
        });
        const internalEmailResult = await internalEmailResponse.json();
        console.log("Internal notification email:", internalEmailResult.success ? "sent" : "failed");
      } catch (emailError) {
        console.error("Error sending internal email:", emailError);
      }
    }
  } else if (subscription.status === "cancelled") {
    await supabase
      .from("subscriptions")
      .update({
        status: "cancelled",
        cancelled_at: new Date().toISOString(),
      })
      .eq("mp_subscription_id", subscriptionId);

    console.log("Subscription cancelled");
  }
}

async function processRecurringPayment(
  supabase: any,
  accessToken: string,
  paymentId: string,
  supabaseUrl: string,
  supabaseServiceKey: string
) {
  const paymentResponse = await fetch(
    `https://api.mercadopago.com/authorized_payments/${paymentId}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!paymentResponse.ok) {
    console.error("Failed to fetch recurring payment details");
    return;
  }

  const payment = await paymentResponse.json();
  console.log("Recurring payment details:", payment);

  if (payment.status === "approved") {
    const { data: subscriptionRecord } = await supabase
      .from("subscriptions")
      .select("*, customer:customers(*), plan:plans(*)")
      .eq("mp_subscription_id", payment.preapproval_id)
      .maybeSingle();

    if (subscriptionRecord) {
      const { error: paymentError } = await supabase.from("payments").insert({
        external_reference: `recurring_${payment.id}`,
        mp_payment_id: payment.id.toString(),
        customer_id: subscriptionRecord.customer_id,
        subscription_id: subscriptionRecord.id,
        amount: payment.transaction_amount,
        status: payment.status,
        status_detail: payment.status_detail || "approved",
        payment_method: payment.payment_method_id,
        payment_type: "recurring",
        installments: 1,
        paid_at: payment.date_created,
        metadata: {
          preapproval_id: payment.preapproval_id,
          recurring: true,
        },
      });

      if (paymentError) {
        console.error("Error recording recurring payment:", paymentError);
      }

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      await supabase
        .from("subscriptions")
        .update({
          expires_at: expiresAt.toISOString(),
        })
        .eq("id", subscriptionRecord.id);

      console.log("Subscription renewed successfully");
    }
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const accessToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const url = new URL(req.url);
    const topic = url.searchParams.get("topic") || url.searchParams.get("type");
    const resourceId = url.searchParams.get("data.id") || url.searchParams.get("id");

    let body = {};
    try {
      body = await req.json();
    } catch {
      // Body may be empty for some notifications
    }

    console.log("Webhook received:", { topic, resourceId, body });

    if (topic === "subscription" || topic === "preapproval") {
      if (resourceId) {
        await processSubscriptionEvent(
          supabase,
          accessToken!,
          resourceId,
          supabaseUrl,
          supabaseServiceKey
        );
      }
    } else if (topic === "subscription_authorized_payment" || topic === "subscription_preapproval_authorized_payment") {
      if (resourceId) {
        await processRecurringPayment(
          supabase,
          accessToken!,
          resourceId,
          supabaseUrl,
          supabaseServiceKey
        );
      }
    } else if (topic === "payment" && resourceId) {
      const paymentResponse = await fetch(
        `https://api.mercadopago.com/v1/payments/${resourceId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!paymentResponse.ok) {
        console.error("Failed to fetch payment details");
        return new Response(JSON.stringify({ error: "Failed to fetch payment" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const payment = await paymentResponse.json();
      console.log("Payment details:", payment);

      const externalReference = payment.external_reference;

      const updateData: Record<string, unknown> = {
        mp_payment_id: payment.id.toString(),
        status: payment.status,
        status_detail: payment.status_detail,
        payment_method: payment.payment_method_id,
        payment_type: payment.payment_type_id,
        installments: payment.installments,
        metadata: {
          transaction_amount: payment.transaction_amount,
          net_received_amount: payment.transaction_details?.net_received_amount,
          total_paid_amount: payment.transaction_details?.total_paid_amount,
          installment_amount: payment.transaction_details?.installment_amount,
          date_approved: payment.date_approved,
          date_created: payment.date_created,
          payer: payment.payer,
        },
      };

      if (payment.status === "approved") {
        updateData.paid_at = payment.date_approved || new Date().toISOString();
      }

      const { error: updateError } = await supabase
        .from("payments")
        .update(updateData)
        .eq("external_reference", externalReference);

      if (updateError) {
        console.error("Error updating payment:", updateError);
      } else {
        console.log("Payment updated successfully:", externalReference);

        if (payment.status === "approved") {
          const { data: paymentRecord } = await supabase
            .from("payments")
            .select(`
              *,
              customer:customers(*),
              subscription:subscriptions(
                *,
                plan:plans(*)
              )
            `)
            .eq("external_reference", externalReference)
            .maybeSingle();

          if (paymentRecord && paymentRecord.subscription) {
            const startedAt = new Date();
            let expiresAt = new Date();

            if (paymentRecord.subscription.billing_period === 'mensal') {
              expiresAt.setDate(expiresAt.getDate() + 30);
            } else {
              expiresAt.setFullYear(expiresAt.getFullYear() + 1);
            }

            const { error: subscriptionError } = await supabase
              .from("subscriptions")
              .update({
                status: 'active',
                started_at: startedAt.toISOString(),
                expires_at: expiresAt.toISOString(),
              })
              .eq("id", paymentRecord.subscription.id);

            if (subscriptionError) {
              console.error("Error activating subscription:", subscriptionError);
            } else {
              console.log("Subscription activated successfully");
            }

            const { data: addressData } = await supabase
              .from("addresses")
              .select("*")
              .eq("customer_id", paymentRecord.customer_id)
              .eq("is_default", true)
              .maybeSingle();

            const makeWebhookUrl = "https://hook.us2.make.com/0itcp73mvrj2gh4pke27jxoc2xkfqt1h";

            const webhookPayload = {
              lead: {
                tipoCliente: paymentRecord.customer.document_type,
                documento: paymentRecord.customer.document,
                documentoLimpo: paymentRecord.customer.document,
                nome: paymentRecord.customer.name,
                telefone: paymentRecord.customer.phone,
                email: paymentRecord.customer.email,
                observacoes: null,
              },
              endereco: addressData ? {
                cep: addressData.cep,
                rua: addressData.street,
                numero: addressData.number,
                complemento: addressData.complement,
                bairro: addressData.neighborhood,
                cidade: addressData.city,
                estado: addressData.state,
                enderecoCompleto: `${addressData.street}, ${addressData.number}${addressData.complement ? `, ${addressData.complement}` : ''}, ${addressData.neighborhood}, ${addressData.city}/${addressData.state}, CEP: ${addressData.cep}`
              } : null,
              plano: {
                nome: paymentRecord.subscription.plan.name,
                tipo: paymentRecord.subscription.billing_period === 'anual' ? 'Anual' : 'Mensal',
                valor: paymentRecord.amount,
                valorFormatado: `R$ ${paymentRecord.amount.toFixed(2).replace(".", ",")}`,
                categoria: paymentRecord.subscription.billing_period === 'anual' ? "ANUAL" : "MENSAL",
              },
              assinatura: {
                id: paymentRecord.subscription.id,
                status: 'active',
                inicioEm: startedAt.toISOString(),
                expiraEm: expiresAt.toISOString(),
                periodo: paymentRecord.subscription.billing_period,
              },
              pagamento: {
                id: payment.id,
                status: payment.status,
                metodo: payment.payment_method_id,
                tipo: payment.payment_type_id,
                parcelas: payment.installments,
                dataAprovacao: payment.date_approved,
              },
              sessao: {
                timestamp: new Date().toISOString(),
                timestampBrasil: new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }),
                fonte: "MERCADOPAGO_WEBHOOK",
              },
              status: {
                etapa: "PAGAMENTO_APROVADO",
                proximaEtapa: "CRIAR_CONTA_RSDATA",
                fonte: "LANDING_PAGE_RSDATA",
              },
            };

            try {
              await fetch(makeWebhookUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(webhookPayload),
              });
              console.log("Make.com webhook notified successfully");
            } catch (webhookError) {
              console.error("Error notifying Make.com webhook:", webhookError);
            }

            const sendEmailUrl = `${supabaseUrl}/functions/v1/send-email`;

            try {
              const customerEmailResponse = await fetch(sendEmailUrl, {
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
              const customerEmailResult = await customerEmailResponse.json();
              console.log("Customer confirmation email:", customerEmailResult.success ? "sent" : "failed");
            } catch (emailError) {
              console.error("Error sending customer email:", emailError);
            }

            try {
              const welcomeEmailResponse = await fetch(sendEmailUrl, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${supabaseServiceKey}`,
                },
                body: JSON.stringify({
                  action: "send_welcome",
                  data: {
                    customerName: paymentRecord.customer.name,
                    customerEmail: paymentRecord.customer.email,
                    planName: paymentRecord.subscription.plan.name,
                  },
                  subscriptionId: paymentRecord.subscription.id,
                }),
              });
              const welcomeEmailResult = await welcomeEmailResponse.json();
              console.log("Welcome email:", welcomeEmailResult.success ? "sent" : "failed");
            } catch (emailError) {
              console.error("Error sending welcome email:", emailError);
            }

            try {
              const internalEmailResponse = await fetch(sendEmailUrl, {
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
                    mercadoPagoPaymentId: payment.id.toString(),
                    paymentMethod: payment.payment_method_id,
                    installments: payment.installments,
                    approvalDate: payment.date_approved || new Date().toISOString(),
                  },
                  paymentId: paymentRecord.id,
                  subscriptionId: paymentRecord.subscription.id,
                }),
              });
              const internalEmailResult = await internalEmailResponse.json();
              console.log("Internal notification email:", internalEmailResult.success ? "sent" : "failed");
            } catch (emailError) {
              console.error("Error sending internal email:", emailError);
            }
          }
        }
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
