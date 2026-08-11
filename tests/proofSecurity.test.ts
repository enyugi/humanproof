import { describe, it, expect, beforeEach } from "vitest";
import {
  issueConsentedProof,
  verifyProof,
  authenticProofRef,
  encodeToken,
  verifyTokenSignature,
  MAX_TTL_SECONDS,
  POLICY_TTL_SECONDS,
} from "@/lib/proof/proof";
import { issueConsentReceipt, verifyConsentReceipt, CONSENT_TTL_SECONDS } from "@/lib/proof/consent";
import { revoke, isRevoked, _size, _clearRevocations } from "@/lib/proof/revocation";
import { deriveKeypairFromSeed } from "@/lib/proof/issuer";
import { DEMO_USER_ID } from "@/lib/proof/demoUser";

beforeEach(() => _clearRevocations());

// ---------------------------------------------------------------------------
// Problem 1: consent cannot be changed after the fact; proof == consented set
// ---------------------------------------------------------------------------
describe("Problem 1 — consent binding", () => {
  it("a valid receipt fixes exactly the issuable audience+claims", () => {
    const r = issueConsentReceipt("svc-A", ["over_18"]);
    const v = verifyConsentReceipt(r.token);
    expect(v).toEqual({ audience: "svc-A", claims: ["over_18"] });
  });

  it("tampering the receipt body invalidates it (cannot swap in more claims after consent)", () => {
    const r = issueConsentReceipt("svc-A", ["over_18"]);
    const body = JSON.parse(Buffer.from(r.token.split(".")[0], "base64url").toString("utf8"));
    body.claims = ["over_18", "human_verified", "unique_person"]; // attacker adds claims
    const forgedBody = Buffer.from(JSON.stringify(body), "utf8").toString("base64url");
    const tampered = `${forgedBody}.${r.token.split(".")[1]}`;
    expect(verifyConsentReceipt(tampered)).toBeNull();
  });

  it("an expired receipt is rejected", () => {
    const r = issueConsentReceipt("svc-A", ["over_18"], Date.now() - (CONSENT_TTL_SECONDS + 60) * 1000);
    expect(verifyConsentReceipt(r.token)).toBeNull();
  });

  it("a proof token cannot be used as a consent receipt, and vice versa", () => {
    const proof = issueConsentedProof({ userId: DEMO_USER_ID, audience: "svc-A", consentedClaims: ["over_18"] });
    expect(verifyConsentReceipt(proof.token)).toBeNull(); // typ mismatch
    const receipt = issueConsentReceipt("svc-A", ["over_18"]);
    expect(verifyProof(receipt.token, "svc-A").status).toBe("MALFORMED"); // typ mismatch, sig valid
  });
});

// ---------------------------------------------------------------------------
// Problem 2: TTL is server policy; clients cannot lengthen/shorten it
// ---------------------------------------------------------------------------
describe("Problem 2 — TTL policy", () => {
  it("clamps an over-long requested TTL down to the server maximum", () => {
    const { payload } = issueConsentedProof({ userId: DEMO_USER_ID, audience: "svc-A", consentedClaims: ["over_18"], ttlSeconds: 999_999 });
    expect(payload.exp - payload.iat).toBe(MAX_TTL_SECONDS);
  });
  it("clamps a non-positive TTL up to at least 1 second (still short-lived)", () => {
    const { payload } = issueConsentedProof({ userId: DEMO_USER_ID, audience: "svc-A", consentedClaims: ["over_18"], ttlSeconds: -100 });
    expect(payload.exp - payload.iat).toBeGreaterThanOrEqual(1);
    expect(payload.exp - payload.iat).toBeLessThanOrEqual(POLICY_TTL_SECONDS);
  });
  it("verification rejects a signed proof whose lifetime exceeds policy", () => {
    const now = Math.floor(Date.now() / 1000);
    const overlong = encodeToken({ typ: "proof", iss: "did:humanproof:demo-issuer", sub: "s", aud: "svc-A", claims: ["over_18"], iat: now, exp: now + MAX_TTL_SECONDS + 100, jti: "j" });
    expect(verifyProof(overlong, "svc-A").status).toBe("MALFORMED");
  });
});

// ---------------------------------------------------------------------------
// Problem 3: revocation only accepts authentic proofs; memory is bounded
// ---------------------------------------------------------------------------
describe("Problem 3 — revocation authority & bounded memory", () => {
  it("rejects arbitrary identifiers / non-proof tokens", () => {
    expect(authenticProofRef("not-a-token")).toBeNull();
    expect(authenticProofRef("aaa.bbb")).toBeNull();
    const receipt = issueConsentReceipt("svc-A", ["over_18"]);
    expect(authenticProofRef(receipt.token)).toBeNull(); // a consent receipt is not a proof
  });
  it("accepts a genuine proof token", () => {
    const { token, payload } = issueConsentedProof({ userId: DEMO_USER_ID, audience: "svc-A", consentedClaims: ["over_18"] });
    expect(authenticProofRef(token)).toEqual({ jti: payload.jti, exp: payload.exp });
  });
  it("does not store already-expired revocations and prunes them (bounded memory)", () => {
    const nowSec = Math.floor(Date.now() / 1000);
    revoke("past-jti", nowSec - 10); // already expired -> not stored
    expect(_size()).toBe(0);
    revoke("future-jti", nowSec + 300);
    expect(isRevoked("future-jti")).toBe(true);
    // once its exp passes, it is pruned on next access
    expect(isRevoked("future-jti", (nowSec + 400) * 1000)).toBe(false);
    expect(_size()).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Problem 4: strict payload validation even when the signature is valid
// ---------------------------------------------------------------------------
describe("Problem 4 — strict payload validation", () => {
  const now = Math.floor(Date.now() / 1000);
  const base = { typ: "proof", iss: "did:humanproof:demo-issuer", sub: "s", aud: "svc-A", iat: now, exp: now + 300, jti: "j" };

  it("rejects an allowlist-violating claim (signed but invalid)", () => {
    const t = encodeToken({ ...base, claims: ["verified_creator"] });
    expect(verifyProof(t, "svc-A").status).toBe("MALFORMED");
  });
  it("rejects exp <= iat", () => {
    const t = encodeToken({ ...base, claims: ["over_18"], exp: now });
    expect(verifyProof(t, "svc-A").status).toBe("MALFORMED");
  });
  it("rejects a missing required field", () => {
    const t = encodeToken({ typ: "proof", iss: "did:humanproof:demo-issuer", aud: "svc-A", claims: ["over_18"], iat: now, exp: now + 300, jti: "j" }); // no sub
    expect(verifyProof(t, "svc-A").status).toBe("MALFORMED");
  });
  it("rejects unexpected extra fields (strict)", () => {
    const t = encodeToken({ ...base, claims: ["over_18"], evil: true });
    expect(verifyProof(t, "svc-A").status).toBe("MALFORMED");
  });
});

// ---------------------------------------------------------------------------
// Problem 5: deterministic keys survive restart / another process
// ---------------------------------------------------------------------------
describe("Problem 5 — deterministic keys from a seed", () => {
  it("the same seed yields the same public key (verification stable across restart/process)", () => {
    const seed = Buffer.from("00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff", "hex");
    const a = deriveKeypairFromSeed(seed).publicKey.export({ type: "spki", format: "der" });
    const b = deriveKeypairFromSeed(seed).publicKey.export({ type: "spki", format: "der" });
    expect(Buffer.compare(a as Buffer, b as Buffer)).toBe(0);
  });
  it("a token signed by the process issuer verifies (issuer key is registered)", () => {
    const { token } = issueConsentedProof({ userId: DEMO_USER_ID, audience: "svc-A", consentedClaims: ["over_18"] });
    expect(verifyTokenSignature(token).ok).toBe(true);
  });
});
