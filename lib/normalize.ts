// Deterministic normalization + single-emit + distinct counting for requested data.
// Source: ClaudeCode_Delta_Instructions §4 "正規化とカウント規則", D-028, Requirements FR-04.
//
// Rule: one requested item -> one canonical category, recorded once. "ID photo" -> id_photo
// (never additionally counted as face_image / raw_identity_document). The "N pieces" count is
// the distinct count of the normalized list.

import { REQUESTED_DATA_CATEGORIES, type RequestedDataCategory, isRequestedDataCategory } from "./claims";

// Free-text / synonym aliases -> single canonical category.
const ALIASES: Record<string, RequestedDataCategory> = {
  "full name": "full_name",
  name: "full_name",
  "legal name": "full_name",
  "date of birth": "exact_birth_date",
  "exact date of birth": "exact_birth_date",
  dob: "exact_birth_date",
  birthdate: "exact_birth_date",
  birthday: "exact_birth_date",
  "home address": "address",
  "postal address": "address",
  "phone": "phone_number",
  "phone number": "phone_number",
  "mobile number": "phone_number",
  "e-mail": "email",
  "email address": "email",
  selfie: "face_image",
  "face photo": "face_image",
  "face image": "face_image",
  "id photo": "id_photo",
  "photo of id": "id_photo",
  "identity photo": "id_photo",
  "driver license number": "driver_license_number",
  "drivers license number": "driver_license_number",
  "government id number": "government_id_number",
  "id number": "government_id_number",
  "identity document": "raw_identity_document",
  "id document": "raw_identity_document",
  "identity document image": "raw_identity_document",
};

/** Map a single raw label or enum value to one canonical category, or null if unknown. */
export function canonicalCategory(raw: string): RequestedDataCategory | null {
  const key = raw.trim().toLowerCase();
  if (isRequestedDataCategory(key)) return key;
  if (key in ALIASES) return ALIASES[key];
  // last-resort: match against canonical values with spaces instead of underscores
  const underscored = key.replace(/\s+/g, "_");
  if (isRequestedDataCategory(underscored)) return underscored;
  return null;
}

/** Normalize a list to canonical categories, single-emit (dedup), order-preserving. */
export function normalizeRequestedData(items: readonly string[]): RequestedDataCategory[] {
  const out: RequestedDataCategory[] = [];
  const seen = new Set<RequestedDataCategory>();
  for (const raw of items) {
    const canon = canonicalCategory(raw);
    if (canon && !seen.has(canon)) {
      seen.add(canon);
      out.push(canon);
    }
  }
  return out;
}

/** Distinct count after normalization — the "N pieces of personal data" number. */
export function distinctDataCount(items: readonly string[]): number {
  return normalizeRequestedData(items).length;
}

export { REQUESTED_DATA_CATEGORIES };
