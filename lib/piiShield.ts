// PII Shield: detect real personal-data VALUES in free text and mask them BEFORE anything
// is sent to the LLM gateway. Only category names may be sent, never real values.
// Source: HumanProof_MASTER §8, D-010/D-027, Requirements FR-02/NFR-01/NFR-02, Delta §2/§5.
//
// This is a heuristic pre-filter (app-side control), not a replacement for server-side policy.
// It targets structured value patterns that are reliably real values (email, phone, dates,
// long ID-number runs, obvious street addresses). It intentionally errs toward masking.

export type PiiFindingType =
  | "email"
  | "phone_number"
  | "exact_birth_date"
  | "government_id_number"
  | "address";

export interface PiiFinding {
  type: PiiFindingType;
  masked: string; // the placeholder that replaced it (never the raw value)
}

export interface ShieldResult {
  masked: string;
  findings: PiiFinding[];
  blocked: boolean; // true if we recommend blocking submission until the user fixes it
}

interface Rule {
  type: PiiFindingType;
  re: RegExp;
  placeholder: string;
}

// Order matters: email before phone (emails contain no spaces but digits), dates before id runs.
const RULES: Rule[] = [
  {
    type: "email",
    re: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
    placeholder: "[REDACTED_EMAIL]",
  },
  {
    // ISO or slash dates: 1990-05-01, 05/01/1990, 1. Jan 1990 (numeric forms)
    type: "exact_birth_date",
    re: /\b(?:\d{4}[-/]\d{1,2}[-/]\d{1,2}|\d{1,2}[-/]\d{1,2}[-/]\d{4})\b/g,
    placeholder: "[REDACTED_DATE]",
  },
  {
    // Month-name dates: January 1, 1990 / 1 Jan 1990
    type: "exact_birth_date",
    re: /\b(?:\d{1,2}\s+)?(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\.?\s+\d{1,2}(?:st|nd|rd|th)?,?\s+\d{4}\b/gi,
    placeholder: "[REDACTED_DATE]",
  },
  {
    // Phone-like: +81 90-1234-5678, (555) 123-4567, 090 1234 5678
    type: "phone_number",
    re: /(?:\+?\d[\d\s().-]{7,}\d)/g,
    placeholder: "[REDACTED_PHONE]",
  },
  {
    // Long digit runs (>=8) that look like ID numbers, after phones handled above
    type: "government_id_number",
    re: /\b\d{8,}\b/g,
    placeholder: "[REDACTED_ID_NUMBER]",
  },
  {
    // Simple street address: number + street word
    type: "address",
    re: /\b\d{1,5}\s+[A-Za-z][A-Za-z.'-]*(?:\s+[A-Za-z][A-Za-z.'-]*)*\s+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Court|Ct|Way)\b\.?/gi,
    placeholder: "[REDACTED_ADDRESS]",
  },
];

/** Detect and mask real PII values in free text. Returns masked text + findings. */
export function shieldText(input: string): ShieldResult {
  let masked = input ?? "";
  const findings: PiiFinding[] = [];

  for (const rule of RULES) {
    masked = masked.replace(rule.re, () => {
      findings.push({ type: rule.type, masked: rule.placeholder });
      return rule.placeholder;
    });
  }

  // We mask (not hard-block) by default so the flow continues, but flag for the UI.
  return { masked, findings, blocked: false };
}

/** True if the given text still appears to contain a raw value of a masked kind. Used in tests. */
export function containsLikelyRawPii(text: string): boolean {
  return RULES.some((r) => {
    r.re.lastIndex = 0;
    return r.re.test(text);
  });
}
