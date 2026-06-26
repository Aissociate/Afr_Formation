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
    const { lead_id } = await req.json();
    if (!lead_id) return new Response(JSON.stringify({ success: false, error: "lead_id requis" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch lead + questionnaire
    const { data: lead } = await supabase
      .from("leads")
      .select("*, questionnaire_responses(*)")
      .eq("id", lead_id)
      .single();

    if (!lead) return new Response(JSON.stringify({ success: false, error: "Prospect introuvable" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    // Fetch formations
    const { data: formations } = await supabase
      .from("formations")
      .select("id, title, description, objectifs, duree, prix, categorie")
      .eq("is_published", true);

    // Fetch financing modalities
    const { data: financements } = await supabase
      .from("financing_modalities")
      .select("name, description, conditions, montant_max")
      .eq("is_active", true);

    const questionnaire = lead.questionnaire_responses?.[0] ?? {};

    const prompt = `Tu es un conseiller en formation professionnelle expert à La Réunion pour l'organisme AFR OI CFA (formation 100% distancielle).

Génère un Plan de Formation Individualisé (PFI) complet et personnalisé pour ce prospect.

## PROFIL DU PROSPECT
- Nom : ${lead.nom}
- Localité : ${lead.localite ?? "Non renseigné"}
- Situation professionnelle : ${lead.situation_pro ?? questionnaire.situation_emploi ?? "Non renseigné"}
- Domaine d'intérêt : ${questionnaire.domaine_interesse ?? "Non renseigné"}
- Objectif de formation : ${questionnaire.objectif_formation ?? "Non renseigné"}
- Disponibilité : ${questionnaire.disponibilite ?? "Non renseignée"}
- Financements connus : ${(questionnaire.financement_connu ?? []).join(", ") || "Aucun"}

## CATALOGUE DE FORMATIONS DISPONIBLES
${(formations ?? []).map(f => `- ${f.title} (${f.categorie}, ${f.duree}, ${f.prix}€) : ${f.description ?? ""}`).join("\n")}

## DISPOSITIFS DE FINANCEMENT DISPONIBLES
${(financements ?? []).map(f => `- ${f.name} : ${f.description ?? ""} (Conditions: ${f.conditions ?? "voir détails"}, Max: ${f.montant_max ? f.montant_max + "€" : "variable"})`).join("\n")}

Génère un PFI au format JSON avec cette structure exacte :
{
  "titre": "PFI de [Prénom] — [Date]",
  "introduction": "Paragraphe personnalisé présentant le bilan du profil",
  "formations_recommandees": [
    {
      "titre": "Nom exact de la formation",
      "justification": "Pourquoi cette formation correspond au profil",
      "duree": "Durée",
      "prix": "Prix en €",
      "priorite": "haute|moyenne|basse"
    }
  ],
  "financements": [
    {
      "nom": "Nom du dispositif",
      "description": "Comment ce dispositif s'applique à ce profil",
      "montant": "Montant estimé ou max",
      "demarches": "Étapes concrètes pour en bénéficier"
    }
  ],
  "prochaines_etapes": "Plan d'action concret en 3-4 étapes pour démarrer",
  "note_conseiller": "Observation personnalisée du conseiller"
}

Réponds UNIQUEMENT avec le JSON, sans autre texte.`;

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
        max_tokens: 2000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const aiData = await aiRes.json();
    const rawText = aiData.content?.[0]?.text ?? "";

    let pfiJson: Record<string, unknown>;
    try {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      pfiJson = JSON.parse(jsonMatch?.[0] ?? rawText);
    } catch {
      return new Response(JSON.stringify({ success: false, error: "Erreur de parsing IA: " + rawText.slice(0, 200) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Save report
    const questionnaire_id = lead.questionnaire_responses?.[0]?.id ?? null;
    const { data: savedReport, error: saveErr } = await supabase
      .from("pfi_reports")
      .insert({
        lead_id,
        questionnaire_id,
        titre: pfiJson.titre as string ?? `PFI de ${lead.nom}`,
        content_json: pfiJson,
        formations_recommandees: pfiJson.formations_recommandees,
        financements_identifies: pfiJson.financements,
        status: "généré",
      })
      .select()
      .single();

    if (saveErr) return new Response(JSON.stringify({ success: false, error: saveErr.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    return new Response(JSON.stringify({ success: true, report: savedReport }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: String(err) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
