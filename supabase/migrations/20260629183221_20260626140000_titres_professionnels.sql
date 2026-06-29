CREATE TABLE IF NOT EXISTS titres_professionnels (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text NOT NULL,
  slug        text UNIQUE NOT NULL,
  code_rncp   text,
  niveau      text NOT NULL DEFAULT 'Niveau 4',
  secteur     text,
  description text,
  objectifs   text,
  duree       text,
  prix        numeric(10,2),
  image_url   text,
  is_published boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE titres_professionnels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_titres" ON titres_professionnels
  FOR SELECT USING (is_published = true);

CREATE POLICY "admin_insert_titres" ON titres_professionnels
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "admin_update_titres" ON titres_professionnels
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "admin_delete_titres" ON titres_professionnels
  FOR DELETE TO authenticated USING (true);
