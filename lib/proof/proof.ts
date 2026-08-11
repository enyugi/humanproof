// Signed Proof: issue (sign) + verify + revoke-by-code. Real Ed25519 signatures over an
// audience-bound, short-lived, pairwise-subject payload. Source: HumanProof_MASTER §7/§8,
// Requirements FR-08..FR-11, D-008/D-009.
//
// CUSTOM (non-standard) compact token format, not JWT/JWS/VC — stated as such in UI/README.
// Server owns the TTL. Verification strictly validates shape/claims/bounds even with a valid
// signature. Revocation authority is a separate secret CODE (not the token), so a Verifier that
// only sees the proof cannot revoke it.

import { sign as edSign, verify as edVerify, randomUUID, randomBytes, createHash } from "node:crypto";
import { z } from "zod";
import { SUPPORTED_CLAIMS, type Claim } from "../claims";
import { ClaimEnum } from "../schema";
import { DEMO_ISSUER_ID, getIssuerPrivateKey, getIssuerPublicKey, pairwiseSubject } from "./issuer";
import { DEMO_USER_HELD_CLAIMS } from "./demoUser";
import { isRevoked, addRevoked, putRevAuth, lookupRevAuth } from "./store";

export const POLICY_TTL_SECONDS = 300;
export const MAX_TTL_SECONDS = 300;
export const CLOCK_SKEW_SECONDS = 60;
export const MAX_TOKEN_BYTES = 4096;
const MAX_STR = 256;

export interface ProofPayload {
  typ: "proof";
  iss: string;
  sub: string;
  aud: string;
  claims: Claim[];
  iat: number;
  exp: number;
  jti: string;
}

// Strict validation applied AFTER signature verification. Bounds guard against oversized fields,
// empty/duplicate/over-count claims, inverted or over-long lifetimes (Problem 5).
const ProofPayloadSchema = z
  .object({
    typ: z.literal("proof"),
    iss: z.string().min(1).max(MAX_STR),
    sub: z.string().min(1).max(MAX_STR),
    aud: z.string().min(1).max(MAX_STR),
    claims: z.array(ClaimEnum).min(1).max(SUPPORTED_CLAIMS.length),
    iat: z.number().int().nonnegative(),
    exp: z.number().int().positive(),
    jti: z.string().min(1).max(MAX_STR),
  })
  .strict()
  .refine((p) => p.exp > p.iat, { message: "exp must be after iat" })
  .refine((p) => p.exp - p.iat <= MAX_TTL_SECONDS, { message: "lifetime exceeds policy" })
  .refine((p) => new Set(p.claims).size === p.claims.length, { message: "duplicate claims" });

function b64url(s: string): string {
  return Buffer.from(s, "utf8").toString("base64url");
}
function unb64url(s: string): string {
  return Buffer.from(s, "base64url").toString("utf8");
}

export function encodeToken(payload: object): string {
  const bodyB64 = b64url(JSON.stringify(payload));
  const sig = edSign(null, Buffer.from(bodyB64, "utf8"), getIssuerPrivateKey()).toString("base64url");
  return `${bodyB64}.${sig}`;
}
export const encodeProof = encodeToken;

export function verifyTokenSignature(token: string): { ok: boolean; issuerKnown: boolean; body: unknown } {
  if (typeof token !== "string" || token.length > MAX_TOKEN_BYTES) return { ok: false, issuerKnown: false, body: null };
  const parts = token.split(".");
  if (parts.length !== 2) return { ok: false, issuerKnown: false, body: null };
  const [bodyB64, sigB64] = parts;
  let body: unknown;
  try {
    body = JSON.parse(unb64url(bodyB64));
  } catch {
    return { ok: false, issuerKnown: false, body: null };
  }
  const iss = (body as { iss?: unknown })?.iss;
  const pub = typeof iss === "string" ? getIssuerPublicKey(iss) : null;
  if (!pub) return { ok: false, issuerKnown: false, body };
  let ok = false;
  try {
    ok = edVerify(null, Buffer.from(bodyB64, "utf8"), pub, Buffer.from(sigB64, "base64url"));
  } catch {
    ok = false;
  }
  return { ok, issuerKnown: true, body };
}

export interface IssueConsentedProofInput {
  userId: string;
  audience: string;
  consentedClaims: Claim[];
  ttlSeconds?: number;
  nowMs?: number;
}
export interface IssueResult {
  token: string;
  payload: ProofPayload;
  excluded_claims: Claim[];
  revocationCode: string; // secret returned ONLY to the holder; grants revocation authority
}

function hashCode(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

export function issueConsentedProof(input: IssueConsentedProofInput): IssueResult {
  const nowMs = input.nowMs ?? Date.now();
  const requestedTtl = input.ttlSeconds ?? POLICY_TTL_SECONDS;
  const ttl = Math.min(Math.max(1, Math.floor(requestedTtl)), MAX_TTL_SECONDS); // server policy wins

  const allow = new Set<string>(SUPPORTED_CLAIMS);
  const held = new Set<string>(DEMO_USER_HELD_CLAIMS);
  const seen = new Set<Claim>();
  const claims: Claim[] = [];
  const excluded: Claim[] = [];
  for (const c of input.consentedClaims) {
    if (seen.has(c)) continue;
    seen.add(c);
    if (allow.has(c) && held.has(c)) claims.push(c);
    else excluded.push(c);
  }

  const iat = Math.floor(nowMs / 1000);
  const payload: ProofPayload = {
    typ: "proof",
    iss: DEMO_ISSUER_ID,
    sub: pairwiseSubject(input.userId, input.audience),
    aud: input.audience,
    claims,
    iat,
    exp: iat + ttl,
    jti: randomUUID(),
  };

  // Revocation authority: a high-entropy secret code, returned only to the holder. We store its
  // HASH mapped to (jti, exp). The proof token does NOT contain the code (Problem 3).
  const revocationCode = randomBytes(32).toString("base64url");
  putRevAuth(hashCode(revocationCode), payload.jti, payload.exp, nowMs);

  return { token: encodeToken(payload), payload, excluded_claims: excluded, revocationCode };
}

/** Revoke using the secret revocation code (holder authority), not the proof token. */
export function revokeByCode(revocationCode: string, nowMs = Date.now()): boolean {
  if (typeof revocationCode !== "string" || revocationCode.length === 0 || revocationCode.length > MAX_STR) return false;
  const entry = lookupRevAuth(hashCode(revocationCode), nowMs);
  if (!entry) return false;
  return addRevoked(entry.jti, entry.exp, nowMs);
}

export type VerifyStatus =
  | "VALID"
  | "MALFORMED"
  | "UNKNOWN_ISSUER"
  | "BAD_SIGNATURE"
  | "AUDIENCE_MISMATCH"
  | "EXPIRED"
  | "REVOKED";

export interface VerifyChecks {
  signature: boolean;
  issuer: boolean;
  audience: boolean;
  expiry: boolean;
  revocation: boolean;
}
export interface VerifyResult {
  status: VerifyStatus;
  checks: VerifyChecks;
  issuer?: string;
  subject?: string;
  claims?: Claim[];
  expires_at?: number;
}

const FAIL: VerifyChecks = { signature: false, issuer: false, audience: false, expiry: false, revocation: false };

export function verifyProof(token: string, expectedAudience: string, nowMs: number = Date.now()): VerifyResult {
  if (typeof token !== "string" || token.length === 0 || token.length > MAX_TOKEN_BYTES) {
    return { status: "MALFORMED", checks: { ...FAIL } };
  }
  const sig = verifyTokenSignature(token);
  const checks: VerifyChecks = { ...FAIL };

  checks.issuer = sig.issuerKnown;
  if (!sig.issuerKnown) return { status: "UNKNOWN_ISSUER", checks };
  checks.signature = sig.ok;
  if (!sig.ok) return { status: "BAD_SIGNATURE", checks };

  const parsed = ProofPayloadSchema.safeParse(sig.body);
  if (!parsed.success) return { status: "MALFORMED", checks };
  const p = parsed.data;
  const nowSec = Math.floor(nowMs / 1000);
  if (p.iat > nowSec + CLOCK_SKEW_SECONDS) return { status: "MALFORMED", checks }; // future-dated

  checks.audience = p.aud === expectedAudience;
  checks.expiry = nowSec < p.exp;
  checks.revocation = !isRevoked(p.jti, nowMs);

  const base = { checks, issuer: p.iss, subject: p.sub, claims: p.claims, expires_at: p.exp };
  if (!checks.audience) return { status: "AUDIENCE_MISMATCH", ...base };
  if (!checks.expiry) return { status: "EXPIRED", ...base };
  if (!checks.revocation) return { status: "REVOKED", ...base };
  return { status: "VALID", ...base };
}
