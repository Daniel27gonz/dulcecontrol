import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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
    const body = await req.json();
    console.log("Hotmart webhook received, event:", body.event);

    // 1. Validate hottok token
    const expectedToken = Deno.env.get("HOTMART_HOTTOK");
    if (expectedToken && body.hottok !== expectedToken) {
      console.error("Invalid hottok token");
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 2. Only process PURCHASE_APPROVED events
    if (body.event !== "PURCHASE_APPROVED") {
      console.log("Ignoring event:", body.event);
      return new Response(
        JSON.stringify({ message: "Event ignored", event: body.event }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 3. Extract buyer data from Hotmart payload
    const buyer = body.data?.buyer;
    if (!buyer?.email) {
      console.error("Missing buyer email:", JSON.stringify(buyer));
      return new Response(
        JSON.stringify({ error: "Missing buyer email" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const email = buyer.email;
    // Use document, phone, or generate a random password as fallback
    const password = buyer.document || buyer.checkout_phone || crypto.randomUUID().slice(0, 12);
    const name = buyer.name || "Usuario";
    console.log("Creating user:", email, name, "password source:", buyer.document ? "document" : buyer.checkout_phone ? "phone" : "generated");

    // 4. Create user with service role
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, document: buyer.document || "", phone: buyer.checkout_phone || "" },
    });

    if (error) {
      console.error("Error creating user:", error.message);
      return new Response(
        JSON.stringify({ error: error.message }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("User created successfully:", data.user.id, email);

    return new Response(
      JSON.stringify({
        success: true,
        user_id: data.user.id,
        email: data.user.email,
      }),
      {
        status: 201,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
