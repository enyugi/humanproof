// Real OrcaRouter provider (OpenAI-compatible chat completions API). Server-side only — the key
// never reaches the client. Not exercised until ORCAROUTER_API_KEY is set.
// Source: Requirements FR-12/NFR-03/NFR-07.

import { OrcaUpstreamError, type OrcaInput, type OrcaProvider, type OrcaResult } from "./types";

export const ORCAROUTER_BASE_URL = "https://api.orcarouter.ai/v1";
// Pinned, non-Chinese, low-latency default (measured ~2.6s vs orcarouter/auto's ~55s frontier route).
// Pinning is REQUIRED to honor the "no Chinese-origin models" rule: orcarouter/auto can route to
// Chinese vendors (qwen/deepseek/etc.), so we never default to auto. Override with ORCAROUTER_MODEL.
export const ORCAROUTER_DEFAULT_MODEL = "openai/gpt-4o-mini";
// Cap output tokens so generation time is bounded. The analysis JSON (purposes / claims /
// potentially-unnecessary / assumptions / summary) fits comfortably under this; env-overridable.
export const ORCAROUTER_DEFAULT_MAX_TOKENS = 1500;

function parseMaxTokens(v: string | undefined): number {
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) return ORCAROUTER_DEFAULT_MAX_TOKENS;
  return Math.min(8192, Math.max(256, Math.floor(n)));
}

type FetchLike = (input: string, init: RequestInit) => Promise<Response>;

export class OrcaRouterProvider implements OrcaProvider {
  constructor(
    private apiKey: string,
    private baseUrl: string = process.env.ORCAROUTER_BASE_URL ?? ORCAROUTER_BASE_URL,
    private model: string = process.env.ORCAROUTER_MODEL ?? ORCAROUTER_DEFAULT_MODEL,
    private maxTokens: number = parseMaxTokens(process.env.ORCAROUTER_MAX_TOKENS),
    private fetchImpl: FetchLike = fetch,
  ) {}

  async analyze(input: OrcaInput): Promise<OrcaResult> {
    const userContent = JSON.stringify({
      service_text: input.sanitizedServiceText,
      currently_requested_data_categories: input.requestedDataCategories,
      proof_claim_allowlist: input.allowlist,
      instructions: "Return only the required structured JSON (version '2').",
    });

    const url = `${this.baseUrl}/chat/completions`;
    const start = Date.now();
    const res = await this.fetchImpl(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: "system", content: input.system },
          { role: "user", content: userContent },
        ],
        response_format: { type: "json_object" },
        temperature: 0,
        max_tokens: this.maxTokens,
      }),
      signal: input.signal, // per-call timeout / overall deadline / client disconnect
    });
    const latency_ms = Math.max(1, Date.now() - start);

    if (!res.ok) {
      // Dedicated, secret-free upstream error (status only — no body/prompt/Authorization).
      throw new OrcaUpstreamError(res.status);
    }

    const body = (await res.json()) as {
      id?: string;
      model?: string;
      choices?: { message?: { content?: string } }[];
      usage?: { total_cost?: number; cost?: number };
    };

    const content = body.choices?.[0]?.message?.content ?? "{}";
    let raw: unknown;
    try {
      raw = JSON.parse(content);
    } catch {
      raw = {};
    }

    // Resolved model: the official X-Orca-Resolved-Model header ONLY. Never substitute body.model,
    // which is exposed separately as response_model.
    const resolvedModel = res.headers.get("X-Orca-Resolved-Model") ?? null;
    const responseModel = body.model ?? null;
    // Only report cost/request-id if the gateway actually returned them (never fabricate — D-011).
    const cost = body.usage?.total_cost ?? body.usage?.cost ?? null;
    const requestId = body.id ?? null;

    return {
      raw,
      meta: {
        source: "ORCAROUTER",
        model: resolvedModel,
        response_model: responseModel,
        latency_ms,
        request_id: requestId,
        cost_usd: typeof cost === "number" ? cost : null,
        note: typeof cost === "number" ? undefined : "Cost not returned by gateway. See OrcaRouter request log.",
      },
    };
  }
}
