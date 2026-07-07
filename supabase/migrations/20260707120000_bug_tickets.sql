-- Mini outil de ticketing "Développement".
-- Permet au client de remonter des bugs (avec capture d'écran) et à l'équipe
-- d'y répondre / de les résoudre depuis le back-office.

CREATE TABLE IF NOT EXISTS bug_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titre text NOT NULL,
  description text,
  categorie text DEFAULT 'bug',            -- bug | amélioration | question
  priorite text DEFAULT 'moyenne',         -- basse | moyenne | haute | critique
  statut text DEFAULT 'nouveau',           -- nouveau | en_cours | résolu | fermé
  page_url text,                           -- page / écran concerné
  screenshot_url text,                     -- capture d'écran (bucket media)
  rapporteur text,                         -- nom / email de la personne qui remonte
  reponse text,                            -- réponse / résolution apportée
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS bug_tickets_statut_idx ON bug_tickets (statut);
CREATE INDEX IF NOT EXISTS bug_tickets_created_idx ON bug_tickets (created_at DESC);

ALTER TABLE bug_tickets ENABLE ROW LEVEL SECURITY;

-- Accès complet pour les admins authentifiés (le client accède via le back-office).
DROP POLICY IF EXISTS "admin_all_bug_tickets" ON bug_tickets;
CREATE POLICY "admin_all_bug_tickets" ON bug_tickets
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Les captures d'écran réutilisent le bucket public `media` (préfixe bugs/).
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;
