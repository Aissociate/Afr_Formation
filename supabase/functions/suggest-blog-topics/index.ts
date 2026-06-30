import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {
  corsHeaders,
  jsonResponse,
  serviceClient,
  loadAiConfig,
  callOpenRouter,
  extractJson,
} from "../_shared/ai.ts";

// Propose des sujets d'articles de blog ancrés sur le catalogue de formations
// et le positionnement d'AFR (Titres Professionnels, La Réunion, distanciel,
// financements hors CPF). Renvoie { topics: [{ title, keywords }] }.

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const count = Math.min(Math.max(Number(body.count) || 4, 1), 10);

    const supabase = serviceClient();
    const cfg = await loadAiConfig(supabase);

    const { data: formations } = await supabase
      .from("formations")
      .select("title, categorie")
      .eq("is_published", true);

    const catalogue = (formations ?? [])
      .map((f) => `- ${f.title} (${f.categorie ?? ""})`)
      .join("\n") || "- (catalogue à venir)";

    const prompt = `Tu es un stratège de contenu SEO pour AFR OI CFA, organisme de formation à La Réunion.
Contexte : Titres Professionnels du Ministère du Travail, formation 100% distancielle accessible partout à La Réunion (y compris les Hauts), financements OPCO / France Travail (AIF) / Région Réunion. IMPORTANT : ces formations ne sont PAS éligibles au CPF — ne propose jamais de sujet centré sur le CPF.

CATALOGUE DE FORMATIONS :
${catalogue}

Propose ${count} sujets d'articles de blog pertinents, variés et optimisés SEO, autour de ces formations, des métiers visés, de l'insertion professionnelle, du financement (hors CPF) et de la formation à distance à La Réunion. Évite les doublons.

Réponds UNIQUEMENT avec un JSON de cette forme exacte :
{
  "topics": [
    { "title": "Titre d'article accrocheur et orienté SEO", "keywords": "mot-clé 1, mot-clé 2, mot-clé 3" }
  ]
}`;

    const rawText = await callOpenRouter(cfg, prompt);

    let parsed: { topics?: { title: string; keywords: string }[] };
    try {
      parsed = extractJson(rawText);
    } catch {
      return jsonResponse({ success: false, error: "Erreur parsing IA: " + rawText.slice(0, 200) }, 500);
    }

    return jsonResponse({ success: true, topics: parsed.topics ?? [] });
  } catch (err) {
    return jsonResponse({ success: false, error: err instanceof Error ? err.message : String(err) }, 500);
  }
});
