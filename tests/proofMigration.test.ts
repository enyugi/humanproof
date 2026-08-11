import { describe, it, expect, vi, afterEach } from "vitest";
import fs from "node:fs";
import { sign as edSign } from "node:crypto";

// Safe upgrade of an EXISTING demo state file: legacy shape ({seedHex,revoked,revAuth}, mode 0644,
// no version/usedQuotes) must migrate to the current format WITHOUT losing the seed or revocations,
// without deletion, and without faking success on write failure. Uses a real module-init boundary.

const ROOT = ".humanproof-test";
const DEMO_ISSUER_ID = "did:humanproof:demo-issuer";
const LEGACY_SEED = "c0ffee00c0ffee00c0ffee00c0ffee00c0ffee00c0ffee00c0ffee00c0ffee00";

function b64url(s: string): string {
  return Buffer.from(s, "utf8").toString("base64url");
}

async function signWith(privateKey: import("node:crypto").KeyObject, payload: object): Promise<string> {
  const body = b64url(JSON.stringify(payload));
  const sig = edSign(null, Buffer.from(body, "utf8"), privateKey).toString("base64url");
  return `${body}.${sig}`;
}

afterEach(() => vi.unstubAllEnvs());

describe("Problem — legacy state migration preserves keys + revocations", () => {
  const dir = `${ROOT}/migrate-${process.pid}`;
  const file = `${dir}/state.json`;

  afterEach(() => {
    try {
      fs.chmodSync(dir, 0o700);
    } catch {
      /* ignore */
    }
    try {
      fs.rmSync(dir, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
  });

  it("existing proofs verify (same key) and a revoked one stays REVOKED; file upgraded to 0600", async () => {
    // Build a legacy fixture with real, key-consistent proofs signed by the legacy seed.
    const issuerMod = await import("@/lib/proof/issuer");
    const { privateKey } = issuerMod.deriveKeypairFromSeed(Buffer.from(LEGACY_SEED, "hex"));
    const now = Math.floor(Date.now() / 1000);
    const mk = (jti: string) => ({ typ: "proof", iss: DEMO_ISSUER_ID, sub: "s", aud: "svc-A", claims: ["over_18"], iat: now, exp: now + 300, jti });
    const revokedToken = await signWith(privateKey, mk("A"));
    const liveToken = await signWith(privateKey, mk("B"));

    const legacy = { seedHex: LEGACY_SEED, revoked: { A: now + 300 }, revAuth: {} };
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(file, JSON.stringify(legacy), { mode: 0o644 });
    fs.chmodSync(file, 0o644);

    vi.stubEnv("PROOF_PERSIST", "on");
    vi.stubEnv("PROOF_STATE_DIR", dir);
    vi.stubEnv("PROOF_ISSUER_SEED", ""); // seed must come from the migrated file
    vi.resetModules();

    const proof = await import("@/lib/proof/proof");
    // same key -> existing tokens verify; revoked stays revoked, live one is valid
    expect(proof.verifyProof(liveToken, "svc-A").status).toBe("VALID");
    expect(proof.verifyProof(revokedToken, "svc-A").status).toBe("REVOKED");

    // file migrated in place: current shape + owner-only perms + preserved data
    const migrated = JSON.parse(fs.readFileSync(file, "utf8"));
    expect(migrated.v).toBe(1);
    expect(migrated.usedQuotes).toEqual({});
    expect(migrated.seedHex).toBe(LEGACY_SEED);
    expect(migrated.revoked.A).toBeDefined();
    expect(fs.statSync(file).mode & 0o777).toBe(0o600);
  });

  it("migration write failure does NOT destroy the old file and fails closed", async () => {
    const legacy = { seedHex: LEGACY_SEED, revoked: { A: Math.floor(Date.now() / 1000) + 300 }, revAuth: {} };
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(file, JSON.stringify(legacy));
    fs.chmodSync(dir, 0o500); // read+exec, no write -> atomic write cannot create temp file

    vi.stubEnv("PROOF_PERSIST", "on");
    vi.stubEnv("PROOF_STATE_DIR", dir);
    vi.stubEnv("PROOF_ISSUER_SEED", "a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1");
    vi.resetModules();

    const store = await import("@/lib/proof/store");
    expect(store.storeHealthy()).toBe(false); // fail-closed: could not migrate

    // old file intact (not destroyed, not faked-success)
    fs.chmodSync(dir, 0o700);
    const stillThere = JSON.parse(fs.readFileSync(file, "utf8"));
    expect(stillThere.seedHex).toBe(LEGACY_SEED);
    expect(stillThere.v).toBeUndefined(); // untouched legacy
  });
});

describe("Problem — current-format-but-0644 file is protected on load", () => {
  const dir = `${ROOT}/perms644-${process.pid}`;
  afterEach(() => {
    try {
      fs.rmSync(dir, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
  });
  it("chmods a 0644 current-format file down to 0600", async () => {
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(`${dir}/state.json`, JSON.stringify({ v: 1, seedHex: LEGACY_SEED, revoked: {}, revAuth: {}, usedQuotes: {} }), { mode: 0o644 });
    fs.chmodSync(`${dir}/state.json`, 0o644);

    vi.stubEnv("PROOF_PERSIST", "on");
    vi.stubEnv("PROOF_STATE_DIR", dir);
    vi.stubEnv("PROOF_ISSUER_SEED", "");
    vi.resetModules();

    const store = await import("@/lib/proof/store");
    expect(store.storeHealthy()).toBe(true);
    expect(fs.statSync(`${dir}/state.json`).mode & 0o777).toBe(0o600);
  });
});

describe("Problem — verify route never throws unhandled (no env seed + corrupt state)", () => {
  const dir = `${ROOT}/corrupt-verify-${process.pid}`;
  afterEach(() => {
    try {
      fs.rmSync(dir, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
  });
  it("returns a structured REVOCATION_UNAVAILABLE instead of a 500/exception", async () => {
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(`${dir}/state.json`, "{ broken json");

    vi.stubEnv("PROOF_PERSIST", "on");
    vi.stubEnv("PROOF_STATE_DIR", dir);
    vi.stubEnv("PROOF_ISSUER_SEED", ""); // no env seed -> key init would throw on unavailable store
    vi.resetModules();

    const route = await import("@/app/api/proof/verify/route");
    // a token claiming the demo issuer forces key init, which fails closed rather than throwing
    const now = Math.floor(Date.now() / 1000);
    const token = `${b64url(JSON.stringify({ typ: "proof", iss: DEMO_ISSUER_ID, sub: "s", aud: "svc-A", claims: ["over_18"], iat: now, exp: now + 300, jti: "j" }))}.deadbeef`;
    const res = await route.POST(new Request("http://t/api", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token, expectedAudience: "svc-A" }) }));
    expect(res.status).toBe(200);
    expect((await res.json()).status).toBe("REVOCATION_UNAVAILABLE");
  });
});
