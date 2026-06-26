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
    const { titre, formation_id, target_audience, tone, platform } = await req.json();
    if (!titre) return jsonResponse({ success: false, error: "titre requis" }, 400);

    const supabase = serviceClient();
    const cfg = await loadAiConfig(supabase);

    if (!cfg.prompt_ads.trim()) {
      return jsonResponse({ success: false, error: "Prompt « publicités » non configuré (Admin → Paramètres)." }, 500);
    }

    let formationBlock = "";
    if (formation_id) {
      const { data: f } = await supabase
        .from("formations")
        .select("title, description, duree, prix, categorie")
        .eq("id", formation_id)
        .single();
      if (f) {
        formationBlock = `\n## FORMATION À PROMOUVOIR\nFormation : ${f.title} — ${f.categorie}, ${f.duree}, ${f.prix}€\nDescription : ${f.description ?? ""}`;
      }
    }

    const platformGuide: Record<string, string> = {
      facebook: "Facebook/Instagram (max 125 caractères pour le texte principal, accroche courte, émoji autorisés)",
      google: "Google Ads (titres max 30 car., descriptions max 90 car., mots-clés en avant)",
      linkedin: "LinkedIn (ton professionnel, 150 car. max, valoriser le développement professionnel)",
    };

    const prompt = renderTemplate(cfg.prompt_ads, {
      titre,
      platform_guide: platformGuide[platform] ?? platform,
      tone,
      target_audience: target_audience || "Adultes en reconversion ou demandeurs d'emploi à La Réunion",
      formation_block: formationBlock,
    });

    const rawText = await callOpenRouter(cfg, prompt);

    let parsed: Record<string, unknown>;
    try {
      parsed = extractJson(rawText);
    } catch {
      return jsonResponse({ success: false, error: "Erreur parsing: " + rawText.slice(0, 200) }, 500);
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
        image_prompt: (parsed.image_prompt as string) ?? null,
        status: "brouillon",
      })
      .select()
      .single();

    if (saveErr) return jsonResponse({ success: false, error: saveErr.message }, 500);

    return jsonResponse({ success: true, campaign: saved });
  } catch (err) {
    return jsonResponse({ success: false, error: err instanceof Error ? err.message : String(err) }, 500);
  }
});
