-- Réparation de la table bug_tickets (outil de ticketing "Développement").
--
-- Deux migrations concurrentes ont créé `bug_tickets` avec des schémas différents :
--   - 20260707120000_bug_tickets.sql          -> categorie / statut / page_url / screenshot_url / …
--   - 20260707175217_20260707120000_bug_tickets.sql -> type / status / notes
-- Les deux utilisant CREATE TABLE IF NOT EXISTS, la seconde appliquée est un no-op
-- et la table peut se retrouver sans les colonnes utilisées par DevAdmin.tsx.
--
-- Cette migration est idempotente et remet la table dans l'état attendu par
-- l'application, quel que soit le schéma actuellement en base.

CREATE TABLE IF NOT EXISTS bug_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titre text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 1. Colonnes attendues par l'application ------------------------------------

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

-- Les valeurs par défaut peuvent manquer si la table préexistait.
ALTER TABLE bug_tickets ALTER COLUMN categorie  SET DEFAULT 'bug';
ALTER TABLE bug_tickets ALTER COLUMN priorite   SET DEFAULT 'moyenne';
ALTER TABLE bug_tickets ALTER COLUMN statut     SET DEFAULT 'nouveau';
ALTER TABLE bug_tickets ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE bug_tickets ALTER COLUMN updated_at SET DEFAULT now();

-- 2. Reprise des données de l'ancien schéma (type / status / notes) ----------
-- Colonnes potentiellement absentes : on passe par du SQL dynamique.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name = 'bug_tickets' AND column_name = 'type') THEN
    EXECUTE 'UPDATE bug_tickets SET categorie = type WHERE categorie IS NULL AND type IS NOT NULL';
    EXECUTE 'ALTER TABLE bug_tickets DROP COLUMN type';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name = 'bug_tickets' AND column_name = 'status') THEN
    EXECUTE 'UPDATE bug_tickets SET statut = status WHERE statut IS NULL AND status IS NOT NULL';
    EXECUTE 'ALTER TABLE bug_tickets DROP COLUMN status';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name = 'bug_tickets' AND column_name = 'notes') THEN
    EXECUTE 'UPDATE bug_tickets SET reponse = notes WHERE reponse IS NULL AND notes IS NOT NULL';
    EXECUTE 'ALTER TABLE bug_tickets DROP COLUMN notes';
  END IF;
END $$;

-- Normalisation des valeurs de l'ancien vocabulaire vers celui de l'interface.
UPDATE bug_tickets SET statut   = 'nouveau' WHERE statut IN ('ouvert', 'open') OR statut IS NULL;
UPDATE bug_tickets SET priorite = 'moyenne' WHERE priorite = 'normale' OR priorite IS NULL;
UPDATE bug_tickets SET categorie = 'amélioration' WHERE categorie = 'feature';
UPDATE bug_tickets SET categorie = 'bug' WHERE categorie IS NULL;

-- 3. Index -------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS bug_tickets_statut_idx  ON bug_tickets (statut);
CREATE INDEX IF NOT EXISTS bug_tickets_created_idx ON bug_tickets (created_at DESC);

-- 4. RLS : accès complet pour les admins authentifiés ------------------------

ALTER TABLE bug_tickets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_select_bug_tickets" ON bug_tickets;
DROP POLICY IF EXISTS "admin_insert_bug_tickets" ON bug_tickets;
DROP POLICY IF EXISTS "admin_update_bug_tickets" ON bug_tickets;
DROP POLICY IF EXISTS "admin_delete_bug_tickets" ON bug_tickets;
DROP POLICY IF EXISTS "admin_all_bug_tickets" ON bug_tickets;

CREATE POLICY "admin_all_bug_tickets" ON bug_tickets
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 5. Bucket `media` pour les captures d'écran (préfixe bugs/) -----------------
-- La version régénérée de la migration ai_images a perdu cette partie.

INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "public_read_media" ON storage.objects;
CREATE POLICY "public_read_media" ON storage.objects
  FOR SELECT TO public USING (bucket_id = 'media');

DROP POLICY IF EXISTS "admin_write_media" ON storage.objects;
CREATE POLICY "admin_write_media" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'media');

DROP POLICY IF EXISTS "admin_update_media" ON storage.objects;
CREATE POLICY "admin_update_media" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'media') WITH CHECK (bucket_id = 'media');

DROP POLICY IF EXISTS "admin_delete_media" ON storage.objects;
CREATE POLICY "admin_delete_media" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'media');
