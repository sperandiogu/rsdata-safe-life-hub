import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

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
    const mercadoPagoAccessToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { subscriptionId } = await req.json();

    if (!subscriptionId) {
      return new Response(
        JSON.stringify({ error: "subscriptionId is required" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    const { data: subRecord } = await supabase
      .from("subscriptions")
      .select("*, customer:customers(*), plan:plans(*)")
      .eq("id", subscriptionId)
      .maybeSingle();

    if (!subRecord) {
      return new Response(
        JSON.stringify({ error: "Subscription not found" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 404,
        }
      );
    }

    if (subRecord.status === "active") {
      return new Response(
        JSON.stringify({ message: "Subscription already active", status: "active" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    if (!subRecord.mp_subscription_id) {
      return new Response(
        JSON.stringify({ error: "No MercadoPago subscription ID found" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    const mpResponse = await fetch(
      `https://api.mercadopago.com/preapproval/${subRecord.mp_subscription_id}`,
      {
        headers: {
          Authorization: `Bearer ${mercadoPagoAccessToken}`,
        },
      }
    );

    if (!mpResponse.ok) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch subscription from MercadoPago" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    const mpSubscription = await mpResponse.json();

    if (mpSubscription.status === "authorized") {
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
          fonte: "CHECK_SUBSCRIPTION_STATUS",
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
        console.log("Make.com webhook notified");
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
              mercadoPagoPaymentId: subRecord.mp_subscription_id,
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

      return new Response(
        JSON.stringify({
          message: "Subscription activated and emails sent",
          status: "active",
          mpStatus: mpSubscription.status
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    return new Response(
      JSON.stringify({
        message: "Subscription not yet authorized",
        status: subRecord.status,
        mpStatus: mpSubscription.status
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in check-subscription-status:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
