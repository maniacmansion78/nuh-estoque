import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const DEMO_PASSWORD = "nuh2026";

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
    const payload = await req.json();
    console.log("📦 Demo webhook received:", JSON.stringify(payload, null, 2));

    const buyer = payload?.client || payload;

    const name = (buyer?.name || buyer?.full_name || buyer?.nome || "").trim();
    const email = (buyer?.email || buyer?.email_address || "").trim().toLowerCase();

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email não encontrado" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(
      (u: any) => u.email?.toLowerCase() === email
    );

    if (existingUser) {
      console.log("ℹ️ User already exists:", email);
      return new Response(
        JSON.stringify({ status: "already_exists", message: "Usuário já cadastrado" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create user with fixed demo password
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: DEMO_PASSWORD,
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
    console.log("✅ Demo user created:", userId);

    // Wait for trigger to create profile
    await new Promise((r) => setTimeout(r, 500));

    // Calculate trial end date (17 days from now)
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 17);

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (profile) {
      await supabaseAdmin
        .from("profiles")
        .update({
          display_name: name || email,
          temp_password: true,
          trial_ends_at: trialEndsAt.toISOString(),
        })
        .eq("user_id", userId);
    } else {
      await supabaseAdmin.from("profiles").insert({
        user_id: userId,
        display_name: name || email,
        temp_password: true,
        trial_ends_at: trialEndsAt.toISOString(),
      });
    }

    // Assign admin role
    await supabaseAdmin.from("user_roles").insert({
      user_id: userId,
      role: "admin",
    });

    console.log("✅ Demo processed for:", email, "trial ends:", trialEndsAt.toISOString());

    return new Response(
      JSON.stringify({
        status: "demo_created",
        message: "Conta demo criada com sucesso",
        user_id: userId,
        email,
        trial_ends_at: trialEndsAt.toISOString(),
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
