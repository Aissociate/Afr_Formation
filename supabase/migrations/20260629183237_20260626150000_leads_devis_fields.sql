ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS formation_souhaitee text,
  ADD COLUMN IF NOT EXISTS devis_status        text NOT NULL DEFAULT 'aucun',
  ADD COLUMN IF NOT EXISTS devis_montant       numeric(10,2),
  ADD COLUMN IF NOT EXISTS devis_sent_at       timestamptz;

-- Table devis (quotes) linked to leads
CREATE TABLE IF NOT EXISTS devis (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id         uuid REFERENCES leads(id) ON DELETE CASCADE,
  formation_id    uuid REFERENCES formations(id) ON DELETE SET NULL,
  titre           text,
  content_json    jsonb,
  montant_ht      numeric(10,2),
  financement_nom text,
  reste_a_charge  text,
  status          text NOT NULL DEFAULT 'brouillon',
  sent_at         timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE devis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_select_devis" ON devis
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "admin_insert_devis" ON devis
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "admin_update_devis" ON devis
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "admin_delete_devis" ON devis
  FOR DELETE TO authenticated USING (true);
