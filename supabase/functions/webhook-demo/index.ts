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
    const payload = await req.json();
    console.log("📦 Demo webhook received:", JSON.stringify(payload, null, 2));

    // No token validation for public demo registration

    // Extract buyer data (same Nexano format)
    const buyer =
      payload?.client ||
      payload?.data?.buyer ||
      payload?.data?.customer ||
      payload?.buyer ||
      payload?.customer ||
      payload;

    const name = (buyer?.name || buyer?.full_name || buyer?.nome || "").trim();
    const email = (buyer?.email || buyer?.email_address || "").trim().toLowerCase();
    const document = (
      buyer?.cpf || buyer?.cnpj || buyer?.doc || buyer?.document || buyer?.documento || ""
    ).toString().replace(/\D/g, "");

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email não encontrado no payload" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!document) {
      return new Response(
        JSON.stringify({ error: "Documento (CPF/CNPJ) não encontrado no payload" }),
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
        JSON.stringify({ status: "already_exists", message: "Usuário já cadastrado", user_id: existingUser.id }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create user with document as temp password
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: document,
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

    // Calculate trial end date (7 days from now)
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 7);

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

    // Assign admin role (demo user is the owner)
    await supabaseAdmin.from("user_roles").insert({
      user_id: userId,
      role: "admin",
    });

    console.log("✅ Demo webhook processed for:", email, "trial ends:", trialEndsAt.toISOString());

    return new Response(
      JSON.stringify({
        status: "demo_created",
        message: "Usuário demo criado com sucesso",
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
