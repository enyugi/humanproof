import { describe, it, expect, beforeEach } from "vitest";
import { issueConsentedProof, verifyProof, revokeByCode, encodeToken, type ProofPayload } from "@/lib/proof/proof";
import { _reset } from "@/lib/proof/store";
import { DEMO_USER_ID } from "@/lib/proof/demoUser";
import type { Claim } from "@/lib/claims";

const AUD = "svc-A";
const issue = (over: Partial<Parameters<typeof issueConsentedProof>[0]> = {}) =>
  issueConsentedProof({ userId: DEMO_USER_ID, audience: AUD, consentedClaims: ["over_18", "human_verified"], ...over });

beforeEach(() => _reset());

describe("G. Proof lifecycle", () => {
  it("valid: correct audience -> VALID with all checks passing", () => {
    const { token, payload } = issue();
    const r = verifyProof(token, AUD);
    expect(r.status).toBe("VALID");
    expect(r.checks).toEqual({ signature: true, issuer: true, audience: true, expiry: true, revocation: true });
    expect(r.claims?.sort()).toEqual(["human_verified", "over_18"]);
    expect(r.subject).toBe(payload.sub);
  });

  it("expired: exp in the past -> EXPIRED", () => {
    const { token } = issue({ nowMs: Date.now() - 400_000, ttlSeconds: 300 });
    expect(verifyProof(token, AUD).status).toBe("EXPIRED");
  });

  it("revoked: revoke via code -> REVOKED on re-verify", () => {
    const { token, revocationCode } = issue();
    expect(verifyProof(token, AUD).status).toBe("VALID");
    expect(revokeByCode(revocationCode)).toBe("revoked");
    expect(verifyProof(token, AUD).status).toBe("REVOKED");
  });

  it("wrong audience -> AUDIENCE_MISMATCH", () => {
    const { token } = issue();
    const r = verifyProof(token, "svc-B");
    expect(r.status).toBe("AUDIENCE_MISMATCH");
    expect(r.checks.audience).toBe(false);
  });

  it("tampered signature -> BAD_SIGNATURE", () => {
    const a = issue();
    const b = issue({ audience: "svc-B" });
    const tampered = `${a.token.split(".")[0]}.${b.token.split(".")[1]}`;
    const r = verifyProof(tampered, AUD);
    expect(r.status).toBe("BAD_SIGNATURE");
    expect(r.checks.signature).toBe(false);
  });

  it("unknown issuer -> UNKNOWN_ISSUER", () => {
    const now = Math.floor(Date.now() / 1000);
    const forged: ProofPayload = { typ: "proof", iss: "did:humanproof:not-trusted", sub: "x", aud: AUD, claims: ["over_18"], iat: now, exp: now + 300, jti: "j1" };
    expect(verifyProof(encodeToken(forged), AUD).status).toBe("UNKNOWN_ISSUER");
  });

  it("pairwise subject: same user differs per audience, stable within an audience", () => {
    const subA1 = issue({ audience: "svc-A" }).payload.sub;
    const subA2 = issue({ audience: "svc-A" }).payload.sub;
    const subB = issue({ audience: "svc-B" }).payload.sub;
    expect(subA1).toBe(subA2);
    expect(subA1).not.toBe(subB);
  });
});

describe("Consent enforcement at issue (FR-08)", () => {
  it("only consented claims are included", () => {
    expect(issue({ consentedClaims: ["over_18"] }).payload.claims).toEqual(["over_18"]);
  });
  it("non-allowlisted / non-held claims are excluded, not signed in", () => {
    const { payload, excluded_claims } = issue({ consentedClaims: ["over_18", "verified_creator" as Claim] });
    expect(payload.claims).toEqual(["over_18"]);
    expect(excluded_claims).toContain("verified_creator");
  });
});
