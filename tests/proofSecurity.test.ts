import { describe, it, expect, beforeEach } from "vitest";
import { sign as edSign } from "node:crypto";
import {
  issueConsentedProof,
  verifyProof,
  revokeByCode,
  encodeToken,
  verifyTokenSignature,
  MAX_TTL_SECONDS,
  MAX_TOKEN_BYTES,
} from "@/lib/proof/proof";
import { issueQuote, verifyQuote } from "@/lib/proof/quote";
import { deriveKeypairFromSeed } from "@/lib/proof/issuer";
import { _reset } from "@/lib/proof/store";
import { DEMO_USER_ID } from "@/lib/proof/demoUser";
import { POST as quotePOST } from "@/app/api/proof/quote/route";
import { POST as issuePOST } from "@/app/api/proof/issue/route";
import { POST as revokePOST } from "@/app/api/proof/revoke/route";

const DEMO_ISSUER_ID = "did:humanproof:demo-issuer";
const OLD_PUBLIC_SEED = "00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff";
const now = () => Math.floor(Date.now() / 1000);

async function call(POST: (r: Request) => Promise<Response>, body: unknown) {
  const res = await POST(new Request("http://test/api", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }));
  return { status: res.status, json: (await res.json()) as Record<string, unknown> };
}

beforeEach(() => _reset());

// -------- Problem 1: no forgery from source; consent binds exactly ----------
describe("Problem 1 — unforgeable + consent binding", () => {
  it("a repo reader cannot forge a proof from the committed/old seed", () => {
    const { privateKey } = deriveKeypairFromSeed(Buffer.from(OLD_PUBLIC_SEED, "hex"));
    const bodyB64 = Buffer.from(JSON.stringify({ typ: "proof", iss: DEMO_ISSUER_ID, sub: "s", aud: "svc-A", claims: ["over_18"], iat: now(), exp: now() + 300, jti: "f" }), "utf8").toString("base64url");
    const sig = edSign(null, Buffer.from(bodyB64, "utf8"), privateKey).toString("base64url");
    expect(verifyProof(`${bodyB64}.${sig}`, "svc-A").status).toBe("BAD_SIGNATURE");
  });

  it("a quote fixes exactly the issuable audience+claims; tampering invalidates it", () => {
    const q = issueQuote("svc-A", ["over_18"])!;
    expect(verifyQuote(q.token)).toMatchObject({ audience: "svc-A", claims: ["over_18"] });
    const body = JSON.parse(Buffer.from(q.token.split(".")[0], "base64url").toString("utf8"));
    body.claims = ["over_18", "human_verified", "unique_person"];
    const tampered = `${Buffer.from(JSON.stringify(body), "utf8").toString("base64url")}.${q.token.split(".")[1]}`;
    expect(verifyQuote(tampered)).toBeNull();
  });

  it("a proof is not usable as a quote, and a quote is not usable as a proof", () => {
    const p = issueConsentedProof({ userId: DEMO_USER_ID, audience: "svc-A", consentedClaims: ["over_18"] });
    expect(verifyQuote(p.token)).toBeNull();
    const q = issueQuote("svc-A", ["over_18"])!;
    expect(verifyProof(q.token, "svc-A").status).toBe("MALFORMED");
  });
});

// -------- Problem 2: explicit consent + server TTL (route-level) ------------
describe("Problem 2 — explicit consent + server-owned TTL", () => {
  it("issue is refused without explicit consent, even with a valid quote", async () => {
    const q = await call(quotePOST, { audience: "svc-A", claims: ["over_18"] });
    const noConsent = await call(issuePOST, { quote: q.json.quote, consent: false });
    expect(noConsent.status).toBe(422);
    const missing = await call(issuePOST, { quote: q.json.quote });
    expect(missing.status).toBe(422);
  });

  it("with consent, the proof matches exactly the quoted audience+claims", async () => {
    const q = await call(quotePOST, { audience: "svc-A", claims: ["over_18"] });
    const iss = await call(issuePOST, { quote: q.json.quote, consent: true });
    expect(iss.status).toBe(200);
    const proof = iss.json.proof as { audience: string; claims: string[] };
    expect(proof.audience).toBe("svc-A");
    expect(proof.claims).toEqual(["over_18"]);
  });

  it("a quote is single-use: reusing the same quote is rejected (invariant 8)", async () => {
    const q = await call(quotePOST, { audience: "svc-A", claims: ["over_18"] });
    const first = await call(issuePOST, { quote: q.json.quote, consent: true });
    expect(first.status).toBe(200);
    const second = await call(issuePOST, { quote: q.json.quote, consent: true });
    expect(second.status).toBe(422); // already used
  });

  it("clamps an over-long requested TTL to the server maximum", () => {
    const { payload } = issueConsentedProof({ userId: DEMO_USER_ID, audience: "svc-A", consentedClaims: ["over_18"], ttlSeconds: 999_999 });
    expect(payload.exp - payload.iat).toBe(MAX_TTL_SECONDS);
  });

  it("verification rejects a signed proof whose lifetime exceeds policy", () => {
    const t = encodeToken({ typ: "proof", iss: DEMO_ISSUER_ID, sub: "s", aud: "svc-A", claims: ["over_18"], iat: now(), exp: now() + MAX_TTL_SECONDS + 100, jti: "j" });
    expect(verifyProof(t, "svc-A").status).toBe("MALFORMED");
  });
});

// -------- Problem 3: only the holder's code can revoke ----------------------
describe("Problem 3 — revocation authority is a secret code, not the token", () => {
  it("a Verifier holding only the proof token cannot revoke it", async () => {
    const iss = await call(issuePOST, { quote: (await call(quotePOST, { audience: "svc-A", claims: ["over_18"] })).json.quote, consent: true });
    const token = iss.json.token as string;
    const code = iss.json.revocationCode as string;
    // the token does not contain the code
    expect(token.includes(code)).toBe(false);
    // trying to revoke with the token (as if it were a code) is rejected
    expect((await call(revokePOST, { revocationCode: token })).status).toBe(422);
    // arbitrary identifiers are rejected
    expect((await call(revokePOST, { revocationCode: "made-up" })).status).toBe(422);
    // the real code works
    expect((await call(revokePOST, { revocationCode: code })).status).toBe(200);
    expect(verifyProof(token, "svc-A").status).toBe("REVOKED");
  });
});

// -------- Problem 5: bounds ------------------------------------------------
describe("Problem 5 — strict bounds", () => {
  const base = { typ: "proof", iss: DEMO_ISSUER_ID, sub: "s", aud: "svc-A", jti: "j" };
  it("rejects future-dated iat", () => {
    const t = encodeToken({ ...base, claims: ["over_18"], iat: now() + 10_000, exp: now() + 10_300 });
    expect(verifyProof(t, "svc-A").status).toBe("MALFORMED");
  });
  it("rejects duplicate claims", () => {
    const t = encodeToken({ ...base, claims: ["over_18", "over_18"], iat: now(), exp: now() + 300 });
    expect(verifyProof(t, "svc-A").status).toBe("MALFORMED");
  });
  it("rejects empty claims", () => {
    const t = encodeToken({ ...base, claims: [], iat: now(), exp: now() + 300 });
    expect(verifyProof(t, "svc-A").status).toBe("MALFORMED");
  });
  it("rejects an over-long audience", () => {
    const t = encodeToken({ ...base, aud: "x".repeat(300), claims: ["over_18"], iat: now(), exp: now() + 300 });
    expect(verifyProof(t, "x".repeat(300)).status).toBe("MALFORMED");
  });
  it("rejects an oversized token", () => {
    const huge = "a".repeat(MAX_TOKEN_BYTES + 10);
    expect(verifyProof(`${huge}.${huge}`, "svc-A").status).toBe("MALFORMED");
  });
  it("rejects an allowlist-violating claim", () => {
    const t = encodeToken({ ...base, claims: ["verified_creator"], iat: now(), exp: now() + 300 });
    expect(verifyProof(t, "svc-A").status).toBe("MALFORMED");
  });
});

// -------- determinism / signature sanity ----------------------------------
describe("Deterministic keys", () => {
  it("same seed yields the same public key (stable across restart/process)", () => {
    const seed = Buffer.from("bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb", "hex");
    const a = deriveKeypairFromSeed(seed).publicKey.export({ type: "spki", format: "der" });
    const b = deriveKeypairFromSeed(seed).publicKey.export({ type: "spki", format: "der" });
    expect(Buffer.compare(a as Buffer, b as Buffer)).toBe(0);
  });
  it("a token signed by the process issuer verifies", () => {
    const { token } = issueConsentedProof({ userId: DEMO_USER_ID, audience: "svc-A", consentedClaims: ["over_18"] });
    expect(verifyTokenSignature(token).ok).toBe(true);
  });
});
