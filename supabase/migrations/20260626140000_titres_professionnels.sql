-- Recentrage du catalogue sur les 8 Titres Professionnels réellement agréés
-- (agréments DEETS obtenus). Les autres formations sont retirées.
--
-- Durées et tarifs sont PROVISOIRES : à ajuster dans Admin → Formations.
--
-- NB : on vide d'abord la table. Les références éventuelles (ad_campaigns,
-- pfi_reports) sont en ON DELETE SET NULL, donc non bloquantes.

delete from formations;

insert into formations (title, slug, description, objectifs, duree, niveau, prix, categorie, is_published) values
(
  'TP Secrétaire Comptable',
  'tp-secretaire-comptable',
  'Le secrétaire comptable assure le secrétariat courant et la tenue de la comptabilité d''une structure : accueil, gestion administrative, saisie des opérations comptables et préparation des éléments de paie.',
  'Assurer les travaux courants de secrétariat et assister une équipe ; réaliser les opérations comptables courantes et préparer la paie.',
  '≈ 7 mois (à confirmer)',
  'Bac (niveau 4)',
  3500,
  'Comptabilité & Gestion',
  true
),
(
  'TP Gestionnaire Comptable et Fiscal',
  'tp-gestionnaire-comptable-fiscal',
  'Le gestionnaire comptable et fiscal arrête les comptes, établit les déclarations fiscales et produit les documents de gestion d''une entreprise ou d''un cabinet.',
  'Arrêter et présenter les comptes annuels ; établir la liasse fiscale et les déclarations ; produire des analyses de gestion.',
  '≈ 9 mois (à confirmer)',
  'Bac+2 (niveau 5)',
  4500,
  'Comptabilité & Gestion',
  true
),
(
  'TP Assistant(e) Ressources Humaines',
  'tp-assistant-ressources-humaines',
  'L''assistant(e) RH assure la gestion administrative du personnel, le suivi des dossiers salariés et participe au recrutement et au développement des compétences.',
  'Assurer la gestion administrative du personnel ; contribuer au recrutement et au plan de développement des compétences.',
  '≈ 9 mois (à confirmer)',
  'Bac+2 (niveau 5)',
  4500,
  'Ressources Humaines & Paie',
  true
),
(
  'TP Assistant(e) de Direction',
  'tp-assistant-de-direction',
  'L''assistant(e) de direction seconde un dirigeant ou une équipe : organisation, communication, coordination de projets et gestion administrative de haut niveau.',
  'Assister la direction dans l''organisation et la communication ; coordonner des projets et gérer l''information.',
  '≈ 9 mois (à confirmer)',
  'Bac+2 (niveau 5)',
  4500,
  'Assistanat & Direction',
  true
),
(
  'TP Gestionnaire de Paie',
  'tp-gestionnaire-de-paie',
  'Le gestionnaire de paie produit les bulletins de salaire, gère les déclarations sociales (DSN) et assure le suivi administratif de la paie et du personnel.',
  'Établir les bulletins de paie et les déclarations sociales ; assurer la veille et le suivi administratif du personnel.',
  '≈ 9 mois (à confirmer)',
  'Bac+2 (niveau 5)',
  4500,
  'Ressources Humaines & Paie',
  true
),
(
  'TP Formateur Professionnel d''Adultes',
  'tp-formateur-professionnel-adultes',
  'Le formateur professionnel d''adultes conçoit et anime des actions de formation, individualise les parcours et accompagne les apprenants vers la certification.',
  'Concevoir et animer des séances de formation ; accompagner les apprenants et évaluer les acquis.',
  '≈ 9 mois (à confirmer)',
  'Bac+2 (niveau 5)',
  4500,
  'Formation & Insertion',
  true
),
(
  'TP Conseiller(ère) en Insertion Professionnelle',
  'tp-conseiller-insertion-professionnelle',
  'Le conseiller en insertion professionnelle accompagne les personnes dans leur parcours d''accès à l''emploi et à la formation, en lien avec les partenaires du territoire.',
  'Accueillir et accompagner les publics ; construire des parcours d''insertion et mobiliser le réseau partenarial.',
  '≈ 9 mois (à confirmer)',
  'Bac+2 (niveau 5)',
  4500,
  'Formation & Insertion',
  true
),
(
  'TP Responsable de Petite et Moyenne Structure',
  'tp-responsable-petite-moyenne-structure',
  'Le responsable de petite ou moyenne structure pilote l''activité d''une unité : gestion économique, management d''équipe et développement de l''activité.',
  'Piloter l''activité et la gestion d''une structure ; manager une équipe et développer l''activité commerciale.',
  '≈ 9 mois (à confirmer)',
  'Bac+2 (niveau 5)',
  4500,
  'Management',
  true
);
