// Real OrcaRouter provider (OpenRouter-compatible). Server-side only — the key never reaches
// the client. Not exercised until ORCAROUTER_API_KEY is set. Source: Requirements FR-12/NFR-03/NFR-07.

import type { OrcaInput, OrcaProvider, OrcaResult } from "./types";

const DEFAULT_BASE_URL = "https://openrouter.ai/api/v1";
const DEFAULT_MODEL = "openai/gpt-4o-mini";

export class OpenRouterProvider implements OrcaProvider {
  constructor(
    private apiKey: string,
    private baseUrl: string = process.env.ORCAROUTER_BASE_URL ?? DEFAULT_BASE_URL,
    private model: string = process.env.ORCAROUTER_MODEL ?? DEFAULT_MODEL,
  ) {}

  async analyze(input: OrcaInput): Promise<OrcaResult> {
    const userContent = JSON.stringify({
      service_text: input.sanitizedServiceText,
      currently_requested_data_categories: input.requestedDataCategories,
      proof_claim_allowlist: input.allowlist,
      instructions: "Return only the required structured JSON (version '2').",
    });

    const start = Date.now();
    const res = await fetch(`${this.baseUrl}/chat/completions`, {
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
    });
    const latency_ms = Math.max(1, Date.now() - start);

    if (!res.ok) {
      throw new Error(`OrcaRouter HTTP ${res.status}: ${await res.text().catch(() => "")}`);
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

    // Only report cost if the gateway actually returned it (never fabricate — D-011).
    const cost = body.usage?.total_cost ?? body.usage?.cost ?? null;

    return {
      raw,
      meta: {
        source: "OPENROUTER",
        model: body.model ?? this.model,
        latency_ms,
        request_id: body.id ?? "unknown",
        cost_usd: typeof cost === "number" ? cost : null,
        note: typeof cost === "number" ? undefined : "Cost not returned by gateway. See OrcaRouter request log.",
      },
    };
  }
}
