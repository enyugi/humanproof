// OrcaRouter provider interface. The rest of the app depends only on this, so the mock and the
// real gateway are interchangeable. Source: HumanProof_MASTER §7/§8, Requirements FR-12/NFR-07.

export interface OrcaMeta {
  source: "MOCK" | "OPENROUTER";
  model: string;
  latency_ms: number;
  request_id: string;
  // actual cost in USD if the gateway reports it, else null (never fabricate — D-011).
  cost_usd: number | null;
  note?: string;
}

export interface OrcaResult {
  raw: unknown; // model output, expected to be Analysis-shaped JSON (validated downstream)
  meta: OrcaMeta;
}

export interface OrcaInput {
  system: string;
  sanitizedServiceText: string; // PII already masked
  requestedDataCategories: string[]; // category NAMES only, never values
  allowlist: readonly string[];
}

export interface OrcaProvider {
  analyze(input: OrcaInput): Promise<OrcaResult>;
}
