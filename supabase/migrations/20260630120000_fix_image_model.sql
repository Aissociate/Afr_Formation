-- La génération d'images via OpenRouter passe par l'API image unifiée /images
-- ou les modèles à sortie image (Gemini Flash Image). « openai/dall-e-3 » n'est
-- pas fiable via OpenRouter : on bascule sur un modèle qui fonctionne, sauf si
-- l'admin a déjà choisi un autre modèle.
update ai_config
set image_model = 'google/gemini-2.5-flash-image',
    updated_at  = now()
where id = 1
  and image_model in ('openai/dall-e-3', '');

-- Au cas où la colonne image_base_url existe (ajoutée par une migration
-- parallèle) mais serait vide, on garantit l'URL OpenRouter par défaut.
update ai_config
set image_base_url = 'https://openrouter.ai/api/v1'
where id = 1
  and (image_base_url is null or image_base_url = '');
