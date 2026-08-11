// MOCK provider — a deterministic, rule-based stand-in for the LLM gateway.
// It is CLEARLY LABELLED as MOCK (meta.source = "MOCK", note says it is not a real model call)
// so the audit never presents fabricated "actual" metadata (D-011, NFR-06/NFR-07).
//
// When ORCAROUTER_API_KEY is set, the OrcaRouter provider replaces this one and the same
// downstream schema-validation + policy-enforcement pipeline applies unchanged.

import type { OrcaInput, OrcaProvider, OrcaResult } from "./types";
import { normalizeRequestedData } from "../normalize";
import type { RequestedDataCategory } from "../claims";

function idFor(text: string): string {
  // deterministic pseudo request id (no randomness needed for a mock)
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) | 0;
  return `mock-${(h >>> 0).toString(16).padStart(8, "0")}`;
}

function analyzeRules(input: OrcaInput) {
  const text = input.sanitizedServiceText.toLowerCase();
  const detected = normalizeRequestedData(input.requestedDataCategories);

  const stated_purposes: { id: string; label: string; rationale: string }[] = [];
  const required_claims: string[] = [];
  const optional_claims: string[] = [];
  const assumptions: string[] = [];
  const clarification_questions: string[] = [];
  const unsupported_needs: string[] = [];

  const hasAdult = /\b18\+|\bover 18\b|\baged 18\b|18 years|\badult(s)?\b|eligibility/.test(text);
  const hasHumanNeed = /\bhuman(s)?\b|real (people|humans|person)|\bcommunity\b|\bbot(s)?\b|one account|unique/.test(text) || hasAdult;
  const hasSenior = /\bsenior(s)?\b|older adults/.test(text);
  const hasExplicitAge = /\b(6[05]|18|21)\b/.test(text);
  const hasDelivery = /\bdeliver(y|ed)?\b|\bship(ping|ped)?\b|\bpostal\b|physical (goods|product)|send (the )?product/.test(text);
  const hasUniqueNeed = /one account|single account|no duplicate|unique person|prevent(ing)? multiple|one vote|1 vote|per person/.test(text);

  if (hasAdult) {
    stated_purposes.push({ id: "adult_eligibility", label: "Adult eligibility", rationale: "The service describes an 18+ / adult context." });
    required_claims.push("over_18");
    assumptions.push("Assumed the minimum age is 18 based on the '18+' / adult wording.");
  }
  if (hasHumanNeed) {
    stated_purposes.push({ id: "human_verification", label: "Human verification", rationale: "The service needs participants to be real, verified humans." });
    if (!required_claims.includes("human_verified")) required_claims.push("human_verified");
  }
  if (hasSenior && !hasExplicitAge) {
    clarification_questions.push("You mentioned 'seniors' — which minimum age applies (for example 60 or 65)? A specific threshold is needed before recommending an age proof.");
  }
  if (hasUniqueNeed) {
    optional_claims.push("unique_person");
    stated_purposes.push({ id: "uniqueness", label: "One account / one vote per person", rationale: "The service mentions preventing duplicates." });
  }
  if (hasDelivery) {
    stated_purposes.push({ id: "product_delivery", label: "Product delivery", rationale: "The service mentions shipping/delivery of a physical product." });
    unsupported_needs.push("Product delivery may require a shipping address, which the current proof catalog does not cover.");
  }

  // potentially unnecessary = detected items not tied to an established purpose.
  // Address is NOT flagged when a delivery purpose is present.
  const purposeNeedsAddress = hasDelivery;
  const potentially_unnecessary_data = detected
    .filter((item) => !(item === "address" && purposeNeedsAddress))
    .map((item: RequestedDataCategory) => ({
      item,
      reason_for_flag: "Necessity for the stated purpose could not be confirmed. Additional legal, fraud-prevention, delivery, or operational purposes may change this.",
    }));

  const summary =
    required_claims.length > 0
      ? `For the stated purpose, the minimum proofs are ${required_claims.join(" and ")}. ${potentially_unnecessary_data.length} requested data item(s) could not be tied to the stated purpose.`
      : `The stated purpose is unclear. ${clarification_questions.length} clarification(s) are needed before recommending proofs.`;

  return {
    version: "2" as const,
    stated_purposes,
    detected_requested_data: detected,
    required_claims,
    optional_claims,
    potentially_unnecessary_data,
    unsupported_needs,
    assumptions,
    clarification_questions,
    summary,
  };
}

export class MockProvider implements OrcaProvider {
  async analyze(input: OrcaInput): Promise<OrcaResult> {
    const start = Date.now();
    const raw = analyzeRules(input);
    const latency_ms = Math.max(1, Date.now() - start);
    return {
      raw,
      meta: {
        source: "MOCK",
        model: "mock/rule-based-analyzer", // the mock's model is definitively known (not gateway-resolved)
        response_model: null,
        latency_ms,
        request_id: idFor(input.sanitizedServiceText + "|" + input.requestedDataCategories.join(",")),
        cost_usd: null,
        note: "MOCK — deterministic rule-based analyzer, not a real model call. Set ORCAROUTER_API_KEY for real OrcaRouter metadata.",
      },
    };
  }
}
