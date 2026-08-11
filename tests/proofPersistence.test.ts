import { describe, it, expect, vi, afterEach } from "vitest";
import fs from "node:fs";

// Problem 4: a revoked, still-in-TTL proof must NOT come back VALID after a restart. This simulates
// a real restart boundary: vi.resetModules() + fresh dynamic import re-runs module initialization —
// issuer key derivation (from the PERSISTED seed) and store load from disk — not just a cache clear.

const DIR = `.humanproof-test/restart-${process.pid}`;

afterEach(() => {
  vi.unstubAllEnvs();
  try {
    fs.rmSync(DIR, { recursive: true, force: true });
  } catch {
    /* ignore */
  }
});

describe("Problem 4 — revocation survives a real restart (module re-init + disk)", () => {
  it("revoked proof stays REVOKED after restart; seed is persisted (not env)", async () => {
    vi.stubEnv("PROOF_PERSIST", "on");
    vi.stubEnv("PROOF_STATE_DIR", DIR);
    vi.stubEnv("PROOF_ISSUER_SEED", ""); // no env seed: seed is generated + persisted, then re-read

    // --- process A: init, issue, revoke ---
    vi.resetModules();
    const proofA = await import("@/lib/proof/proof");
    const { token, revocationCode } = proofA.issueConsentedProof({ userId: "u", audience: "svc-A", consentedClaims: ["over_18"] });
    expect(proofA.verifyProof(token, "svc-A").status).toBe("VALID");
    expect(proofA.revokeByCode(revocationCode)).toBe("revoked");
    expect(proofA.verifyProof(token, "svc-A").status).toBe("REVOKED");

    const seedPersisted = JSON.parse(fs.readFileSync(`${DIR}/state.json`, "utf8")).seedHex as string;
    expect(seedPersisted).toMatch(/^[0-9a-f]{64}$/);

    // --- restart: brand-new module graph re-derives keys from disk seed + reloads revocation ---
    vi.resetModules();
    const proofB = await import("@/lib/proof/proof");

    // same key (persisted seed) -> signature still valid; revocation persisted -> still REVOKED
    expect(proofB.verifyProof(token, "svc-A").status).toBe("REVOKED");
  });
});
