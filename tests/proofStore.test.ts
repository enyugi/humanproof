import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import fs from "node:fs";

// These tests exercise persist-mode failure handling with a FRESH module init per case
// (vi.resetModules + dynamic import), so issuer key derivation + store load run under the test env.

const ROOT = ".humanproof-test";
const SEED = "a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1";

async function call(POST: (r: Request) => Promise<Response>, body: unknown) {
  const res = await POST(new Request("http://t/api", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }));
  return { status: res.status, json: (await res.json().catch(() => ({}))) as Record<string, unknown> };
}

beforeEach(() => vi.resetModules());
afterEach(() => vi.unstubAllEnvs());

describe("Problem 1/5 — invalid configured seed is not silently replaced", () => {
  it("an invalid PROOF_ISSUER_SEED throws on first use (no silent fallback, invariant 6)", async () => {
    vi.stubEnv("PROOF_PERSIST", "off");
    vi.stubEnv("PROOF_ISSUER_SEED", "not-a-valid-seed");
    const issuer = await import("@/lib/proof/issuer");
    expect(() => issuer.getIssuerPrivateKey()).toThrow(); // lazy init refuses invalid seed
  });
});

describe("Problem 1/2/3/4 — fail-closed when state cannot be persisted (write-unable)", () => {
  const asFile = `${ROOT}/asfile-${process.pid}`;
  beforeEach(() => {
    fs.mkdirSync(ROOT, { recursive: true });
    fs.writeFileSync(asFile, "x"); // a FILE where a directory is expected -> writes fail
    vi.stubEnv("PROOF_PERSIST", "on");
    vi.stubEnv("PROOF_STATE_DIR", asFile); // mkdir on a file path fails
    vi.stubEnv("PROOF_ISSUER_SEED", SEED); // env seed so init does not throw; store still unwritable
  });
  afterEach(() => {
    try { fs.rmSync(asFile, { force: true }); } catch { /* ignore */ }
  });

  it("store reports unavailable; issue and revoke fail-closed; verify is not VALID", async () => {
    const store = await import("@/lib/proof/store");
    expect(store.storeHealthy()).toBe(false);

    const issue = await import("@/app/api/proof/issue/route");
    const quote = await import("@/app/api/proof/quote/route");
    const revoke = await import("@/app/api/proof/revoke/route");
    const proof = await import("@/lib/proof/proof");

    // even a well-formed quote cannot lead to issuance when state is unavailable
    const q = await call(quote.POST, { audience: "svc-A", claims: ["over_18"] });
    const iss = await call(issue.POST, { quote: q.json.quote, consent: true });
    expect(iss.status).toBe(503);

    // revocation cannot be recorded -> not success
    const rev = await call(revoke.POST, { revocationCode: "anything" });
    expect(rev.status).toBe(503);

    // a signed token cannot be confirmed non-revoked -> not VALID
    const now = Math.floor(Date.now() / 1000);
    const token = proof.encodeToken({ typ: "proof", iss: "did:humanproof:demo-issuer", sub: "s", aud: "svc-A", claims: ["over_18"], iat: now, exp: now + 300, jti: "j" });
    expect(proof.verifyProof(token, "svc-A").status).toBe("REVOCATION_UNAVAILABLE");
  });
});

describe("Problem 5 — corrupt / partial-write state file is not treated as empty-normal", () => {
  const dir = `${ROOT}/corrupt-${process.pid}`;
  beforeEach(() => {
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(`${dir}/state.json`, "{ this is not valid json"); // corrupt / truncated
    vi.stubEnv("PROOF_PERSIST", "on");
    vi.stubEnv("PROOF_STATE_DIR", dir);
    vi.stubEnv("PROOF_ISSUER_SEED", SEED);
  });
  afterEach(() => {
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch { /* ignore */ }
  });

  it("store is unavailable and verification of a token is not VALID", async () => {
    const store = await import("@/lib/proof/store");
    expect(store.storeHealthy()).toBe(false);
    const proof = await import("@/lib/proof/proof");
    const now = Math.floor(Date.now() / 1000);
    const token = proof.encodeToken({ typ: "proof", iss: "did:humanproof:demo-issuer", sub: "s", aud: "svc-A", claims: ["over_18"], iat: now, exp: now + 300, jti: "j" });
    expect(proof.verifyProof(token, "svc-A").status).toBe("REVOCATION_UNAVAILABLE");
  });
});

describe("Problem 5 — secret state file is written with restrictive permissions", () => {
  const dir = `${ROOT}/perms-${process.pid}`;
  beforeEach(() => {
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch { /* ignore */ }
    vi.stubEnv("PROOF_PERSIST", "on");
    vi.stubEnv("PROOF_STATE_DIR", dir);
    vi.stubEnv("PROOF_ISSUER_SEED", ""); // force seed generation + persistence
  });
  afterEach(() => {
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch { /* ignore */ }
  });

  it("the state file is mode 0600 (owner-only)", async () => {
    const issuer = await import("@/lib/proof/issuer");
    expect(issuer.keySource()).toBe("persisted"); // triggers seed generation + persist
    const mode = fs.statSync(`${dir}/state.json`).mode & 0o777;
    expect(mode).toBe(0o600);
  });
});
