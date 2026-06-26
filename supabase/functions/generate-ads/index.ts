import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });

  try {
    const { titre, formation_id, target_audience, tone, platform } = await req.json();
    if (!titre) return new Response(JSON.stringify({ success: false, error: "titre requis" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let formationInfo = "";
    if (formation_id) {
      const { data: f } = await supabase.from("formations").select("title, description, duree, prix, categorie").eq("id", formation_id).single();
      if (f) formationInfo = `Formation : ${f.title} — ${f.categorie}, ${f.duree}, ${f.prix}€\nDescription : ${f.description ?? ""}`;
    }

    const platformGuide: Record<string, string> = {
      facebook: "Facebook/Instagram (max 125 caractères pour le texte principal, accroche courte, émoji autorisés)",
      google: "Google Ads (titres max 30 car., descriptions max 90 car., mots-clés en avant)",
      linkedin: "LinkedIn (ton professionnel, 150 car. max, valoriser le développement professionnel)",
    };

    const prompt = `Tu es un expert en publicité digitale pour la formation professionnelle à La Réunion.

Génère des variantes de publicités percutantes pour AFR OI CFA (organisme de formation 100% distanciel).

## CONTEXTE
- Campagne : ${titre}
- Plateforme : ${platformGuide[platform] ?? platform}
- Ton souhaité : ${tone}
- Audience cible : ${target_audience || "Adultes en reconversion ou demandeurs d'emploi à La Réunion"}
${formationInfo ? `\n## FORMATION À PROMOUVOIR\n${formationInfo}` : ""}

## POINTS CLÉS À METTRE EN AVANT
- Formation 100% distancielle (accessible depuis les Hauts, zones rurales)
- Financement CPF possible (zéro reste à charge)
- PFI personnalisé gratuit en quelques minutes
- Organisme basé à La Réunion, comprend les réalités locales

Génère exactement 3 variantes de publicité + 1 prompt image au format JSON :
{
  "variantes": [
    {
      "hook": "Type d'accroche (ex: question, chiffre, bénéfice)",
      "titre": "Titre accrocheur",
      "texte": "Corps du message publicitaire",
      "cta": "Appel à l'action (ex: Obtenez votre PFI gratuit)"
    },
    {
      "hook": "Type différent",
      "titre": "...",
      "texte": "...",
      "cta": "..."
    },
    {
      "hook": "Type différent",
      "titre": "...",
      "texte": "...",
      "cta": "..."
    }
  ],
  "image_prompt": "Prompt détaillé en anglais pour générer une image publicitaire (DALL-E/Midjourney) représentant cette campagne de formation à La Réunion"
}

Réponds UNIQUEMENT avec le JSON.`;

    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) return new Response(JSON.stringify({ success: false, error: "Clé API IA non configurée. Ajoutez ANTHROPIC_API_KEY dans les secrets." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const aiRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-opus-4-5",
        max_tokens: 1500,
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
      return new Response(JSON.stringify({ success: false, error: "Erreur parsing: " + rawText.slice(0, 200) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: saved, error: saveErr } = await supabase
      .from("ad_campaigns")
      .insert({
        titre,
        formation_id: formation_id || null,
        target_audience: target_audience || null,
        tone,
        platform,
        ad_text_variants: parsed.variantes ?? [],
        image_prompt: parsed.image_prompt as string ?? null,
        status: "brouillon",
      })
      .select()
      .single();

    if (saveErr) return new Response(JSON.stringify({ success: false, error: saveErr.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    return new Response(JSON.stringify({ success: true, campaign: saved }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: String(err) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
