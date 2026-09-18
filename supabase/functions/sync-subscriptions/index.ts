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
    const mpAccessToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN")!;

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Same admin guard as cancel-subscription. verify_jwt alone is not enough here:
    // the anon key is itself a valid JWT and ships in the public bundle, so without
    // this check anyone could read every Mercado Pago id and amount off this endpoint.
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: adminUser } = await supabase
      .from("admin_users")
      .select("is_active")
      .eq("id", user.id)
      .maybeSingle();

    if (!adminUser?.is_active) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Mark as expired: active subscriptions without mp_subscription_id whose expires_at has passed
    const now = new Date().toISOString();
    await supabase
      .from("subscriptions")
      .update({ status: "expired" })
      .eq("status", "active")
      .is("mp_subscription_id", null)
      .lt("expires_at", now);

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

    // Drift detection: preapprovals that exist in Mercado Pago but have no row here.
    // The loop above only walks rows we already know about, so an orphan is invisible
    // to it — and invisible in the admin panel — until someone reconciles by hand.
    const known = new Set(subscriptions.map((s) => s.mp_subscription_id));
    const orphans: any[] = [];

    try {
      for (let offset = 0; ; offset += 50) {
        const searchResponse = await fetch(
          `https://api.mercadopago.com/preapproval/search?limit=50&offset=${offset}`,
          { headers: { Authorization: `Bearer ${mpAccessToken}` } }
        );

        if (!searchResponse.ok) {
          throw new Error(`MP search returned ${searchResponse.status}`);
        }

        const page = await searchResponse.json();
        const results = page.results || [];

        for (const mp of results) {
          if (!known.has(mp.id)) {
            orphans.push({
              mp_subscription_id: mp.id,
              status: mp.status,
              external_reference: mp.external_reference ?? null,
              payer_id: mp.payer_id ?? null,
              preapproval_plan_id: mp.preapproval_plan_id ?? null,
              amount: mp.auto_recurring?.transaction_amount ?? null,
              reason: mp.reason,
              date_created: mp.date_created,
            });
          }
        }

        if (results.length < 50 || offset + 50 >= (page.paging?.total ?? 0)) break;
      }
    } catch (error: any) {
      orphans.push({ error: `Orphan scan failed: ${error.message}` });
    }

    // An orphan you cannot identify cannot be reconciled, and the search payload
    // carries no payer contact. Pull the full record for the ones still live.
    for (const orphan of orphans) {
      if (orphan.status !== "authorized" && orphan.status !== "pending") continue;
      try {
        const detail = await fetch(
          `https://api.mercadopago.com/preapproval/${orphan.mp_subscription_id}`,
          { headers: { Authorization: `Bearer ${mpAccessToken}` } }
        );
        if (detail.ok) orphan.detail = await detail.json();
      } catch (_) {
        // best effort only; the orphan is already reported without it
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Sincronização concluída. ${syncResults.updated} assinaturas atualizadas, ${syncResults.errors} erros, ${orphans.length} no MP sem registro local`,
        results: { ...syncResults, orphans },
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
