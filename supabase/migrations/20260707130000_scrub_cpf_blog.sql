-- Les formations AFR (Titres Professionnels) ne sont PAS éligibles au CPF.
-- On retire toute mention du CPF côté front (articles de blog).

-- 1) Réécriture de l'article seed « Comment financer sa formation » en version
--    sans CPF (OPCO / France Travail / Région uniquement).
UPDATE blog_posts SET
  title = 'Comment financer sa formation en 2024 à La Réunion',
  excerpt = 'Découvrez les dispositifs de financement disponibles pour votre formation professionnelle à La Réunion : OPCO, France Travail (AIF), Région et Transitions Pro.',
  content = '<h2>Les dispositifs de financement disponibles</h2><p>La formation professionnelle est un droit pour tous les actifs à La Réunion. Plusieurs dispositifs permettent de financer tout ou partie de votre formation, selon votre situation.</p><h3>OPCO : le financement par votre branche</h3><p>Si vous êtes salarié, votre OPCO (Opérateur de Compétences) peut prendre en charge votre formation via le plan de développement des compétences de votre entreprise.</p><h3>France Travail (AIF)</h3><p>Les demandeurs d''emploi peuvent solliciter l''Aide Individuelle à la Formation (AIF) auprès de France Travail pour financer un parcours certifiant.</p><h3>Région Réunion et Transitions Pro</h3><p>La Région Réunion et Transitions Pro proposent des aides complémentaires selon votre projet professionnel. Notre équipe monte votre dossier de financement avec vous, sans reste à charge dans la plupart des cas.</p>',
  seo_title = 'Financer sa formation à La Réunion en 2024 | AFR OI CFA',
  seo_description = 'Guide des dispositifs de financement de la formation professionnelle à La Réunion : OPCO, France Travail (AIF), Région et Transitions Pro. Montage de dossier accompagné.',
  updated_at = now()
WHERE slug = 'financer-formation-reunion-2024';

-- 2) Filet de sécurité : dépublie tout autre article mentionnant encore le CPF
--    (contenu généré par IA, etc.). Réversible depuis l'admin.
UPDATE blog_posts SET
  is_published = false,
  updated_at = now()
WHERE is_published = true
  AND (
       title ILIKE '%cpf%'
    OR excerpt ILIKE '%cpf%'
    OR content ILIKE '%cpf%'
    OR content ILIKE '%compte personnel de formation%'
    OR content ILIKE '%moncompteformation%'
    OR coalesce(seo_title, '') ILIKE '%cpf%'
    OR coalesce(seo_description, '') ILIKE '%cpf%'
  );
