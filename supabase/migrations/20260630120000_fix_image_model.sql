-- Modèle d'images retenu : bytedance-seed/seedream-4.5 (via OpenRouter, API
-- image unifiée /images). « openai/dall-e-3 » n'est pas fiable via OpenRouter.
-- On normalise les valeurs par défaut/auto vers Seedream, sans écraser un
-- modèle explicitement choisi par l'admin (autre que ces défauts).
update ai_config
set image_model = 'bytedance-seed/seedream-4.5',
    updated_at  = now()
where id = 1
  and image_model in ('openai/dall-e-3', 'google/gemini-2.5-flash-image', 'x-ai/grok-imagine-image-quality', '');

-- Au cas où la colonne image_base_url existe (ajoutée par une migration
-- parallèle) mais serait vide, on garantit l'URL OpenRouter par défaut.
update ai_config
set image_base_url = 'https://openrouter.ai/api/v1'
where id = 1
  and (image_base_url is null or image_base_url = '');
