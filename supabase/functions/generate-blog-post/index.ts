import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });

  try {
    const { title, keywords } = await req.json();
    if (!title) return new Response(JSON.stringify({ success: false, error: "title requis" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) return new Response(JSON.stringify({ success: false, error: "Clé ANTHROPIC_API_KEY non configurée." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const prompt = `Tu es un rédacteur SEO expert en formation professionnelle à La Réunion pour AFR OI CFA.

Rédige un article de blog complet, optimisé SEO, en français pour le titre suivant.

Titre : "${title}"
Mots-clés : ${keywords || "formation professionnelle, La Réunion, financement CPF, distanciel"}

## CONSIGNES
- Longueur : 600-800 mots
- Structure avec balises HTML (h2, h3, p, ul, li, strong)
- Ton professionnel mais accessible, orienté vers les apprenants réunionnais
- Mentionner AFR OI CFA naturellement (1-2 fois max)
- Inclure des informations pratiques sur le financement et l'accès à la formation à La Réunion
- Optimisé pour les mots-clés cibles

Génère le contenu au format JSON :
{
  "content": "Le contenu HTML complet de l'article",
  "excerpt": "Résumé accrocheur de 160 caractères max",
  "seo_title": "Titre SEO optimisé (max 60 caractères)",
  "seo_description": "Meta description (max 160 caractères)"
}

Réponds UNIQUEMENT avec le JSON.`;

    const aiRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-opus-4-5",
        max_tokens: 2500,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const aiData = await aiRes.json();
    const rawText = aiData.content?.[0]?.text ?? "";

    let parsed: Record<string, unknown>;
    try {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch?.[0] ?? rawText);
    } catch {
      return new Response(JSON.stringify({ success: false, error: "Erreur parsing IA." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ success: true, ...parsed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: String(err) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
