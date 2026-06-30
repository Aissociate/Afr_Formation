// Shared helpers for the AI edge functions.
// Centralises the OpenRouter call, the prompt-template rendering and the
// configuration loaded from the `ai_config` table (admin → Paramètres).

import { createClient, type SupabaseClient } from "jsr:@supabase/supabase-js@2";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export function serviceClient(): SupabaseClient {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

export type AiConfig = {
  provider: string;
  base_url: string;
  api_key: string;
  model: string;
  image_model: string;
  temperature: number;
  max_tokens: number;
  prompt_blog: string;
  prompt_ads: string;
  prompt_pfi: string;
};

const DEFAULTS: AiConfig = {
  provider: "openrouter",
  base_url: "https://openrouter.ai/api/v1",
  api_key: "",
  model: "anthropic/claude-3.5-sonnet",
  image_model: "google/gemini-2.5-flash-image",
  temperature: 0.7,
  max_tokens: 2000,
  prompt_blog: "",
  prompt_ads: "",
  prompt_pfi: "",
};

/** Load the singleton ai_config row, falling back to the OPENROUTER_API_KEY secret. */
export async function loadAiConfig(supabase: SupabaseClient): Promise<AiConfig> {
  const { data } = await supabase.from("ai_config").select("*").eq("id", 1).maybeSingle();
  const cfg: AiConfig = { ...DEFAULTS, ...(data ?? {}) };
  cfg.temperature = Number(cfg.temperature);
  cfg.max_tokens = Number(cfg.max_tokens);
  // Allow the key to live in Supabase secrets instead of the DB.
  if (!cfg.api_key) cfg.api_key = Deno.env.get("OPENROUTER_API_KEY") ?? "";
  return cfg;
}

/** Replace {{placeholder}} tokens with the provided values (missing => empty). */
export function renderTemplate(tpl: string, vars: Record<string, string>): string {
  return tpl.replace(/\{\{\s*(\w+)\s*\}\}/g, (_m, key) => (key in vars ? vars[key] : ""));
}

/** Extract the first JSON object from a model response. */
export function extractJson<T = Record<string, unknown>>(text: string): T {
  const match = text.match(/\{[\s\S]*\}/);
  return JSON.parse(match?.[0] ?? text) as T;
}

/** Call OpenRouter (OpenAI-compatible chat completions) and return the message text. */
export async function callOpenRouter(cfg: AiConfig, prompt: string, maxTokens?: number): Promise<string> {
  if (!cfg.api_key) {
    throw new Error(
      "Clé API IA non configurée. Renseignez la clé OpenRouter dans Admin → Paramètres (ou le secret OPENROUTER_API_KEY).",
    );
  }
  const base = (cfg.base_url || DEFAULTS.base_url).replace(/\/+$/, "");
  const res = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${cfg.api_key}`,
      "HTTP-Referer": "https://afr-formation.re",
      "X-Title": "AFR OI CFA",
    },
    body: JSON.stringify({
      model: cfg.model,
      messages: [{ role: "user", content: prompt }],
      max_tokens: maxTokens ?? cfg.max_tokens,
      temperature: cfg.temperature,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message ?? `Erreur OpenRouter (${res.status})`);
  }
  const text: string = data?.choices?.[0]?.message?.content ?? "";
  if (!text) throw new Error("Réponse vide de l'IA.");
  return text;
}

/** Pull the first base64 image data-URL out of an OpenRouter response. */
// deno-lint-ignore no-explicit-any
function extractImageDataUrl(data: any): string | null {
  const images = data?.choices?.[0]?.message?.images;
  if (Array.isArray(images)) {
    for (const img of images) {
      const url = img?.image_url?.url ?? img?.url;
      if (typeof url === "string" && url.startsWith("data:image")) return url;
    }
  }
  // Fallback: dedicated images endpoint shape (data[0].b64_json).
  const b64 = data?.data?.[0]?.b64_json;
  if (typeof b64 === "string") return `data:image/png;base64,${b64}`;
  // Fallback: a data URL embedded in the text content.
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content === "string") {
    const m = content.match(/data:image\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/=]+/);
    if (m) return m[0];
  }
  return null;
}

/**
 * Generate an image via the OpenRouter image model (same API key as text),
 * upload it to the public `media` Storage bucket and return its public URL.
 * Returns null on any failure (image generation is best-effort, never fatal).
 */
export async function generateImage(
  cfg: AiConfig,
  supabase: SupabaseClient,
  prompt: string,
  pathPrefix = "ai",
): Promise<string | null> {
  if (!cfg.api_key || !cfg.image_model || !prompt.trim()) return null;
  const base = (cfg.base_url || DEFAULTS.base_url).replace(/\/+$/, "");

  let data: unknown;
  try {
    const res = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${cfg.api_key}`,
        "HTTP-Referer": "https://afr-formation.fr",
        "X-Title": "AFR OI CFA",
      },
      body: JSON.stringify({
        model: cfg.image_model,
        messages: [{ role: "user", content: prompt }],
        modalities: ["image", "text"],
      }),
    });
    if (!res.ok) return null;
    data = await res.json();
  } catch {
    return null;
  }

  const dataUrl = extractImageDataUrl(data);
  const match = dataUrl?.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) return null;

  const contentType = match[1];
  const ext = (contentType.split("/")[1] ?? "png").replace("jpeg", "jpg").replace("svg+xml", "svg");
  const bytes = Uint8Array.from(atob(match[2]), (c) => c.charCodeAt(0));
  const path = `${pathPrefix}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from("media").upload(path, bytes, { contentType, upsert: true });
  if (error) return null;

  const { data: pub } = supabase.storage.from("media").getPublicUrl(path);
  return pub?.publicUrl ?? null;
}
