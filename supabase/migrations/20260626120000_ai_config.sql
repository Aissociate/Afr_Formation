-- AI configuration (OpenRouter) + editable prompt templates for the back office.
-- Singleton table (one row, id = 1). Admin-only RLS: NO public read policy, so the
-- API key is never exposed to anonymous visitors (unlike site_settings).
-- Edge functions read it with the service-role key, which bypasses RLS.

create table if not exists ai_config (
  id          integer primary key default 1,
  provider    text    not null default 'openrouter',
  base_url    text    not null default 'https://openrouter.ai/api/v1',
  api_key     text    not null default '',
  model       text    not null default 'anthropic/claude-3.5-sonnet',
  temperature numeric(3,2) not null default 0.7,
  max_tokens  integer not null default 2000,
  prompt_blog text    not null default '',
  prompt_ads  text    not null default '',
  prompt_pfi  text    not null default '',
  updated_at  timestamptz not null default now(),
  constraint ai_config_singleton check (id = 1)
);

alter table ai_config enable row level security;

-- Authenticated admins manage it; anon has no access at all.
drop policy if exists "admin_all_ai_config" on ai_config;
create policy "admin_all_ai_config" on ai_config
  for all to authenticated using (true) with check (true);

-- Seed the single row with the default prompt templates.
-- Placeholders {{name}} are substituted by the edge functions with live data.
insert into ai_config (id, prompt_blog, prompt_ads, prompt_pfi)
values (
  1,
  $blog$Tu es un rédacteur SEO expert en formation professionnelle à La Réunion pour AFR OI CFA.

Rédige un article de blog complet, optimisé SEO, en français pour le titre suivant.

Titre : "{{title}}"
Mots-clés : {{keywords}}

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

Réponds UNIQUEMENT avec le JSON.$blog$,
  $ads$Tu es un expert en publicité digitale pour la formation professionnelle à La Réunion.

Génère des variantes de publicités percutantes pour AFR OI CFA (organisme de formation 100% distanciel).

## CONTEXTE
- Campagne : {{titre}}
- Plateforme : {{platform_guide}}
- Ton souhaité : {{tone}}
- Audience cible : {{target_audience}}
{{formation_block}}

## POINTS CLÉS À METTRE EN AVANT
- Formation 100% distancielle (accessible depuis les Hauts, zones rurales)
- Financement CPF possible (zéro reste à charge)
- PFI personnalisé gratuit en quelques minutes
- Organisme basé à La Réunion, comprend les réalités locales

Génère exactement 3 variantes de publicité + 1 prompt image au format JSON :
{
  "variantes": [
    { "hook": "Type d'accroche (ex: question, chiffre, bénéfice)", "titre": "Titre accrocheur", "texte": "Corps du message publicitaire", "cta": "Appel à l'action (ex: Obtenez votre PFI gratuit)" },
    { "hook": "Type différent", "titre": "...", "texte": "...", "cta": "..." },
    { "hook": "Type différent", "titre": "...", "texte": "...", "cta": "..." }
  ],
  "image_prompt": "Prompt détaillé en anglais pour générer une image publicitaire (DALL-E/Midjourney) représentant cette campagne de formation à La Réunion"
}

Réponds UNIQUEMENT avec le JSON.$ads$,
  $pfi$Tu es un conseiller en formation professionnelle expert à La Réunion pour l'organisme AFR OI CFA (formation 100% distancielle).

Génère un Plan de Formation Individualisé (PFI) complet et personnalisé pour ce prospect.

## PROFIL DU PROSPECT
- Nom : {{nom}}
- Localité : {{localite}}
- Situation professionnelle : {{situation_pro}}
- Domaine d'intérêt : {{domaine_interesse}}
- Objectif de formation : {{objectif_formation}}
- Disponibilité : {{disponibilite}}
- Financements connus : {{financement_connu}}

## CATALOGUE DE FORMATIONS DISPONIBLES
{{formations_catalogue}}

## DISPOSITIFS DE FINANCEMENT DISPONIBLES
{{financements_disponibles}}

Génère un PFI au format JSON avec cette structure exacte :
{
  "titre": "PFI de [Prénom] — [Date]",
  "introduction": "Paragraphe personnalisé présentant le bilan du profil",
  "formations_recommandees": [
    { "titre": "Nom exact de la formation", "justification": "Pourquoi cette formation correspond au profil", "duree": "Durée", "prix": "Prix en €", "priorite": "haute|moyenne|basse" }
  ],
  "financements": [
    { "nom": "Nom du dispositif", "description": "Comment ce dispositif s'applique à ce profil", "montant": "Montant estimé ou max", "demarches": "Étapes concrètes pour en bénéficier" }
  ],
  "prochaines_etapes": "Plan d'action concret en 3-4 étapes pour démarrer",
  "note_conseiller": "Observation personnalisée du conseiller"
}

Réponds UNIQUEMENT avec le JSON, sans autre texte.$pfi$
)
on conflict (id) do nothing;
