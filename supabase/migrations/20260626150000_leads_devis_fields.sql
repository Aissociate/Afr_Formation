-- Champs nécessaires à la création de devis (alignés sur le CRM AFR) :
-- type particulier/entreprise, adresse, formation/produit visé, et — pour les
-- entreprises — le représentant et sa fonction.

alter table leads add column if not exists type_client          text default 'particulier';
alter table leads add column if not exists adresse              text;
alter table leads add column if not exists formation_produit    text;
alter table leads add column if not exists representant         text;
alter table leads add column if not exists fonction_representant text;
