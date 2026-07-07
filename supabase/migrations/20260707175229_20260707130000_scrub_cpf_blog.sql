-- Supprime les mentions CPF des articles de blog existants.
-- Cohérent avec la politique déjà appliquée (les formations AFR ne sont pas
-- finançables par CPF) — on corrige le contenu éditorial généré avant cette règle.

UPDATE blog_posts
SET
  content = regexp_replace(
    content,
    'le CPF \(Compte Personnel de Formation\)',
    'votre OPCO ou France Travail',
    'gi'
  ),
  updated_at = now()
WHERE content ~* 'CPF|Compte Personal de Formation';

UPDATE blog_posts
SET
  content = regexp_replace(content, '\bCPF\b', 'dispositifs OPCO / France Travail', 'g'),
  updated_at = now()
WHERE content ~ '\bCPF\b';
