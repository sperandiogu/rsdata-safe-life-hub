import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

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
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: adminUser } = await adminClient
      .from("admin_users")
      .select("is_active, role")
      .eq("id", user.id)
      .maybeSingle();

    if (!adminUser?.is_active) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = new URL(req.url);
    const path = url.pathname.replace(/.*manage-admin-users/, "");

    if (req.method === "GET" && (path === "" || path === "/")) {
      const { data: admins } = await adminClient
        .from("admin_users")
        .select("id, email, name, role, is_active, last_login, created_at")
        .order("created_at", { ascending: false });

      return new Response(JSON.stringify({ admins }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (req.method === "POST" && (path === "" || path === "/")) {
      const { email, password, name, role = "admin" } = await req.json();

      if (!email || !password || !name) {
        return new Response(JSON.stringify({ error: "email, password e name são obrigatórios" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

      if (createError) {
        return new Response(JSON.stringify({ error: createError.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error: insertError } = await adminClient.from("admin_users").insert({
        id: newUser.user.id,
        email,
        name,
        role,
        is_active: true,
      });

      if (insertError) {
        await adminClient.auth.admin.deleteUser(newUser.user.id);
        return new Response(JSON.stringify({ error: insertError.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true, id: newUser.user.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const idMatch = path.match(/^\/([^/]+)$/);
    if (req.method === "PUT" && idMatch) {
      const targetId = idMatch[1];
      const { is_active } = await req.json();

      if (targetId === user.id) {
        return new Response(JSON.stringify({ error: "Você não pode alterar sua própria conta" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error: updateError } = await adminClient
        .from("admin_users")
        .update({ is_active })
        .eq("id", targetId);

      if (updateError) {
        return new Response(JSON.stringify({ error: updateError.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
