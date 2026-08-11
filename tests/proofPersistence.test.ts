import { describe, it, expect, vi, afterEach } from "vitest";

// Problem 4: with keys stable across restart but revocation in-memory only, a revoked proof would
// come back VALID after restart. This test turns ON file persistence and simulates a restart via
// reloadFromDisk(), proving the revoked proof stays REVOKED.
describe("Problem 4 — revocation survives restart", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("a revoked, still-in-TTL proof stays REVOKED after a simulated restart", async () => {
    vi.stubEnv("PROOF_PERSIST", "on");
    vi.stubEnv("PROOF_STATE_DIR", ".humanproof-test/p4");
    vi.resetModules();

    const store = await import("@/lib/proof/store");
    store._reset();
    const proof = await import("@/lib/proof/proof");

    const { token, revocationCode } = proof.issueConsentedProof({ userId: "u", audience: "svc-A", consentedClaims: ["over_18"] });
    expect(proof.verifyProof(token, "svc-A").status).toBe("VALID");
    expect(proof.revokeByCode(revocationCode)).toBe(true);
    expect(proof.verifyProof(token, "svc-A").status).toBe("REVOKED");

    // Simulate restart: same seed -> same keys; revocation re-read from disk.
    store.reloadFromDisk();
    expect(proof.verifyProof(token, "svc-A").status).toBe("REVOKED");

    store._reset();
  });
});
