import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface SubscriptionRequest {
  cardToken: string;
  email: string;
  amount: number;
  planName: string;
  externalReference: string;
  subscriptionId: string;
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

    const payload: SubscriptionRequest = await req.json();
    const { cardToken, email, amount, planName, externalReference, subscriptionId } = payload;

    const startDate = new Date();
    startDate.setHours(startDate.getHours() + 1);

    const preapproval = {
      reason: `RSData - Plano ${planName} (Mensal)`,
      external_reference: externalReference,
      payer_email: email,
      card_token_id: cardToken,
      auto_recurring: {
        frequency: 1,
        frequency_type: "months",
        start_date: startDate.toISOString(),
        transaction_amount: amount,
        currency_id: "BRL",
      },
      back_url: `${req.headers.get("origin") || "https://cadastro.rsdata.com.br"}/pagamento-confirmado`,
      status: "authorized",
    };

    console.log("Creating authorized subscription:", JSON.stringify(preapproval, null, 2));

    const subscriptionResponse = await fetch("https://api.mercadopago.com/preapproval", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(preapproval),
    });

    const subscriptionData = await subscriptionResponse.json();

    console.log("Subscription response:", JSON.stringify(subscriptionData, null, 2));

    if (!subscriptionResponse.ok) {
      console.error("Failed to create subscription:", subscriptionData);
      throw new Error(`Failed to create subscription: ${JSON.stringify(subscriptionData)}`);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (subscriptionId && supabaseUrl && supabaseServiceKey) {
      await fetch(`${supabaseUrl}/rest/v1/subscriptions?id=eq.${subscriptionId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "apikey": supabaseServiceKey,
          "Authorization": `Bearer ${supabaseServiceKey}`,
          "Prefer": "return=minimal"
        },
        body: JSON.stringify({
          mp_subscription_id: subscriptionData.id,
          status: "active",
        }),
      });
    }

    const supabaseUrlEnv = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (supabaseUrlEnv && supabaseAnonKey) {
      try {
        const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Assinatura Confirmada - RSData</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background-color: #084D6C; padding: 20px; text-align: center;">
      <h1 style="color: white; margin: 0;">Assinatura Confirmada!</h1>
    </div>
    <div style="background-color: #f9f9f9; padding: 20px; margin-top: 20px;">
      <p>Olá,</p>
      <p>Sua assinatura do <strong>${planName}</strong> foi confirmada com sucesso!</p>
      <p><strong>Detalhes:</strong></p>
      <ul>
        <li>Plano: ${planName}</li>
        <li>Valor: R$ ${amount.toFixed(2)}</li>
        <li>Referência: ${externalReference}</li>
        <li>ID da Assinatura MP: ${subscriptionData.id}</li>
      </ul>
      <p>A primeira cobrança será processada em aproximadamente 1 hora.</p>
      <p>Obrigado por escolher a RSData!</p>
    </div>
  </div>
</body>
</html>`;

        const emailText = `
Assinatura Confirmada - RSData

Olá,

Sua assinatura do ${planName} foi confirmada com sucesso!

Detalhes:
- Plano: ${planName}
- Valor: R$ ${amount.toFixed(2)}
- Referência: ${externalReference}
- ID da Assinatura MP: ${subscriptionData.id}

A primeira cobrança será processada em aproximadamente 1 hora.

Obrigado por escolher a RSData!
`;

        await fetch(`${supabaseUrlEnv}/functions/v1/send-email`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${supabaseAnonKey}`,
          },
          body: JSON.stringify({
            action: "send_raw",
            to: email,
            subject: "Assinatura RSData Confirmada",
            htmlBody: emailHtml,
            textBody: emailText,
            emailType: "customer_confirmation",
            subscriptionId: subscriptionId,
          }),
        });

        const internalEmailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Nova Assinatura Recorrente - RSData</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background-color: #084D6C; padding: 20px; text-align: center;">
      <h1 style="color: white; margin: 0;">Nova Assinatura Recorrente</h1>
    </div>
    <div style="background-color: #f9f9f9; padding: 20px; margin-top: 20px;">
      <h2>Detalhes da Assinatura:</h2>
      <ul>
        <li><strong>Cliente:</strong> ${email}</li>
        <li><strong>Plano:</strong> ${planName}</li>
        <li><strong>Valor Mensal:</strong> R$ ${amount.toFixed(2)}</li>
        <li><strong>Referência Externa:</strong> ${externalReference}</li>
        <li><strong>ID Assinatura (DB):</strong> ${subscriptionId}</li>
        <li><strong>ID Assinatura (MP):</strong> ${subscriptionData.id}</li>
        <li><strong>Status:</strong> ${subscriptionData.status}</li>
      </ul>
      <p><strong>Nota:</strong> A primeira cobrança será processada em aproximadamente 1 hora.</p>
    </div>
  </div>
</body>
</html>`;

        const internalEmailText = `
Nova Assinatura Recorrente - RSData

Detalhes da Assinatura:
- Cliente: ${email}
- Plano: ${planName}
- Valor Mensal: R$ ${amount.toFixed(2)}
- Referência Externa: ${externalReference}
- ID Assinatura (DB): ${subscriptionId}
- ID Assinatura (MP): ${subscriptionData.id}
- Status: ${subscriptionData.status}

Nota: A primeira cobrança será processada em aproximadamente 1 hora.
`;

        await fetch(`${supabaseUrlEnv}/functions/v1/send-email`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${supabaseAnonKey}`,
          },
          body: JSON.stringify({
            action: "send_raw",
            to: "loja@rsdata.inf.br",
            subject: `Nova Assinatura Recorrente: ${planName} - ${email}`,
            htmlBody: internalEmailHtml,
            textBody: internalEmailText,
            emailType: "internal_notification",
            subscriptionId: subscriptionId,
          }),
        });
      } catch (emailError) {
        console.error("Error sending emails:", emailError);
      }
    }

    return new Response(
      JSON.stringify({
        subscriptionId: subscriptionData.id,
        status: subscriptionData.status,
        message: "Assinatura criada com sucesso! A primeira cobrança será processada em aproximadamente 1 hora.",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error creating authorized subscription:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error"
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
