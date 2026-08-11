// Server-side policy enforcement. Never trust the LLM output alone.
// Source: ClaudeCode_Delta_Instructions §3/§6, Requirements FR-05/FR-07/FR-14/NFR-08, D-004/D-020/D-028.

import { SUPPORTED_CLAIMS, type Claim } from "./claims";
import { normalizeRequestedData } from "./normalize";
import type { Analysis } from "./schema";

export interface EnforcedAnalysis extends Analysis {
  // derived, authoritative counts (distinct data -> minimum proofs)
  data_count: number;
  proof_count: number;
}

// Banned as unconditional determinations (Delta §3). "unnecessary" is only banned when standalone
// (i.e. NOT part of the approved phrase "potentially unnecessary").
const BANNED = [
  { word: "excessive", replace: "potentially unnecessary for the stated purpose" },
  { word: "illegal", replace: "not assessed for legality" },
  { word: "compliant", replace: "not assessed for compliance" },
];

function neutralizeDeterminations(text: string): string {
  let out = text;
  for (const { word, replace } of BANNED) {
    out = out.replace(new RegExp(`\\b${word}\\b`, "gi"), replace);
  }
  // "unnecessary" not preceded by "potentially " -> approved phrasing
  out = out.replace(/\b(?<!potentially\s)unnecessary\b/gi, "potentially unnecessary for the stated purpose");
  return out;
}

function intersectClaims(claims: Claim[]): Claim[] {
  const allow = new Set<string>(SUPPORTED_CLAIMS);
  const seen = new Set<Claim>();
  const out: Claim[] = [];
  for (const c of claims) {
    if (allow.has(c) && !seen.has(c)) {
      seen.add(c);
      out.push(c);
    }
  }
  return out;
}

/**
 * Enforce all server-side invariants on validated LLM output:
 * - claims restricted to the allowlist (independent of the LLM)
 * - required / optional disjoint (required wins)
 * - detected_requested_data normalized + de-duplicated (single-emit)
 * - potentially_unnecessary limited to actually-detected items
 * - prohibited determinations neutralized in free text
 * - authoritative distinct counts computed here, not taken from the model
 */
export function enforcePolicy(analysis: Analysis): EnforcedAnalysis {
  const required = intersectClaims(analysis.required_claims);
  const requiredSet = new Set<Claim>(required);
  const optional = intersectClaims(analysis.optional_claims).filter((c) => !requiredSet.has(c));

  const detected = normalizeRequestedData(analysis.detected_requested_data);
  const detectedSet = new Set(detected);

  // potentially unnecessary limited to detected items, de-duplicated, text neutralized
  const seenPU = new Set<string>();
  const potentially_unnecessary_data = analysis.potentially_unnecessary_data
    .filter((p) => detectedSet.has(p.item))
    .filter((p) => (seenPU.has(p.item) ? false : (seenPU.add(p.item), true)))
    .map((p) => ({ item: p.item, reason_for_flag: neutralizeDeterminations(p.reason_for_flag) }));

  return {
    version: "2",
    stated_purposes: analysis.stated_purposes.map((p) => ({ ...p, rationale: neutralizeDeterminations(p.rationale) })),
    detected_requested_data: detected,
    required_claims: required,
    optional_claims: optional,
    potentially_unnecessary_data,
    unsupported_needs: analysis.unsupported_needs.map(neutralizeDeterminations),
    assumptions: analysis.assumptions.map(neutralizeDeterminations),
    clarification_questions: analysis.clarification_questions.map(neutralizeDeterminations),
    summary: neutralizeDeterminations(analysis.summary),
    data_count: detected.length,
    proof_count: required.length,
  };
}
