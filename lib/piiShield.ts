// PII Shield: detect real personal-data VALUES in free text. Policy: if any real value is
// detected we BLOCK submission and ask the user to remove it, rather than masking and hoping
// the mask was complete (masking cannot reliably catch every name/address).
// Source: HumanProof_MASTER §8, D-010/D-027, Requirements FR-02/NFR-01/NFR-02, Delta §2/§5.
//
// This is a heuristic pre-filter (app-side control). Absence of a finding is NOT a proof of
// absence of PII — it only means no known pattern matched. The audit reflects that basis
// honestly (see lib/analyze.ts) instead of asserting an unconditional "0".

export type PiiFindingType =
  | "email"
  | "phone_number"
  | "exact_birth_date"
  | "government_id_number"
  | "postal_code"
  | "address"
  | "person_name";

export interface PiiFinding {
  type: PiiFindingType; // never the raw value — we do not echo detected PII back
}

export interface ShieldResult {
  clean: boolean;
  findings: PiiFinding[]; // de-duplicated by type
}

interface Detector {
  type: PiiFindingType;
  re: RegExp;
}

// Order roughly specific -> general. All are used; we only need to know *whether* each type hit.
const DETECTORS: Detector[] = [
  { type: "email", re: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/ },
  // ISO / slash numeric dates
  { type: "exact_birth_date", re: /\b(?:\d{4}[-/]\d{1,2}[-/]\d{1,2}|\d{1,2}[-/]\d{1,2}[-/]\d{4})\b/ },
  // Japanese dates: 1990年5月1日 / 令和6年1月1日 (with optional spaces)
  { type: "exact_birth_date", re: /(?:令和|平成|昭和)?\s*\d{1,4}\s*年\s*\d{1,2}\s*月\s*\d{1,2}\s*日/ },
  // Month-name dates: January 1, 1990 / 1 Jan 1990
  {
    type: "exact_birth_date",
    re: /\b(?:\d{1,2}\s+)?(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\.?\s+\d{1,2}(?:st|nd|rd|th)?,?\s+\d{4}\b/i,
  },
  // Japanese postal code: 〒123-4567 or 123-4567
  { type: "postal_code", re: /〒?\s*\d{3}-\d{4}\b/ },
  // Phone-like: +81 90-1234-5678, (555) 123-4567
  { type: "phone_number", re: /(?:\+?\d[\d\s().-]{7,}\d)/ },
  // Long digit runs (>=8) that look like ID numbers
  { type: "government_id_number", re: /\b\d{8,}\b/ },
  // English street address: number + street word
  {
    type: "address",
    re: /\b\d{1,5}\s+[A-Za-z][A-Za-z.'-]*(?:\s+[A-Za-z][A-Za-z.'-]*)*\s+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Court|Ct|Way)\b\.?/i,
  },
  // Japanese address: <prefecture>(都道府県) ... <municipality>(市区町村), optionally with 丁目/番地/号
  {
    type: "address",
    re: /[一-鿿]{2,4}(?:都|道|府|県)[一-鿿぀-ゟ゠-ヿ]{1,12}(?:市|区|町|村)/,
  },
  { type: "address", re: /[一-鿿぀-ゟ゠-ヿ\d]{1,20}(?:丁目|番地|番|号)/ },
  // Person name: contextual ("user Jane", "name: Taro") + a small curated dictionary.
  // We deliberately do not block common Japanese surnames on their own: the same strings
  // occur in organization/place names (e.g. 佐藤商店, 山本ビル), which are valid service
  // requirements. Japanese names are blocked when labelled or paired with an honorific.
  {
    type: "person_name",
    re: /\b(?:user|users|name|named|customer|member|applicant|our user)\s*:?\s+([A-Z][a-z]{1,})\b/,
  },
  {
    type: "person_name",
    re: /\b(?:Jane|John|Taro|Hanako|Yamada|Tanaka|Suzuki|Sato|Smith|Doe|Alice|Bob|Carol)\b/i,
  },
  // Japanese personal name with honorific: 山田さん / 田中様
  { type: "person_name", re: /[一-鿿]{1,4}(?:さん|様|氏|くん|ちゃん)/ },
  // Labeled Japanese name: 氏名：山田太郎 / 名前: たろう
  { type: "person_name", re: /(?:氏名|名前|お名前)\s*[:：]\s*[一-鿿ぁ-ゟ゠-ヿ]{2,8}/ },
];

/** Scan free text for real PII values. Does not mask; reports which types were found. */
export function scanForPii(input: string): ShieldResult {
  const text = input ?? "";
  const types = new Set<PiiFindingType>();
  for (const d of DETECTORS) {
    if (d.re.test(text)) types.add(d.type);
  }
  const findings = [...types].map((type) => ({ type }));
  return { clean: findings.length === 0, findings };
}

export const PII_TYPE_LABELS: Record<PiiFindingType, string> = {
  email: "email address",
  phone_number: "phone number",
  exact_birth_date: "date",
  government_id_number: "ID / long number",
  postal_code: "postal code",
  address: "street/postal address",
  person_name: "person name",
};
