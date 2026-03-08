import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-webhook-token",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    // ── 1. Parse payload ───────────────────────────────────────────
    const payload = await req.json();
    console.log("📦 Webhook refusal received — full payload:", JSON.stringify(payload, null, 2));

    // ── 2. Token validation ────────────────────────────────────────
    const webhookToken = Deno.env.get("WEBHOOK_REFUSAL_TOKEN");
    if (webhookToken) {
      const incomingToken =
        req.headers.get("x-webhook-token") ||
        req.headers.get("authorization")?.replace("Bearer ", "") ||
        payload?.token;

      if (incomingToken !== webhookToken) {
        console.error("❌ Invalid webhook token");
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      console.log("✅ Webhook token validated");
    } else {
      console.warn("⚠️ WEBHOOK_PURCHASE_TOKEN not set — skipping token validation (test mode)");
    }

    // ── 3. Extract buyer data (Nexano format: payload.client) ─────
    const buyer =
      payload?.client ||
      payload?.data?.buyer ||
      payload?.data?.customer ||
      payload?.buyer ||
      payload;

    const email = (
      buyer?.email ||
      buyer?.email_address ||
      ""
    ).trim().toLowerCase();

    const eventId =
      payload?.transaction?.id ||
      payload?.id ||
      payload?.event_id ||
      "";

    const eventType = payload?.event || "UNKNOWN";

    console.log("👤 Refusal event:", { email: email || "(empty)", eventId, eventType });

    // ── 4. If no email, log and return success ─────────────────────
    if (!email) {
      console.warn("⚠️ No email found in refusal payload — ignoring event");
      return new Response(
        JSON.stringify({ status: "ignored", message: "Email não encontrado no payload" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── 5. Supabase admin client ───────────────────────────────────
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // ── 6. Find user by email ──────────────────────────────────────
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(
      (u: any) => u.email?.toLowerCase() === email
    );

    if (!existingUser) {
      console.warn("⚠️ User not found for email:", email, "— logging and returning success");
      return new Response(
        JSON.stringify({ status: "user_not_found", message: "Usuário não encontrado, evento registrado" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = existingUser.id;

    // ── 7. Check if already blocked (idempotency) ──────────────────
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("blocked")
      .eq("user_id", userId)
      .maybeSingle();

    if (profile?.blocked) {
      console.log("ℹ️ User already blocked:", email);
      return new Response(
        JSON.stringify({ status: "already_blocked", message: "Usuário já bloqueado", user_id: userId }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── 8. Block user ──────────────────────────────────────────────
    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({ blocked: true })
      .eq("user_id", userId);

    if (updateError) {
      console.error("❌ Error blocking user:", updateError);
      return new Response(
        JSON.stringify({ error: "Erro ao bloquear usuário", detail: updateError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── 9. Invalidate active sessions by banning the user ──────────
    await supabaseAdmin.auth.admin.updateUserById(userId, { ban_duration: "876000h" }); // ~100 years

    console.log("✅ User blocked and sessions invalidated:", email);

    return new Response(
      JSON.stringify({
        status: "blocked",
        message: "Usuário bloqueado com sucesso",
        user_id: userId,
        email,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("❌ Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "Erro interno", detail: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
