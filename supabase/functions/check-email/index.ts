// supabase/functions/check-email/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle browser preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string") {
      return new Response(
        JSON.stringify({ exists: false, error: "Email missing" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Use the secrets that *actually* exist
    const url =
      Deno.env.get("PROJECT_URL") ??
      Deno.env.get("SUPABASE_URL") ??
      "";

    const serviceRoleKey =
      Deno.env.get("SERVICE_ROLE_KEY") ??
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ??
      "";

    if (!url || !serviceRoleKey) {
      console.error("Missing env vars in check-email", {
        hasUrl: !!url,
        hasKey: !!serviceRoleKey,
      });

      return new Response(
        JSON.stringify({
          exists: false,
          error: "Server misconfigured: missing env vars",
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

    const supabase = createClient(url, serviceRoleKey);

    // 🔎 Look up by email in the *profiles* table
    const { data, error } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("email", email.toLowerCase())
      .limit(1);

    if (error) {
      console.error("profiles query error", error);
      return new Response(
        JSON.stringify({
          exists: false,
          error: "Query error",
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

    const exists = Array.isArray(data) && data.length > 0;

    return new Response(
      JSON.stringify({ exists }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (err) {
    console.error("check-email error", err);
    const message = err instanceof Error ? err.message : "Unknown error";

    return new Response(
      JSON.stringify({
        exists: false,
        error: message,
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