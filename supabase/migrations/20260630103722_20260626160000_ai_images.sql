-- Add image generation configuration columns to ai_config.
-- Allows configuring a separate model/endpoint for image generation
-- (e.g. a DALL-E or Stable Diffusion model via OpenRouter).

ALTER TABLE ai_config
  ADD COLUMN IF NOT EXISTS image_model    text NOT NULL DEFAULT 'openai/dall-e-3',
  ADD COLUMN IF NOT EXISTS image_base_url text NOT NULL DEFAULT 'https://openrouter.ai/api/v1';

-- Seed sensible defaults for the singleton row.
UPDATE ai_config
SET
  image_model    = 'openai/dall-e-3',
  image_base_url = 'https://openrouter.ai/api/v1',
  updated_at     = now()
WHERE id = 1
  AND image_model = 'openai/dall-e-3';
