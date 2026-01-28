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
    const { plan, customer, externalReference } = payload;

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
      back_urls: {
        success: `${req.headers.get("origin")}/pagamento-confirmado?status=approved&external_reference=${externalReference || `rsdata_${Date.now()}`}`,
        failure: `${req.headers.get("origin")}/pagamento-confirmado?status=rejected&external_reference=${externalReference || `rsdata_${Date.now()}`}`,
        pending: `${req.headers.get("origin")}/pagamento-confirmado?status=pending&external_reference=${externalReference || `rsdata_${Date.now()}`}`,
      },
      auto_return: "approved",
      external_reference: externalReference || `rsdata_${Date.now()}`,
      statement_descriptor: "RSDATA SST",
      payment_methods: {
        excluded_payment_types: [],
        installments: 12,
      },
      notification_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/mercadopago-webhook`,
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
      return new Response(
        JSON.stringify({ error: "Failed to create payment preference", details: data }),
        {
          status: response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        preferenceId: data.id,
        initPoint: data.init_point,
        sandboxInitPoint: data.sandbox_init_point,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error creating payment preference:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", message: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
