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
import { OrcaTimeoutError } from "./orcaRouter/types";

export { OrcaTimeoutError };

/** Thrown when the client disconnected mid-analysis (distinct from an upstream timeout). */
export class ClientAbortError extends Error {
  constructor(message = "Request was cancelled by the client") {
    super(message);
    this.name = "ClientAbortError";
  }
}

function clampInt(v: string | undefined, def: number, lo: number, hi: number): number {
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) return def;
  return Math.min(hi, Math.max(lo, Math.floor(n)));
}

// Server-owned timeouts. Env overrides are optional and clamped to safe bounds.
export const PER_CALL_TIMEOUT_MS = clampInt(process.env.ORCAROUTER_TIMEOUT_MS, 12_000, 1_000, 30_000);
export const OVERALL_DEADLINE_MS = Math.max(
  clampInt(process.env.ORCAROUTER_DEADLINE_MS, 20_000, 2_000, 60_000),
  PER_CALL_TIMEOUT_MS,
);

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

export interface AnalyzeOptions {
  signal?: AbortSignal; // client-disconnect signal (from the request)
  perCallMs?: number; // override per-call timeout (tests)
  overallMs?: number; // override overall deadline (tests)
}

export async function runAnalysis(
  input: AnalyzeInput,
  provider: OrcaProvider = getProvider(),
  opts: AnalyzeOptions = {},
): Promise<AnalyzeResponse> {
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

  // 3. Provider call(s) under a bounded budget:
  //    - each upstream call has a finite timeout (per-call)
  //    - the whole analysis has an overall deadline; a schema retry must fit inside it
  //    - after a timeout OR client disconnect we do NOT make a second upstream call
  //    - schema-invalid output is retried at most once, only if the deadline allows
  const perCallMs = opts.perCallMs ?? PER_CALL_TIMEOUT_MS;
  const overallMs = opts.overallMs ?? OVERALL_DEADLINE_MS;
  const deadlineAt = Date.now() + overallMs;
  const remaining = () => deadlineAt - Date.now();

  // Distinguish client disconnect from an upstream timeout; leave genuine errors as-is.
  const classifyUpstream = (err: unknown): unknown => {
    if (opts.signal?.aborted) return new ClientAbortError();
    if (err instanceof OrcaTimeoutError) return err;
    const name = (err as { name?: string } | null)?.name;
    if (name === "TimeoutError" || name === "AbortError") return new OrcaTimeoutError();
    return err;
  };

  const callOnce = async () => {
    const budget = Math.min(perCallMs, remaining());
    if (budget <= 0) throw new OrcaTimeoutError("Overall analysis deadline exceeded");
    const timeoutSignal = AbortSignal.timeout(budget);
    const signal = opts.signal ? AbortSignal.any([opts.signal, timeoutSignal]) : timeoutSignal;
    return provider.analyze({ ...orcaInput, signal });
  };

  let meta: OrcaMeta;
  let parsed: ReturnType<typeof parseAnalysis>;
  try {
    const first = await callOnce();
    meta = first.meta;
    parsed = parseAnalysis(first.raw);
  } catch (err) {
    throw classifyUpstream(err);
  }

  // Retry ONLY on schema-invalid output, at most once, and only within the overall deadline.
  if (!parsed.ok && remaining() > 0) {
    try {
      const retry = await callOnce();
      meta = retry.meta;
      parsed = parseAnalysis(retry.raw);
    } catch (err) {
      throw classifyUpstream(err);
    }
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

/**
 * Map an analysis error to an HTTP response shape. Pure so the route stays thin and this is unit-
 * testable. Upstream timeout is a distinct, retriable 504; client disconnect is 499; input/PII/
 * schema problems stay 4xx; anything else is a generic 500. No secrets are ever placed in the body.
 */
export function classifyAnalyzeError(err: unknown): { status: number; body: Record<string, unknown> } {
  if (err instanceof PiiBlockedError) {
    return { status: 422, body: { error: err.message, blocked: true, pii_finding_types: err.findingTypes } };
  }
  if (err instanceof ClientAbortError) {
    return { status: 499, body: { error: "Request was cancelled." } };
  }
  if (err instanceof OrcaTimeoutError) {
    return {
      status: 504,
      body: { error: "Temporary connection delay. Please wait a moment and try again.", timeout: true, retriable: true },
    };
  }
  if (err instanceof AnalyzeError) {
    return { status: 422, body: { error: err.message } };
  }
  return { status: 500, body: { error: "Analysis failed. Please try again." } };
}
