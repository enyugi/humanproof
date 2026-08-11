// Analysis pipeline: PII shield -> provider (OrcaRouter/mock) -> schema validation (retry once)
// -> server-side policy enforcement -> response with audit + zero-PII evidence.
// Source: Requirements FR-01..FR-07, FR-12, FR-14, NFR-01/NFR-02/NFR-05.

import { SUPPORTED_CLAIMS } from "./claims";
import { shieldText, type PiiFinding } from "./piiShield";
import { SYSTEM_PROMPT } from "./prompt";
import { parseAnalysis } from "./schema";
import { enforcePolicy, type EnforcedAnalysis } from "./policy";
import { getProvider } from "./orcaRouter";
import type { OrcaMeta, OrcaProvider } from "./orcaRouter";

export interface AnalyzeInput {
  serviceName?: string;
  audience?: string;
  purposeText: string;
  requestedData: string[]; // category names selected in the UI (never real values)
}

export interface AuditInfo extends OrcaMeta {
  raw_identity_documents_sent_to_ai: 0;
  personal_identity_attributes_sent_to_ai: 0;
}

export interface AnalyzeResponse {
  analysis: EnforcedAnalysis;
  audit: AuditInfo;
  pii_findings: PiiFinding[];
  pii_masked: boolean;
}

export class AnalyzeError extends Error {}

/**
 * Run the full analysis. `provider` is injectable for tests; defaults to the env-selected one.
 */
export async function runAnalysis(input: AnalyzeInput, provider: OrcaProvider = getProvider()): Promise<AnalyzeResponse> {
  if (!input.purposeText || input.purposeText.trim().length === 0) {
    throw new AnalyzeError("purposeText is required");
  }

  // 1. PII shield BEFORE anything leaves the server for the LLM.
  const shield = shieldText(input.purposeText);

  const orcaInput = {
    system: SYSTEM_PROMPT,
    sanitizedServiceText: shield.masked,
    requestedDataCategories: input.requestedData ?? [],
    allowlist: SUPPORTED_CLAIMS,
  };

  // 2. Provider call with a single retry on invalid/empty output (NFR-05).
  const first = await provider.analyze(orcaInput);
  let meta: OrcaMeta = first.meta;
  let parsed = parseAnalysis(first.raw);
  if (!parsed.ok) {
    const retry = await provider.analyze(orcaInput);
    meta = retry.meta;
    parsed = parseAnalysis(retry.raw);
  }
  if (!parsed.ok) {
    throw new AnalyzeError(`Model output failed validation after retry: ${parsed.error}`);
  }

  // 3. Server-side enforcement (independent of the LLM).
  const analysis = enforcePolicy(parsed.data);

  // 4. Zero-PII evidence: we only ever sent masked text + category names.
  const audit: AuditInfo = {
    ...meta,
    raw_identity_documents_sent_to_ai: 0,
    personal_identity_attributes_sent_to_ai: 0,
  };

  return {
    analysis,
    audit,
    pii_findings: shield.findings,
    pii_masked: shield.findings.length > 0,
  };
}
