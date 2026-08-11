// OrcaRouter provider interface. The rest of the app depends only on this, so the mock and the
// real gateway are interchangeable. Source: HumanProof_MASTER §7/§8, Requirements FR-12/NFR-07.

export type OrcaSource = "MOCK" | "ORCAROUTER";

export interface OrcaMeta {
  source: OrcaSource;
  // Resolved model as reported by the gateway. null (not "unknown") when not provided (D-011).
  model: string | null;
  latency_ms: number;
  // Gateway request id. null when not provided — never a fabricated placeholder.
  request_id: string | null;
  // Actual cost in USD if the gateway reports it, else null (never fabricate — D-011).
  cost_usd: number | null;
  note?: string;
}

export interface OrcaResult {
  raw: unknown; // model output, expected to be Analysis-shaped JSON (validated downstream)
  meta: OrcaMeta;
}

export interface OrcaInput {
  system: string;
  sanitizedServiceText: string; // PII-shielded (blocked upstream if not clean)
  requestedDataCategories: string[]; // canonical category NAMES only, never values
  allowlist: readonly string[];
}

export interface OrcaProvider {
  analyze(input: OrcaInput): Promise<OrcaResult>;
}
