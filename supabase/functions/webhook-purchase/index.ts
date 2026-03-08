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
    console.log("📦 Webhook received — full payload:", JSON.stringify(payload, null, 2));

    // ── 2. Token validation ────────────────────────────────────────
    const webhookToken = Deno.env.get("WEBHOOK_PURCHASE_TOKEN");
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
      payload?.customer ||
      payload;

    const name = (
      buyer?.name ||
      buyer?.full_name ||
      buyer?.nome ||
      ""
    ).trim();

    const email = (
      buyer?.email ||
      buyer?.email_address ||
      ""
    ).trim().toLowerCase();

    const document = (
      buyer?.cpf ||
      buyer?.cnpj ||
      buyer?.doc ||
      buyer?.document ||
      buyer?.documento ||
      ""
    ).toString().replace(/\D/g, "");

    // Unique event ID for idempotency
    const eventId =
      payload?.transaction?.id ||
      payload?.id ||
      payload?.event_id ||
      "";

    console.log("👤 Extracted data:", { name, email, document: document ? "***" : "(empty)", eventId });

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email do comprador não encontrado no payload" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!document) {
      return new Response(
        JSON.stringify({ error: "Documento (CPF/CNPJ) não encontrado no payload" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── 4. Supabase admin client ───────────────────────────────────
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // ── 5. Idempotency — check if user already exists ──────────────
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(
      (u: any) => u.email?.toLowerCase() === email
    );

    if (existingUser) {
      console.log("ℹ️ User already exists, skipping creation:", email);
      return new Response(
        JSON.stringify({
          status: "already_exists",
          message: "Usuário já cadastrado",
          user_id: existingUser.id,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── 6. Create user with document as temp password ──────────────
    const tempPassword = document; // CPF/CNPJ as initial password

    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { display_name: name || email },
    });

    if (createError) {
      console.error("❌ Error creating user:", createError);
      return new Response(
        JSON.stringify({ error: "Erro ao criar usuário", detail: createError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = newUser.user.id;
    console.log("✅ User created:", userId);

    // ── 7. Wait for trigger, then ensure profile + mark temp password ──
    await new Promise((r) => setTimeout(r, 500));

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (profile) {
      await supabaseAdmin
        .from("profiles")
        .update({ display_name: name || email, temp_password: true })
        .eq("user_id", userId);
    } else {
      await supabaseAdmin.from("profiles").insert({
        user_id: userId,
        display_name: name || email,
        temp_password: true,
      });
    }

    // ── 8. Assign admin role (buyer is the owner) ─────────────────
    await supabaseAdmin.from("user_roles").insert({
      user_id: userId,
      role: "admin",
    });

    console.log("✅ Webhook processed successfully for:", email);

    return new Response(
      JSON.stringify({
        status: "created",
        message: "Usuário criado com sucesso",
        user_id: userId,
        email,
      }),
      { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("❌ Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "Erro interno", detail: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
