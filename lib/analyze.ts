// Analysis pipeline: PII shield (block on detection) -> requestedData normalize+allowlist
// -> provider (OrcaRouter/mock) -> schema validation (retry once) -> server-side policy
// -> response with a *measured* zero-PII evidence audit.
// Source: Requirements FR-01..FR-07, FR-12, FR-14, NFR-01/NFR-02/NFR-05.

import { SUPPORTED_CLAIMS } from "./claims";
import { scanForPii, type PiiFindingType } from "./piiShield";
import { normalizeRequestedData, canonicalCategory } from "./normalize";
import { SYSTEM_PROMPT } from "./prompt";
import { parseAnalysis } from "./schema";
import { enforcePolicy, type EnforcedAnalysis } from "./policy";
import { getProvider } from "./orcaRouter";
import type { OrcaInput, OrcaMeta, OrcaProvider } from "./orcaRouter";

export interface AnalyzeInput {
  serviceName?: string;
  audience?: string;
  purposeText: string;
  requestedData: string[]; // raw category names from the UI (never real values)
}

export interface ZeroPiiEvidence {
  policy: "block-on-detected-pii";
  input_pii_findings: number; // PII types the shield saw in the input (0 when analysis proceeds)
  egress_payload_scanned: boolean;
  // Heuristic scan of the ACTUAL egress payload. This is a detection count, NOT an absolute
  // proof of absence — absence of a finding only means no known pattern matched.
  detected_personal_identity_attribute_values_in_egress: number;
  raw_identity_documents_sent_to_ai: number; // 0 by construction: no document/image channel exists
  requested_data_invalid_dropped: number; // entries that were not a recognized category
  requested_data_deduplicated: number; // duplicate canonical categories collapsed
  basis: string;
}

export interface AuditInfo {
  source: OrcaMeta["source"];
  model: string | null; // resolved model (X-Orca-Resolved-Model header only)
  response_model: string | null; // model echoed in the response body
  latency_ms: number;
  request_id: string | null;
  cost_usd: number | null;
  note?: string;
  zero_pii: ZeroPiiEvidence;
}

export interface AnalyzeResponse {
  analysis: EnforcedAnalysis;
  audit: AuditInfo;
}

export class AnalyzeError extends Error {}

/** Thrown when the input contains real PII values. We block instead of masking-and-sending. */
export class PiiBlockedError extends Error {
  constructor(public findingTypes: PiiFindingType[]) {
    super("Real personal values were detected in the input. Remove them and resubmit.");
    this.name = "PiiBlockedError";
  }
}

export async function runAnalysis(input: AnalyzeInput, provider: OrcaProvider = getProvider()): Promise<AnalyzeResponse> {
  if (!input.purposeText || input.purposeText.trim().length === 0) {
    throw new AnalyzeError("purposeText is required");
  }

  // 1. PII shield: BLOCK if the free text contains real values (do not mask-and-send).
  const shield = scanForPii(input.purposeText);
  if (!shield.clean) {
    throw new PiiBlockedError(shield.findings.map((f) => f.type));
  }

  // 2. requestedData egress boundary: normalize to canonical categories and drop everything
  //    that is not an allowlisted category (arbitrary strings / real PII values never leave).
  //    Count invalid entries and duplicates separately (they are different accuracy stories).
  const rawRequested = Array.isArray(input.requestedData) ? input.requestedData : [];
  const mapped = rawRequested.map((r) => canonicalCategory(r));
  const requested_data_invalid_dropped = mapped.filter((c) => c === null).length;
  const validCanon = mapped.filter((c): c is NonNullable<typeof c> => c !== null);
  const requested_data_deduplicated = validCanon.length - new Set(validCanon).size;
  const requestedDataCategories = normalizeRequestedData(rawRequested);

  const orcaInput: OrcaInput = {
    system: SYSTEM_PROMPT,
    sanitizedServiceText: input.purposeText, // clean by construction (blocked above otherwise)
    requestedDataCategories,
    allowlist: SUPPORTED_CLAIMS,
  };

  // 3. Provider call with a single retry on invalid/empty output (NFR-05).
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

  // 4. Server-side enforcement (independent of the LLM).
  const analysis = enforcePolicy(parsed.data);

  // 5. Zero-PII evidence — MEASURED from the actual egress payload, with a stated basis.
  const egressBlob = `${orcaInput.sanitizedServiceText} ${orcaInput.requestedDataCategories.join(" ")}`;
  const egressScan = scanForPii(egressBlob);
  const zero_pii: ZeroPiiEvidence = {
    policy: "block-on-detected-pii",
    input_pii_findings: shield.findings.length,
    egress_payload_scanned: true,
    detected_personal_identity_attribute_values_in_egress: egressScan.findings.length,
    raw_identity_documents_sent_to_ai: 0, // orcaInput has no document/image field: text + category names only
    requested_data_invalid_dropped,
    requested_data_deduplicated,
    basis:
      "Requests with detected PII are blocked before egress, so analysis only proceeds on input the heuristic shield found clean. " +
      "The egress payload (service-purpose text + canonical category names) was re-scanned; the count above is a heuristic detection result, " +
      "not an absolute proof of absence. No document or image channel exists, so raw identity documents sent = 0 by construction.",
  };

  const audit: AuditInfo = {
    source: meta.source,
    model: meta.model,
    response_model: meta.response_model,
    latency_ms: meta.latency_ms,
    request_id: meta.request_id,
    cost_usd: meta.cost_usd,
    note: meta.note,
    zero_pii,
  };

  return { analysis, audit };
}
