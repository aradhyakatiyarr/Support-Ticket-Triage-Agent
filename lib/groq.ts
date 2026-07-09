import { SYSTEM_PROMPT, TriageResultSchema, triageTool, type TriageResult } from "./schema";

const API_URL = "https://api.groq.com/openai/v1/chat/completions";

// qwen/qwen3.6-27b is currently the only model on Groq's free tier with
// vision + tool calling + JSON mode together, so it's the only one that can
// actually do this job (screenshot triage). "fast" vs "quality" isn't two
// different models — it's the same weights with reasoning_effort toggled,
// which is a real product lever (Qwen3.6 supports thinking / non-thinking
// mode natively) rather than a fake model swap.
const PRIMARY_MODEL = "qwen/qwen3.6-27b";
// Fallback used only for text-only tickets when the primary is rate-limited
// or overloaded — gpt-oss-120b doesn't do vision, so it can't stand in for
// a screenshot ticket. Groq deprecated the old Llama 3.x free lineup in
// June 2026 in favor of GPT-OSS + Qwen3.6, so this is the current pairing.
const FALLBACK_MODEL = "openai/gpt-oss-120b";

export const MODELS = {
  fast: PRIMARY_MODEL,
  quality: PRIMARY_MODEL,
} as const;

export type ModelKey = keyof typeof MODELS;

const REASONING_EFFORT: Record<ModelKey, "none" | "default"> = {
  fast: "none",
  quality: "default",
};

export class TriageError extends Error {
  code:
    | "missing_api_key"
    | "rate_limited"
    | "overloaded"
    | "timeout"
    | "invalid_output"
    | "upstream_error"
    | "vision_unavailable";
  constructor(code: TriageError["code"], message: string) {
    super(message);
    this.code = code;
    this.name = "TriageError";
  }
}

type RunArgs = {
  ticketText: string;
  imageBase64?: string;
  imageMediaType?: string;
  model?: ModelKey;
};

type RunResult = {
  result: TriageResult;
  modelUsed: string;
  fellBack: boolean;
  latencyMs: number;
};

function buildUserContent(args: RunArgs) {
  const text = `Ticket:\n"""\n${args.ticketText.trim()}\n"""`;
  if (args.imageBase64 && args.imageMediaType) {
    return [
      { type: "text", text },
      {
        type: "image_url",
        image_url: { url: `data:${args.imageMediaType};base64,${args.imageBase64}` },
      },
    ];
  }
  return text;
}

function buildBody(model: string, content: unknown, modelKey?: ModelKey) {
  const base: Record<string, unknown> = {
    model,
    max_completion_tokens: 1024,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content },
    ],
    tools: [triageTool],
    tool_choice: { type: "function", function: { name: "submit_triage" } },
  };

  if (model === PRIMARY_MODEL) {
    // qwen3.6 requires parsed/hidden reasoning_format when tools are in play
    base.reasoning_effort = REASONING_EFFORT[modelKey ?? "fast"];
    base.reasoning_format = "hidden";
  } else {
    // gpt-oss fallback: low effort since this only fires under time pressure
    base.reasoning_effort = "low";
    base.include_reasoning = false;
  }
  return base;
}

async function callOnce(
  model: string,
  content: unknown,
  modelKey: ModelKey | undefined,
  timeoutMs: number
): Promise<{ status: number; body: any }> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${process.env.GROQ_API_KEY ?? ""}`,
      },
      body: JSON.stringify(buildBody(model, content, modelKey)),
      signal: controller.signal,
    });
    const body = await res.json().catch(() => ({}));
    return { status: res.status, body };
  } finally {
    clearTimeout(t);
  }
}

function extractToolArguments(body: any): unknown | null {
  const call = body?.choices?.[0]?.message?.tool_calls?.[0];
  if (!call?.function?.arguments) return null;
  try {
    return JSON.parse(call.function.arguments);
  } catch {
    return null;
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Retries transient failures (rate limit / overload) with backoff, then
// falls back once to gpt-oss-120b rather than failing the whole request —
// but only for text-only tickets, since the fallback has no vision.
export async function runTriage(args: RunArgs): Promise<RunResult> {
  if (!process.env.GROQ_API_KEY) {
    throw new TriageError(
      "missing_api_key",
      "GROQ_API_KEY is not set on the server. Add it in Vercel Project Settings → Environment Variables and redeploy. Get a free key at console.groq.com."
    );
  }

  const hasImage = Boolean(args.imageBase64 && args.imageMediaType);
  const content = buildUserContent(args);
  const modelKey = args.model ?? "fast";

  const attempt = async (model: string, maxRetries: number) => {
    let lastErr: TriageError | null = null;
    for (let i = 0; i <= maxRetries; i++) {
      let res: { status: number; body: any };
      try {
        res = await callOnce(model, content, modelKey, 30_000);
      } catch (e: any) {
        if (e?.name === "AbortError") {
          lastErr = new TriageError("timeout", "Request to Groq timed out after 30s.");
        } else {
          lastErr = new TriageError("upstream_error", e?.message ?? "Network error calling Groq.");
        }
        await sleep(400 * 2 ** i);
        continue;
      }

      if (res.status === 429) {
        lastErr = new TriageError(
          "rate_limited",
          "Rate limited by Groq's free tier (30 req/min, 1,000 req/day, 8,000 tokens/min)."
        );
        await sleep(700 * 2 ** i);
        continue;
      }
      if (res.status === 503 || res.status === 500) {
        lastErr = new TriageError("overloaded", "Groq API is temporarily unavailable.");
        await sleep(600 * 2 ** i);
        continue;
      }
      if (res.status >= 400) {
        throw new TriageError(
          "upstream_error",
          res.body?.error?.message ?? `Groq API returned ${res.status}`
        );
      }

      const raw = extractToolArguments(res.body);
      const parsed = TriageResultSchema.safeParse(raw);
      if (!parsed.success) {
        throw new TriageError(
          "invalid_output",
          `Model output didn't match the expected schema: ${parsed.error.issues[0]?.message}`
        );
      }
      return parsed.data;
    }
    throw lastErr ?? new TriageError("upstream_error", "Unknown upstream failure.");
  };

  const start = Date.now();
  try {
    const result = await attempt(PRIMARY_MODEL, 2);
    return { result, modelUsed: PRIMARY_MODEL, fellBack: false, latencyMs: Date.now() - start };
  } catch (e) {
    const err = e as TriageError;
    if (err.code === "rate_limited" || err.code === "overloaded") {
      if (hasImage) {
        // no vision-capable fallback on the free tier — surface a clear error
        // instead of silently dropping the screenshot
        throw new TriageError(
          "vision_unavailable",
          "Qwen3.6 (the only vision-capable free model) is rate-limited right now, and the fallback model can't read images. Try again in a minute, or resend without the screenshot."
        );
      }
      const result = await attempt(FALLBACK_MODEL, 1);
      return { result, modelUsed: FALLBACK_MODEL, fellBack: true, latencyMs: Date.now() - start };
    }
    throw err;
  }
}
