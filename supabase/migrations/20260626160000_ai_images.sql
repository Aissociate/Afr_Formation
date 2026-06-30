-- Génération d'images via OpenRouter (même clé API que le texte).
-- Ajoute le modèle image configurable + un bucket Storage public pour héberger
-- les images générées (couvertures de blog, visuels de publicités).

alter table ai_config
  add column if not exists image_model    text not null default 'google/gemini-2.5-flash-image',
  add column if not exists image_base_url text not null default 'https://openrouter.ai/api/v1';

-- Bucket public pour les médias générés par l'IA.
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

-- Lecture publique des objets du bucket `media`.
drop policy if exists "public_read_media" on storage.objects;
create policy "public_read_media" on storage.objects
  for select to public using (bucket_id = 'media');

-- Écriture/maj/suppression par les admins authentifiés (les edge functions
-- utilisent la clé service-role et contournent déjà la RLS).
drop policy if exists "admin_write_media" on storage.objects;
create policy "admin_write_media" on storage.objects
  for insert to authenticated with check (bucket_id = 'media');

drop policy if exists "admin_update_media" on storage.objects;
create policy "admin_update_media" on storage.objects
  for update to authenticated using (bucket_id = 'media') with check (bucket_id = 'media');

drop policy if exists "admin_delete_media" on storage.objects;
create policy "admin_delete_media" on storage.objects
  for delete to authenticated using (bucket_id = 'media');
