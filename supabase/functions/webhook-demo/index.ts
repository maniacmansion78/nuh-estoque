import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DEMO_PASSWORD = "nuhdemo2026";
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
    const buyer = payload?.client || payload;

    const name = (buyer?.name || buyer?.full_name || buyer?.nome || "").trim();
    const email = (buyer?.email || buyer?.email_address || "").trim().toLowerCase();

    if (name.length < 2 || name.length > 120) {
      return new Response(JSON.stringify({ error: "Informe um nome válido." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!EMAIL_REGEX.test(email) || email.length > 160) {
      return new Response(JSON.stringify({ error: "Informe um email válido." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: existingUsers, error: listUsersError } = await supabaseAdmin.auth.admin.listUsers();
    if (listUsersError) throw listUsersError;

    const existingUser = existingUsers?.users?.find((user) => user.email?.toLowerCase() === email);
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 30);
    const trialEndsAtIso = trialEndsAt.toISOString();

    if (existingUser) {
      const { data: existingProfile, error: profileError } = await supabaseAdmin
        .from("profiles")
        .select("id, trial_ends_at, temp_password")
        .eq("user_id", existingUser.id)
        .maybeSingle();

      if (profileError) throw profileError;

      const isDemoAccount = Boolean(existingProfile?.trial_ends_at) || Boolean(existingProfile?.temp_password);

      if (!isDemoAccount) {
        return new Response(
          JSON.stringify({ status: "already_exists", message: "Este email já possui uma conta ativa." }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { error: resetError } = await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
        password: DEMO_PASSWORD,
        email_confirm: true,
        user_metadata: { display_name: name || email },
      });

      if (resetError) throw resetError;

      const profilePayload = {
        display_name: name || email,
        temp_password: true,
        blocked: false,
        trial_ends_at: trialEndsAtIso,
      };

      if (existingProfile?.id) {
        const { error: updateProfileError } = await supabaseAdmin
          .from("profiles")
          .update(profilePayload)
          .eq("user_id", existingUser.id);

        if (updateProfileError) throw updateProfileError;
      } else {
        const { error: insertProfileError } = await supabaseAdmin.from("profiles").insert({
          user_id: existingUser.id,
          ...profilePayload,
        });

        if (insertProfileError) throw insertProfileError;
      }

      const { data: existingRole, error: roleCheckError } = await supabaseAdmin
        .from("user_roles")
        .select("id")
        .eq("user_id", existingUser.id)
        .eq("role", "admin")
        .maybeSingle();

      if (roleCheckError) throw roleCheckError;

      if (!existingRole) {
        const { error: roleInsertError } = await supabaseAdmin.from("user_roles").insert({
          user_id: existingUser.id,
          role: "admin",
        });

        if (roleInsertError) throw roleInsertError;
      }

      return new Response(
        JSON.stringify({
          status: "demo_reset",
          message: "Acesso demo reativado com sucesso",
          email,
          password: DEMO_PASSWORD,
          trial_ends_at: trialEndsAtIso,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: DEMO_PASSWORD,
      email_confirm: true,
      user_metadata: { display_name: name || email },
    });

    if (createError) throw createError;

    const userId = newUser.user.id;
    await new Promise((resolve) => setTimeout(resolve, 400));

    const { error: profileUpsertError } = await supabaseAdmin.from("profiles").upsert(
      {
        user_id: userId,
        display_name: name || email,
        temp_password: true,
        blocked: false,
        trial_ends_at: trialEndsAtIso,
      },
      { onConflict: "user_id" }
    );

    if (profileUpsertError) throw profileUpsertError;

    const { error: roleInsertError } = await supabaseAdmin.from("user_roles").insert({
      user_id: userId,
      role: "admin",
    });

    if (roleInsertError && !String(roleInsertError.message || "").toLowerCase().includes("duplicate")) {
      throw roleInsertError;
    }

    return new Response(
      JSON.stringify({
        status: "demo_created",
        message: "Conta demo criada com sucesso",
        email,
        password: DEMO_PASSWORD,
        trial_ends_at: trialEndsAtIso,
      }),
      { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno";
    console.error("webhook-demo error:", message);

    return new Response(JSON.stringify({ error: "Erro interno", detail: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
