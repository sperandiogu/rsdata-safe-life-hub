import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface MercadoPagoSubscription {
  id: string;
  status: string;
  last_modified: string;
  payer_id: string;
  back_url: string;
  collector_id: string;
  application_id: string;
  plan_id: string;
  reason: string;
  external_reference: string;
  date_created: string;
  last_modified_date: string;
  init_point: string;
  auto_recurring: {
    frequency: number;
    frequency_type: string;
    transaction_amount: number;
    currency_id: string;
    start_date: string;
    end_date: string | null;
    billing_day: number;
    billing_day_proportional: boolean;
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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const mpAccessToken = Deno.env.get("MP_ACCESS_TOKEN")!;

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    const { data: subscriptions, error: fetchError } = await supabase
      .from("subscriptions")
      .select("id, mp_subscription_id, status")
      .not("mp_subscription_id", "is", null);

    if (fetchError) {
      throw new Error(`Error fetching subscriptions: ${fetchError.message}`);
    }

    const syncResults = {
      total: subscriptions?.length || 0,
      updated: 0,
      errors: 0,
      details: [] as any[],
    };

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "Nenhuma assinatura com ID do Mercado Pago encontrada",
          results: syncResults,
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    for (const subscription of subscriptions) {
      try {
        const mpResponse = await fetch(
          `https://api.mercadopago.com/preapproval/${subscription.mp_subscription_id}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${mpAccessToken}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!mpResponse.ok) {
          syncResults.errors++;
          syncResults.details.push({
            subscription_id: subscription.id,
            mp_subscription_id: subscription.mp_subscription_id,
            error: `MP API returned ${mpResponse.status}`,
          });
          continue;
        }

        const mpData: MercadoPagoSubscription = await mpResponse.json();

        const statusMapping: Record<string, string> = {
          authorized: "active",
          paused: "paused",
          cancelled: "cancelled",
          pending: "pending",
        };

        const newStatus = statusMapping[mpData.status] || mpData.status;

        if (newStatus !== subscription.status) {
          const { error: updateError } = await supabase
            .from("subscriptions")
            .update({ status: newStatus })
            .eq("id", subscription.id);

          if (updateError) {
            syncResults.errors++;
            syncResults.details.push({
              subscription_id: subscription.id,
              mp_subscription_id: subscription.mp_subscription_id,
              error: `Update error: ${updateError.message}`,
            });
          } else {
            syncResults.updated++;
            syncResults.details.push({
              subscription_id: subscription.id,
              mp_subscription_id: subscription.mp_subscription_id,
              old_status: subscription.status,
              new_status: newStatus,
              success: true,
            });
          }
        } else {
          syncResults.details.push({
            subscription_id: subscription.id,
            mp_subscription_id: subscription.mp_subscription_id,
            status: newStatus,
            message: "Status já está sincronizado",
          });
        }
      } catch (error: any) {
        syncResults.errors++;
        syncResults.details.push({
          subscription_id: subscription.id,
          mp_subscription_id: subscription.mp_subscription_id,
          error: error.message,
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Sincronização concluída. ${syncResults.updated} assinaturas atualizadas, ${syncResults.errors} erros`,
        results: syncResults,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error: any) {
    console.error("Sync error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
