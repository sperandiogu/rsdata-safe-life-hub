import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface PlanInfo {
  name: string;
  type: string;
  price: number;
  planId: string;
}

interface CustomerInfo {
  email: string;
  name: string;
  document: string;
  phone: string;
  address: {
    cep: string;
    street: string;
    number: string;
    complement: string | null;
    neighborhood: string;
    city: string;
    state: string;
  };
}

interface RequestPayload {
  plan: PlanInfo;
  customer: CustomerInfo;
  externalReference?: string;
  subscriptionId?: string;
}

async function createRecurringSubscription(
  accessToken: string,
  plan: PlanInfo,
  customer: CustomerInfo,
  externalReference: string,
  backUrls: { success: string; failure: string; pending: string }
) {
  const cleanDocument = customer.document.replace(/\D/g, "");
  const isCompany = cleanDocument.length === 14;

  const startDate = new Date();
  startDate.setDate(startDate.getDate() + 1);

  const preapproval = {
    reason: `RSData - Plano ${plan.name} (Mensal)`,
    external_reference: externalReference,
    payer_email: customer.email,
    auto_recurring: {
      frequency: 1,
      frequency_type: "months",
      start_date: startDate.toISOString(),
      end_date: null,
      transaction_amount: plan.price,
      currency_id: "BRL",
    },
    back_url: `${backUrls.success}&preapproval_id=$init_point_preapproval_id`,
    status: "pending",
  };

  console.log("Creating preapproval with data:", JSON.stringify(preapproval, null, 2));

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

  return {
    subscriptionId: subscriptionData.id,
    initPoint: subscriptionData.init_point,
    planId: null,
  };
}

async function createOneTimePayment(
  accessToken: string,
  plan: PlanInfo,
  customer: CustomerInfo,
  externalReference: string,
  backUrls: { success: string; failure: string; pending: string },
  notificationUrl: string
) {
  const cleanDocument = customer.document.replace(/\D/g, "");
  const isCompany = cleanDocument.length === 14;

  const preference = {
    items: [
      {
        id: plan.planId,
        title: `RSData - Plano ${plan.name} (${plan.type})`,
        description: `Assinatura do plano ${plan.name} - ${plan.type}`,
        quantity: 1,
        currency_id: "BRL",
        unit_price: plan.price,
      },
    ],
    payer: {
      email: customer.email,
      name: customer.name,
      identification: {
        type: isCompany ? "CNPJ" : "CPF",
        number: cleanDocument,
      },
      phone: {
        area_code: customer.phone.replace(/\D/g, "").substring(0, 2),
        number: customer.phone.replace(/\D/g, "").substring(2),
      },
      address: {
        zip_code: customer.address.cep.replace(/\D/g, ""),
        street_name: customer.address.street,
        street_number: customer.address.number,
      },
    },
    back_urls: backUrls,
    auto_return: "approved",
    external_reference: externalReference,
    statement_descriptor: "RSDATA SST",
    payment_methods: {
      excluded_payment_methods: [],
      excluded_payment_types: [],
      installments: 12,
      default_installments: 1,
    },
    binary_mode: false,
    notification_url: notificationUrl,
  };

  const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(preference),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("Mercado Pago API error:", data);
    throw new Error("Failed to create payment preference");
  }

  return {
    preferenceId: data.id,
    initPoint: data.init_point,
  };
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
    const { plan, customer, externalReference, subscriptionId } = payload;

    const reference = externalReference || `rsdata_${Date.now()}`;
    const origin = req.headers.get("origin") || "https://cadastro.rsdata.com.br";

    const backUrls = {
      success: `${origin}/pagamento-confirmado?status=approved&external_reference=${reference}&subscription_id=${subscriptionId || ''}`,
      failure: `${origin}/pagamento-confirmado?status=rejected&external_reference=${reference}`,
      pending: `${origin}/pagamento-confirmado?status=pending&external_reference=${reference}`,
    };

    const isMonthly = plan.type.toLowerCase() === "mensal";

    if (isMonthly) {
      const result = await createRecurringSubscription(
        accessToken,
        plan,
        customer,
        reference,
        backUrls
      );

      if (subscriptionId) {
        const supabaseUrl = Deno.env.get("SUPABASE_URL");
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

        await fetch(`${supabaseUrl}/rest/v1/subscriptions?id=eq.${subscriptionId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "apikey": supabaseServiceKey!,
            "Authorization": `Bearer ${supabaseServiceKey}`,
            "Prefer": "return=minimal"
          },
          body: JSON.stringify({
            mp_subscription_id: result.subscriptionId,
            mp_preapproval_plan_id: result.planId,
          }),
        });
      }

      return new Response(
        JSON.stringify({
          type: "subscription",
          subscriptionId: result.subscriptionId,
          planId: result.planId,
          initPoint: result.initPoint,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } else {
      const result = await createOneTimePayment(
        accessToken,
        plan,
        customer,
        reference,
        backUrls,
        `${Deno.env.get("SUPABASE_URL")}/functions/v1/mercadopago-webhook`
      );

      return new Response(
        JSON.stringify({
          type: "one_time",
          preferenceId: result.preferenceId,
          initPoint: result.initPoint,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    console.error("Error creating payment preference:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", message: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
