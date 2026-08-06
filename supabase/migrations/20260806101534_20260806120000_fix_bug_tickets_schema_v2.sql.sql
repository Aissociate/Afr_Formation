-- Remet bug_tickets dans le schéma attendu par l'application (idempotent)
CREATE TABLE IF NOT EXISTS bug_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titre text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE bug_tickets
  ADD COLUMN IF NOT EXISTS description    text,
  ADD COLUMN IF NOT EXISTS categorie      text DEFAULT 'bug',
  ADD COLUMN IF NOT EXISTS priorite       text DEFAULT 'moyenne',
  ADD COLUMN IF NOT EXISTS statut         text DEFAULT 'nouveau',
  ADD COLUMN IF NOT EXISTS page_url       text,
  ADD COLUMN IF NOT EXISTS screenshot_url text,
  ADD COLUMN IF NOT EXISTS rapporteur     text,
  ADD COLUMN IF NOT EXISTS reponse        text,
  ADD COLUMN IF NOT EXISTS resolved_at    timestamptz,
  ADD COLUMN IF NOT EXISTS updated_at     timestamptz DEFAULT now();

ALTER TABLE bug_tickets ALTER COLUMN categorie  SET DEFAULT 'bug';
ALTER TABLE bug_tickets ALTER COLUMN priorite   SET DEFAULT 'moyenne';
ALTER TABLE bug_tickets ALTER COLUMN statut     SET DEFAULT 'nouveau';
ALTER TABLE bug_tickets ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE bug_tickets ALTER COLUMN updated_at SET DEFAULT now();

-- Reprise des données de l'ancien schéma (type / status / notes), puis suppression
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name = 'bug_tickets' AND column_name = 'type') THEN
    EXECUTE 'UPDATE bug_tickets SET categorie = type WHERE categorie IS NULL AND type IS NOT NULL';
    EXECUTE 'ALTER TABLE bug_tickets ALTER COLUMN type DROP NOT NULL';
    EXECUTE 'ALTER TABLE bug_tickets DROP COLUMN type';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name = 'bug_tickets' AND column_name = 'status') THEN
    EXECUTE 'UPDATE bug_tickets SET statut = status WHERE statut IS NULL AND status IS NOT NULL';
    EXECUTE 'ALTER TABLE bug_tickets ALTER COLUMN status DROP NOT NULL';
    EXECUTE 'ALTER TABLE bug_tickets DROP COLUMN status';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name = 'bug_tickets' AND column_name = 'notes') THEN
    EXECUTE 'UPDATE bug_tickets SET reponse = notes WHERE reponse IS NULL AND notes IS NOT NULL';
    EXECUTE 'ALTER TABLE bug_tickets DROP COLUMN notes';
  END IF;
END $$;

UPDATE bug_tickets SET statut    = 'nouveau'      WHERE statut IN ('ouvert','open') OR statut IS NULL;
UPDATE bug_tickets SET priorite  = 'moyenne'      WHERE priorite = 'normale' OR priorite IS NULL;
UPDATE bug_tickets SET categorie = 'amélioration' WHERE categorie = 'feature';
UPDATE bug_tickets SET categorie = 'bug'          WHERE categorie IS NULL;

-- RLS : accès complet pour les admins authentifiés
ALTER TABLE bug_tickets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin_select_bug_tickets" ON bug_tickets;
DROP POLICY IF EXISTS "admin_insert_bug_tickets" ON bug_tickets;
DROP POLICY IF EXISTS "admin_update_bug_tickets" ON bug_tickets;
DROP POLICY IF EXISTS "admin_delete_bug_tickets" ON bug_tickets;
DROP POLICY IF EXISTS "admin_all_bug_tickets" ON bug_tickets;
CREATE POLICY "admin_all_bug_tickets" ON bug_tickets
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Force le rechargement du cache de schéma PostgREST (l'origine du PGRST204)
NOTIFY pgrst, 'reload schema';
