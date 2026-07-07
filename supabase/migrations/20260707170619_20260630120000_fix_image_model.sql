update ai_config
set image_model = 'bytedance-seed/seedream-4.5',
    updated_at  = now()
where id = 1
  and image_model in ('openai/dall-e-3', 'google/gemini-2.5-flash-image', 'x-ai/grok-imagine-image-quality', '');

update ai_config
set image_base_url = 'https://openrouter.ai/api/v1'
where id = 1
  and (image_base_url is null or image_base_url = '');
