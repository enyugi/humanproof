// Fixed Claim Catalog and requested-data categories.
// Source: HumanProof_MASTER §7, MVP_Scope, ClaudeCode_Delta_Instructions §4 (Requirements FR-04/FR-07, D-028).

export const SUPPORTED_CLAIMS = ["human_verified", "over_18", "unique_person"] as const;
export type Claim = (typeof SUPPORTED_CLAIMS)[number];

// Canonical requested-data categories. Each underlying item maps to exactly one value.
export const REQUESTED_DATA_CATEGORIES = [
  "full_name",
  "exact_birth_date",
  "address",
  "phone_number",
  "email",
  "face_image",
  "id_photo",
  "driver_license_number",
  "government_id_number",
  "raw_identity_document",
] as const;
export type RequestedDataCategory = (typeof REQUESTED_DATA_CATEGORIES)[number];

// Human-facing labels for the UI (values, not real PII).
export const CATEGORY_LABELS: Record<RequestedDataCategory, string> = {
  full_name: "Full name",
  exact_birth_date: "Exact date of birth",
  address: "Home address",
  phone_number: "Phone number",
  email: "Email",
  face_image: "Face image (selfie)",
  id_photo: "ID photo",
  driver_license_number: "Driver license number",
  government_id_number: "Government ID number",
  raw_identity_document: "Raw identity document",
};

export const CLAIM_LABELS: Record<Claim, string> = {
  human_verified: "Verified Human",
  over_18: "Over 18",
  unique_person: "Unique person",
};

export function isClaim(x: unknown): x is Claim {
  return typeof x === "string" && (SUPPORTED_CLAIMS as readonly string[]).includes(x);
}

export function isRequestedDataCategory(x: unknown): x is RequestedDataCategory {
  return typeof x === "string" && (REQUESTED_DATA_CATEGORIES as readonly string[]).includes(x);
}
