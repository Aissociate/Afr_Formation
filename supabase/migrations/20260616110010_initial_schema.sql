
-- Formations catalog
CREATE TABLE formations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  objectifs text,
  duree text,
  niveau text DEFAULT 'Tous niveaux',
  prix numeric(10,2),
  categorie text,
  image_url text,
  is_published boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Financing modalities
CREATE TABLE financing_modalities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  conditions text,
  montant_max numeric(10,2),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Blog posts
CREATE TABLE blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  excerpt text,
  content text,
  cover_image text,
  author text DEFAULT 'AFR OI CFA',
  tags text[],
  seo_title text,
  seo_description text,
  is_published boolean DEFAULT false,
  published_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Leads / Prospects
CREATE TABLE leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom text NOT NULL,
  prenom text,
  email text NOT NULL,
  telephone text,
  localite text,
  situation_pro text,
  source text DEFAULT 'site',
  status text DEFAULT 'nouveau',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Questionnaire responses
CREATE TABLE questionnaire_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES leads(id) ON DELETE CASCADE,
  objectif_formation text,
  domaine_interesse text,
  niveau_etudes text,
  situation_emploi text,
  revenus_foyer text,
  financement_connu text[],
  disponibilite text,
  commentaires text,
  created_at timestamptz DEFAULT now()
);

-- PFI Reports (Plan de Formation Individualisé)
CREATE TABLE pfi_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES leads(id) ON DELETE SET NULL,
  questionnaire_id uuid REFERENCES questionnaire_responses(id) ON DELETE SET NULL,
  titre text,
  content_json jsonb,
  formations_recommandees jsonb,
  financements_identifies jsonb,
  pdf_url text,
  status text DEFAULT 'brouillon',
  sent_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- AI Ad campaigns
CREATE TABLE ad_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titre text NOT NULL,
  formation_id uuid REFERENCES formations(id) ON DELETE SET NULL,
  target_audience text,
  tone text DEFAULT 'professionnel',
  ad_text_variants jsonb,
  image_prompt text,
  image_urls text[],
  platform text DEFAULT 'facebook',
  status text DEFAULT 'brouillon',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Admin users (handled by Supabase Auth)
-- Site settings
CREATE TABLE site_settings (
  key text PRIMARY KEY,
  value text,
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE formations ENABLE ROW LEVEL SECURITY;
ALTER TABLE financing_modalities ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE questionnaire_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE pfi_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Public read for formations and published blog posts
CREATE POLICY "public_read_formations" ON formations FOR SELECT USING (is_published = true);
CREATE POLICY "public_read_blog" ON blog_posts FOR SELECT USING (is_published = true);
CREATE POLICY "public_read_financing" ON financing_modalities FOR SELECT USING (is_active = true);
CREATE POLICY "public_read_settings" ON site_settings FOR SELECT USING (true);

-- Public insert for leads and questionnaire (prospect submission)
CREATE POLICY "public_insert_leads" ON leads FOR INSERT WITH CHECK (true);
CREATE POLICY "public_insert_questionnaire" ON questionnaire_responses FOR INSERT WITH CHECK (true);

-- Authenticated full access (admin)
CREATE POLICY "admin_all_formations" ON formations FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "admin_all_financing" ON financing_modalities FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "admin_all_blog" ON blog_posts FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "admin_read_leads" ON leads FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin_update_leads" ON leads FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "admin_delete_leads" ON leads FOR DELETE TO authenticated USING (true);
CREATE POLICY "admin_read_questionnaire" ON questionnaire_responses FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin_all_reports" ON pfi_reports FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "admin_all_ads" ON ad_campaigns FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "admin_all_settings" ON site_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Seed financing modalities
INSERT INTO financing_modalities (name, description, conditions, montant_max) VALUES
('CPF (Compte Personnel de Formation)', 'Financement via droits formation accumulés', 'Être salarié ou demandeur d''emploi, avoir des droits CPF suffisants', 5000),
('OPCO', 'Financement via l''Opérateur de Compétences de la branche professionnelle', 'Être salarié dans une entreprise adhérente', 10000),
('Région Réunion', 'Aide régionale à la formation professionnelle', 'Résider à La Réunion, demandeur d''emploi ou salarié sous conditions', 8000),
('Pôle Emploi / France Travail', 'AIF (Aide Individuelle à la Formation)', 'Être inscrit comme demandeur d''emploi', 6000),
('Autofinancement', 'Financement personnel de la formation', 'Aucune condition particulière', NULL),
('Plan de développement des compétences', 'Prise en charge par l''employeur', 'Être salarié et avoir accord de l''employeur', NULL);

-- Seed sample formations
INSERT INTO formations (title, slug, description, objectifs, duree, niveau, prix, categorie) VALUES
('Formation Intelligence Artificielle Fondamentaux', 'ia-fondamentaux', 'Maîtrisez les bases de l''IA et du machine learning pour votre activité professionnelle', 'Comprendre les concepts clés de l''IA, utiliser les outils IA au quotidien, automatiser des tâches répétitives', '35 heures', 'Débutant', 1500, 'Numérique'),
('Excel & Data : Maîtrisez vos données', 'excel-data', 'De Excel avancé à l''analyse de données professionnelle', 'Créer des tableaux de bord, maîtriser les formules avancées, introdution à Power BI', '21 heures', 'Intermédiaire', 890, 'Bureautique'),
('Marketing Digital & Réseaux Sociaux', 'marketing-digital', 'Développez votre présence en ligne et générez des prospects qualifiés', 'Créer une stratégie digitale, maîtriser Facebook/Instagram Ads, analyser les performances', '28 heures', 'Tous niveaux', 1200, 'Marketing'),
('Création d''Entreprise - Booster son projet', 'creation-entreprise', 'De l''idée au business plan opérationnel', 'Valider son concept, structurer son business plan, identifier les financements disponibles', '35 heures', 'Débutant', 1100, 'Entrepreneuriat'),
('Gestion Administrative et Comptabilité', 'gestion-administrative', 'Maîtrisez les fondamentaux de la gestion d''une TPE/PME', 'Tenir une comptabilité de base, gérer la paie, maîtriser les obligations légales', '42 heures', 'Débutant', 1350, 'Gestion'),
('Communication Professionnelle', 'communication-professionnelle', 'Développez vos compétences en communication orale et écrite', 'Maîtriser la prise de parole, rédiger des documents professionnels, gérer les conflits', '21 heures', 'Tous niveaux', 750, 'Développement personnel');

-- Seed sample blog posts
INSERT INTO blog_posts (title, slug, excerpt, content, author, tags, seo_title, seo_description, is_published, published_at) VALUES
('Comment financer sa formation en 2024 à La Réunion', 'financer-formation-reunion-2024', 'Découvrez tous les dispositifs de financement disponibles pour votre formation professionnelle à La Réunion : CPF, OPCO, Région...', '<h2>Les dispositifs de financement disponibles</h2><p>La formation professionnelle est un droit pour tous les actifs à La Réunion. Plusieurs dispositifs permettent de financer tout ou partie de votre formation...</p><h3>Le CPF : votre compte formation</h3><p>Le Compte Personnel de Formation (CPF) est alimenté chaque année par vos heures de travail. Vous pouvez l''utiliser sur moncompteformation.gouv.fr pour financer des formations certifiantes...</p>', 'AFR OI CFA', ARRAY['financement', 'CPF', 'formation', 'Réunion'], 'Financer sa formation à La Réunion en 2024 | AFR OI CFA', 'Guide complet pour financer votre formation professionnelle à La Réunion : CPF, OPCO, aides régionales. Découvrez toutes les solutions de financement disponibles.', true, now()),
('L''IA au service de la formation professionnelle', 'ia-formation-professionnelle', 'Comment l''intelligence artificielle transforme l''accès à la formation et le montage des dossiers de financement.', '<h2>L''IA révolutionne la formation</h2><p>L''intelligence artificielle ouvre de nouvelles perspectives pour démocratiser l''accès à la formation professionnelle, notamment dans les zones rurales et éloignées de La Réunion...</p>', 'AFR OI CFA', ARRAY['IA', 'formation', 'innovation', 'numérique'], 'IA et formation professionnelle : la révolution à La Réunion | AFR OI CFA', 'Découvrez comment l''intelligence artificielle transforme le montage des dossiers de formation et facilite l''accès à la formation professionnelle à La Réunion.', true, now() - interval '3 days');

-- Seed settings
INSERT INTO site_settings (key, value) VALUES
('site_name', 'AFR OI CFA'),
('site_tagline', 'La technologie au service de l''humain'),
('contact_email', 'contact@afroicfa.re'),
('contact_phone', '0262 XX XX XX'),
('address', 'Bras-Panon (97412) — La Réunion'),
('claude_api_key', '');
