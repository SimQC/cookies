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

    const { data: platformAds } = await supabase
      .from("platform_ads")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    const jsCode = generateJavaScript(config, platformAds || []);

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

function generateJavaScript(config: any, banners: any[]): string {
  const configData = config.config_data || {};
  const services = config.selected_services || [];

  let servicesCode = "";
  if (services.length > 0) {
    servicesCode = "\n\n// Services activés\n" +
      services.map((service: string) => {
        return `// tarteaucitron.user.${service} = 'YOUR_${service.toUpperCase()}_ID';`;
      }).join("\n");
  }

  let bannersCode = "";
  if (banners.length > 0) {
    bannersCode = "\n\n" + generateBannersCode(banners);
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

  return tarteaucitronScript + bannersCode;
}

function generateBannersCode(banners: any[]): string {
  const styles = `
var biscuitStyles = document.createElement('style');
biscuitStyles.textContent = \`
  .biscuit-banner {
    position: fixed;
    z-index: 999;
    background: #fff;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    padding: 8px;
    border-radius: 8px;
  }
  .biscuit-banner.top {
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
  }
  .biscuit-banner.bottom {
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
  }
  .biscuit-banner.left {
    left: 20px;
    top: 50%;
    transform: translateY(-50%);
  }
  .biscuit-banner.right {
    right: 20px;
    top: 50%;
    transform: translateY(-50%);
  }
  .biscuit-banner img {
    display: block;
    max-width: 100%;
    height: auto;
  }
  @media (max-width: 768px) {
    .biscuit-banner.left,
    .biscuit-banner.right {
      left: 10px;
      right: 10px;
      top: auto;
      bottom: 80px;
      transform: none;
    }
  }
\`;
document.head.appendChild(biscuitStyles);
`;

  const bannersHTML = banners
    .map((banner) => `
var banner${banner.id.replace(/-/g, '')} = document.createElement('div');
banner${banner.id.replace(/-/g, '')}.className = 'biscuit-banner ${banner.position}';
banner${banner.id.replace(/-/g, '')}.innerHTML = '<a href="${banner.link_url}" target="_blank" rel="noopener noreferrer"><img src="${banner.image_url}" alt="Advertisement" /></a>';
document.body.appendChild(banner${banner.id.replace(/-/g, '')});`
    )
    .join("");

  return styles + bannersHTML;
}
