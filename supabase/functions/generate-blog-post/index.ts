import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {
  corsHeaders,
  jsonResponse,
  serviceClient,
  loadAiConfig,
  renderTemplate,
  callOpenRouter,
  extractJson,
  generateImage,
} from "../_shared/ai.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });

  try {
    const { title, keywords, with_image = true } = await req.json();
    if (!title) return jsonResponse({ success: false, error: "title requis" }, 400);

    const supabase = serviceClient();
    const cfg = await loadAiConfig(supabase);

    if (!cfg.prompt_blog.trim()) {
      return jsonResponse({ success: false, error: "Prompt « blog » non configuré (Admin → Paramètres)." }, 500);
    }

    const prompt = renderTemplate(cfg.prompt_blog, {
      title,
      keywords: keywords || "formation professionnelle, titre professionnel, La Réunion, distanciel",
    });

    const rawText = await callOpenRouter(cfg, prompt);

    let parsed: Record<string, unknown>;
    try {
      parsed = extractJson(rawText);
    } catch {
      return jsonResponse({ success: false, error: "Erreur parsing IA: " + rawText.slice(0, 200) }, 500);
    }

    // Cover image (best-effort: never blocks the article generation).
    let cover_image: string | null = null;
    if (with_image) {
      cover_image = await generateImage(
        cfg,
        supabase,
        `Image de couverture professionnelle et moderne pour un article de blog intitulé "${title}". Thème : formation professionnelle / Titres Professionnels à La Réunion. Style éditorial épuré, lumineux, palette mauve et bleu-vert. Sans aucun texte ni logo.`,
        "blog",
      );
    }

    return jsonResponse({ success: true, ...parsed, cover_image });
  } catch (err) {
    return jsonResponse({ success: false, error: err instanceof Error ? err.message : String(err) }, 500);
  }
});
