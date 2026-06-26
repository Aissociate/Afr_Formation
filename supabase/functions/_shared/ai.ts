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
