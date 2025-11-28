import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const url = new URL(req.url);
    const configId = url.searchParams.get("id");

    if (!configId) {
      return new Response(
        JSON.stringify({ error: "Missing configuration ID" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: config, error: configError } = await supabase
      .from("configurations")
      .select("*")
      .eq("id", configId)
      .eq("is_active", true)
      .maybeSingle();

    if (configError || !config) {
      return new Response(
        JSON.stringify({ error: "Configuration not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const jsCode = generateJavaScript(config);

    return new Response(jsCode, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/javascript",
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

function generateJavaScript(config: any): string {
  const configData = config.config_data || {};
  const services = config.selected_services || [];

  let servicesCode = "";
  if (services.length > 0) {
    servicesCode = "\n\n// Services activés\n" +
      services.map((service: string) => {
        return `// tarteaucitron.user.${service} = 'YOUR_${service.toUpperCase()}_ID';`;
      }).join("\n");
  }

  const tarteaucitronScript = `
(function() {
  var script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/gh/AmauriC/tarteaucitron.js@1.27.1/tarteaucitron.min.js';
  script.onload = function() {
    tarteaucitron.init(${JSON.stringify(configData, null, 2)});${servicesCode}
  };
  document.head.appendChild(script);
})();`;

  return tarteaucitronScript;
}
