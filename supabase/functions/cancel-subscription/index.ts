import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Unauthorized" }, 401);

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) return json({ error: "Unauthorized" }, 401);

    const { data: adminUser } = await adminClient
      .from("admin_users")
      .select("is_active")
      .eq("id", user.id)
      .maybeSingle();

    if (!adminUser?.is_active) return json({ error: "Forbidden" }, 403);

    const { subscription_id } = await req.json();
    if (!subscription_id) return json({ error: "subscription_id é obrigatório" }, 400);

    const { data: subscription, error: fetchError } = await adminClient
      .from("subscriptions")
      .select("id, status, mp_subscription_id")
      .eq("id", subscription_id)
      .maybeSingle();

    if (fetchError) return json({ error: fetchError.message }, 500);
    if (!subscription) return json({ error: "Assinatura não encontrada" }, 404);

    if (subscription.status === "cancelled") {
      return json({ success: true, message: "Assinatura já estava cancelada" });
    }

    // Cancel at Mercado Pago BEFORE touching the local row: if the DB write fails
    // after MP succeeded, sync-subscriptions reconciles it. The reverse order would
    // leave a row marked cancelled that is still billing the customer.
    if (subscription.mp_subscription_id) {
      const mpAccessToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN")!;
      const mpUrl = `https://api.mercadopago.com/preapproval/${subscription.mp_subscription_id}`;
      const mpHeaders = {
        Authorization: `Bearer ${mpAccessToken}`,
        "Content-Type": "application/json",
      };

      const mpResponse = await fetch(mpUrl, {
        method: "PUT",
        headers: mpHeaders,
        body: JSON.stringify({ status: "cancelled" }),
      });

      if (!mpResponse.ok) {
        // MP rejects a PUT on an already-cancelled preapproval. Confirm the real
        // state before failing, so a duplicate cancel does not strand the local row.
        const current = await fetch(mpUrl, { method: "GET", headers: mpHeaders });
        const currentStatus = current.ok ? (await current.json()).status : null;

        if (currentStatus !== "cancelled") {
          const detail = await mpResponse.text();
          console.error("MP cancel failed:", mpResponse.status, detail);
          return json(
            { error: `Mercado Pago recusou o cancelamento (${mpResponse.status})`, detail },
            502
          );
        }
      }
    }

    const { error: updateError } = await adminClient
      .from("subscriptions")
      .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
      .eq("id", subscription_id);

    if (updateError) {
      console.error("DB update failed after MP cancel:", updateError.message);
      return json(
        {
          error:
            "Cancelado no Mercado Pago, mas falhou ao atualizar o registro. Use 'Sincronizar MP' para corrigir.",
          detail: updateError.message,
        },
        500
      );
    }

    return json({
      success: true,
      message: subscription.mp_subscription_id
        ? "Assinatura cancelada no Mercado Pago e na plataforma"
        : "Assinatura cancelada na plataforma",
    });
  } catch (error: any) {
    console.error("Cancel error:", error);
    return json({ error: error.message }, 500);
  }
});
