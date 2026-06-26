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
    const { lead_id } = await req.json();
    if (!lead_id) return jsonResponse({ success: false, error: "lead_id requis" }, 400);

    const supabase = serviceClient();
    const cfg = await loadAiConfig(supabase);

    if (!cfg.prompt_pfi.trim()) {
      return jsonResponse({ success: false, error: "Prompt « PFI » non configuré (Admin → Paramètres)." }, 500);
    }

    // Fetch lead + questionnaire
    const { data: lead } = await supabase
      .from("leads")
      .select("*, questionnaire_responses(*)")
      .eq("id", lead_id)
      .single();

    if (!lead) return jsonResponse({ success: false, error: "Prospect introuvable" }, 404);

    // Fetch formations + financing modalities
    const { data: formations } = await supabase
      .from("formations")
      .select("id, title, description, objectifs, duree, prix, categorie")
      .eq("is_published", true);

    const { data: financements } = await supabase
      .from("financing_modalities")
      .select("name, description, conditions, montant_max")
      .eq("is_active", true);

    const questionnaire = lead.questionnaire_responses?.[0] ?? {};

    const formationsCatalogue = (formations ?? [])
      .map((f) => `- ${f.title} (${f.categorie}, ${f.duree}, ${f.prix}€) : ${f.description ?? ""}`)
      .join("\n");

    const financementsDisponibles = (financements ?? [])
      .map((f) => `- ${f.name} : ${f.description ?? ""} (Conditions: ${f.conditions ?? "voir détails"}, Max: ${f.montant_max ? f.montant_max + "€" : "variable"})`)
      .join("\n");

    const prompt = renderTemplate(cfg.prompt_pfi, {
      nom: lead.nom,
      localite: lead.localite ?? "Non renseigné",
      situation_pro: lead.situation_pro ?? questionnaire.situation_emploi ?? "Non renseigné",
      domaine_interesse: questionnaire.domaine_interesse ?? "Non renseigné",
      objectif_formation: questionnaire.objectif_formation ?? "Non renseigné",
      disponibilite: questionnaire.disponibilite ?? "Non renseignée",
      financement_connu: (questionnaire.financement_connu ?? []).join(", ") || "Aucun",
      formations_catalogue: formationsCatalogue,
      financements_disponibles: financementsDisponibles,
    });

    const rawText = await callOpenRouter(cfg, prompt);

    let pfiJson: Record<string, unknown>;
    try {
      pfiJson = extractJson(rawText);
    } catch {
      return jsonResponse({ success: false, error: "Erreur de parsing IA: " + rawText.slice(0, 200) }, 500);
    }

    const questionnaire_id = lead.questionnaire_responses?.[0]?.id ?? null;
    const { data: savedReport, error: saveErr } = await supabase
      .from("pfi_reports")
      .insert({
        lead_id,
        questionnaire_id,
        titre: (pfiJson.titre as string) ?? `PFI de ${lead.nom}`,
        content_json: pfiJson,
        formations_recommandees: pfiJson.formations_recommandees,
        financements_identifies: pfiJson.financements,
        status: "généré",
      })
      .select()
      .single();

    if (saveErr) return jsonResponse({ success: false, error: saveErr.message }, 500);

    return jsonResponse({ success: true, report: savedReport });
  } catch (err) {
    return jsonResponse({ success: false, error: err instanceof Error ? err.message : String(err) }, 500);
  }
});
