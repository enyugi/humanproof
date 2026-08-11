// The Demo Human holds attributes already "verified" by the Demo Issuer. A proof is a selective
// disclosure of a subset of these, after explicit consent. Source: HumanProof_MASTER §7, FR-13.
import type { Claim } from "../claims";

export const DEMO_USER_ID = "demo-user-001";

// Claims the Demo Issuer has issued to the demo user (the full held set).
export const DEMO_USER_HELD_CLAIMS: Claim[] = ["human_verified", "over_18", "unique_person"];

// PII the issuer verified but which is NEVER placed in a proof (shown in the consent UI as
// "not shared"). Category names only — no real values.
export const DEMO_USER_WITHHELD_PII = [
  "full_name",
  "exact_birth_date",
  "address",
  "id_photo",
] as const;
