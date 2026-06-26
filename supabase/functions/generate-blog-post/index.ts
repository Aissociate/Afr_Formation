import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {
  corsHeaders,
  jsonResponse,
  serviceClient,
  loadAiConfig,
  renderTemplate,
  callOpenRouter,
  extractJson,
} from "../_shared/ai.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });

  try {
    const { title, keywords } = await req.json();
    if (!title) return jsonResponse({ success: false, error: "title requis" }, 400);

    const supabase = serviceClient();
    const cfg = await loadAiConfig(supabase);

    if (!cfg.prompt_blog.trim()) {
      return jsonResponse({ success: false, error: "Prompt « blog » non configuré (Admin → Paramètres)." }, 500);
    }

    const prompt = renderTemplate(cfg.prompt_blog, {
      title,
      keywords: keywords || "formation professionnelle, La Réunion, financement CPF, distanciel",
    });

    const rawText = await callOpenRouter(cfg, prompt);

    let parsed: Record<string, unknown>;
    try {
      parsed = extractJson(rawText);
    } catch {
      return jsonResponse({ success: false, error: "Erreur parsing IA: " + rawText.slice(0, 200) }, 500);
    }

    return jsonResponse({ success: true, ...parsed });
  } catch (err) {
    return jsonResponse({ success: false, error: err instanceof Error ? err.message : String(err) }, 500);
  }
});
