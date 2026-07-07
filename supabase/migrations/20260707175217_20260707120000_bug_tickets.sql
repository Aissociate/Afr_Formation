-- Table de tickets de bug / demandes internes (page DevAdmin).
CREATE TABLE IF NOT EXISTS bug_tickets (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  titre       text        NOT NULL,
  description text,
  type        text        NOT NULL DEFAULT 'bug',        -- 'bug' | 'feature' | 'amélioration'
  priorite    text        NOT NULL DEFAULT 'normale',    -- 'critique' | 'haute' | 'normale' | 'basse'
  status      text        NOT NULL DEFAULT 'ouvert',     -- 'ouvert' | 'en_cours' | 'résolu' | 'fermé'
  notes       text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE bug_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_select_bug_tickets" ON bug_tickets
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "admin_insert_bug_tickets" ON bug_tickets
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "admin_update_bug_tickets" ON bug_tickets
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "admin_delete_bug_tickets" ON bug_tickets
  FOR DELETE TO authenticated USING (true);
