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
        await fetch(`${supabaseUrlEnv}/functions/v1/send-email`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${supabaseAnonKey}`,
          },
          body: JSON.stringify({
            to: email,
            subject: "Assinatura RSData Confirmada",
            externalReference: externalReference,
            planName: planName,
            amount: amount,
          }),
        });
      } catch (emailError) {
        console.error("Error sending confirmation email:", emailError);
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
