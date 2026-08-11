// Real OrcaRouter provider (OpenAI-compatible chat completions API). Server-side only — the key
// never reaches the client. Not exercised until ORCAROUTER_API_KEY is set.
// Source: Requirements FR-12/NFR-03/NFR-07.

import { OrcaUpstreamError, type OrcaInput, type OrcaProvider, type OrcaResult } from "./types";

export const ORCAROUTER_BASE_URL = "https://api.orcarouter.ai/v1";
export const ORCAROUTER_DEFAULT_MODEL = "orcarouter/auto";

type FetchLike = (input: string, init: RequestInit) => Promise<Response>;

export class OrcaRouterProvider implements OrcaProvider {
  constructor(
    private apiKey: string,
    private baseUrl: string = process.env.ORCAROUTER_BASE_URL ?? ORCAROUTER_BASE_URL,
    private model: string = process.env.ORCAROUTER_MODEL ?? ORCAROUTER_DEFAULT_MODEL,
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
