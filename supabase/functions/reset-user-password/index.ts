import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Find user by email
  const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
    type: "magiclink",
    email: "Paulinacanohdz@gmail.com",
  });

  if (linkError || !linkData?.user?.id) {
    return new Response(JSON.stringify({ error: "User not found", details: linkError }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(linkData.user.id, {
    password: "CostoPostre2026!",
  });

  return new Response(JSON.stringify({ success: !updateError, error: updateError }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
