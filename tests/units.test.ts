import { describe, it, expect } from "vitest";
import { normalizeRequestedData, distinctDataCount, canonicalCategory } from "@/lib/normalize";
import { shieldText } from "@/lib/piiShield";
import { enforcePolicy } from "@/lib/policy";
import type { Analysis } from "@/lib/schema";

describe("normalize (FR-04 / D-028)", () => {
  it("dedups identical canonical values (single-emit)", () => {
    expect(normalizeRequestedData(["full_name", "full_name", "address"])).toEqual(["full_name", "address"]);
  });
  it("maps 'ID photo' variants to a single id_photo (no double count)", () => {
    expect(canonicalCategory("ID photo")).toBe("id_photo");
    expect(distinctDataCount(["ID photo", "id photo", "photo of id"])).toBe(1);
  });
  it("demo set is 4 distinct", () => {
    expect(distinctDataCount(["full_name", "exact_birth_date", "address", "id_photo"])).toBe(4);
  });
});

describe("piiShield (FR-02 / NFR-01 / NFR-02)", () => {
  it("masks email, date, and long id numbers", () => {
    const r = shieldText("dob 1990-05-01, mail a@b.com, id 12345678");
    expect(r.masked).not.toContain("1990-05-01");
    expect(r.masked).not.toContain("a@b.com");
    expect(r.masked).not.toContain("12345678");
    expect(r.findings.length).toBeGreaterThanOrEqual(3);
  });
});

describe("enforcePolicy (FR-05 / FR-07 / NFR-08)", () => {
  const base: Analysis = {
    version: "2",
    stated_purposes: [],
    detected_requested_data: ["full_name", "full_name", "address"],
    required_claims: ["over_18", "over_18"],
    optional_claims: ["over_18", "unique_person"],
    potentially_unnecessary_data: [
      { item: "full_name", reason_for_flag: "This is unnecessary and excessive." },
      { item: "email", reason_for_flag: "not detected, should be dropped" },
    ],
    unsupported_needs: [],
    assumptions: [],
    clarification_questions: [],
    summary: "This data is unnecessary.",
  };

  it("dedups detected, disjoints required/optional, limits flags to detected, neutralizes banned words", () => {
    const e = enforcePolicy(base);
    expect(e.detected_requested_data).toEqual(["full_name", "address"]);
    expect(e.required_claims).toEqual(["over_18"]);
    expect(e.optional_claims).toEqual(["unique_person"]); // over_18 removed (in required)
    // email flag dropped (not detected); full_name kept
    expect(e.potentially_unnecessary_data.map((p) => p.item)).toEqual(["full_name"]);
    // banned determinations neutralized
    expect(e.summary.toLowerCase()).not.toMatch(/\bexcessive\b/);
    expect(e.potentially_unnecessary_data[0].reason_for_flag.toLowerCase()).not.toMatch(/\bexcessive\b/);
    expect(e.data_count).toBe(2);
    expect(e.proof_count).toBe(1);
  });
});
