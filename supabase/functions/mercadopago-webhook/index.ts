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
    const accessToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const url = new URL(req.url);
    const topic = url.searchParams.get("topic") || url.searchParams.get("type");
    const paymentId = url.searchParams.get("data.id") || url.searchParams.get("id");

    let body = {};
    try {
      body = await req.json();
    } catch {
      // Body may be empty for some notifications
    }

    console.log("Webhook received:", { topic, paymentId, body });

    if (topic === "payment" && paymentId) {
      const paymentResponse = await fetch(
        `https://api.mercadopago.com/v1/payments/${paymentId}`,
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
            .select("*")
            .eq("external_reference", externalReference)
            .single();

          if (paymentRecord) {
            const makeWebhookUrl = "https://hook.us2.make.com/0itcp73mvrj2gh4pke27jxoc2xkfqt1h";

            const webhookPayload = {
              lead: {
                tipoCliente: paymentRecord.customer_document.replace(/\D/g, "").length === 14 ? "PJ" : "PF",
                documento: paymentRecord.customer_document,
                documentoLimpo: paymentRecord.customer_document.replace(/\D/g, ""),
                nome: paymentRecord.customer_name,
                telefone: paymentRecord.customer_phone,
                email: paymentRecord.customer_email,
                observacoes: null,
              },
              endereco: paymentRecord.customer_address,
              plano: {
                nome: paymentRecord.plan_name,
                tipo: paymentRecord.plan_type,
                valor: paymentRecord.amount,
                valorFormatado: `R$ ${paymentRecord.amount.toFixed(2).replace(".", ",")}`,
                categoria: paymentRecord.plan_type === "Anual" ? "ANUAL" : "MENSAL",
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
