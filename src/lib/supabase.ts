import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Formation = {
  id: string
  title: string
  slug: string
  description: string | null
  objectifs: string | null
  duree: string | null
  niveau: string
  prix: number | null
  categorie: string | null
  image_url: string | null
  is_published: boolean
  created_at: string
  updated_at: string
}

export type FinancingModality = {
  id: string
  name: string
  description: string | null
  conditions: string | null
  montant_max: number | null
  is_active: boolean
}

export type BlogPost = {
  id: string
  title: string
  slug: string
  excerpt: string | null
  content: string | null
  cover_image: string | null
  author: string
  tags: string[] | null
  seo_title: string | null
  seo_description: string | null
  is_published: boolean
  published_at: string | null
  created_at: string
  updated_at: string
}

export type Lead = {
  id: string
  nom: string
  prenom: string | null
  email: string
  telephone: string | null
  localite: string | null
  situation_pro: string | null
  source: string
  status: string
  notes: string | null
  type_client: string | null
  adresse: string | null
  formation_produit: string | null
  representant: string | null
  fonction_representant: string | null
  created_at: string
  updated_at: string
}

export type QuestionnaireResponse = {
  id: string
  lead_id: string
  objectif_formation: string | null
  domaine_interesse: string | null
  niveau_etudes: string | null
  situation_emploi: string | null
  revenus_foyer: string | null
  financement_connu: string[] | null
  disponibilite: string | null
  commentaires: string | null
  created_at: string
}

export type PfiReport = {
  id: string
  lead_id: string | null
  questionnaire_id: string | null
  titre: string | null
  content_json: Record<string, unknown> | null
  formations_recommandees: unknown
  financements_identifies: unknown
  pdf_url: string | null
  status: string
  sent_at: string | null
  created_at: string
}

export type AdCampaign = {
  id: string
  titre: string
  formation_id: string | null
  target_audience: string | null
  tone: string
  ad_text_variants: unknown
  image_prompt: string | null
  image_urls: string[] | null
  platform: string
  status: string
  created_at: string
  updated_at: string
}
