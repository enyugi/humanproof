// Signed Proof: issue (sign) + verify. Real Ed25519 signatures over an audience-bound, short-lived,
// pairwise-subject payload. Source: HumanProof_MASTER §7/§8, Requirements FR-08..FR-11, D-008/D-009.
//
// This is a CUSTOM (non-standard) compact token format, not JWT/JWS/VC — stated as such in the UI
// and README (Problem 6). Server-side policy owns the TTL (Problem 2); verification strictly
// validates the payload shape, claims allowlist, and TTL bounds even when the signature is valid
// (Problem 4).

import { sign as edSign, verify as edVerify, randomUUID } from "node:crypto";
import { z } from "zod";
import { SUPPORTED_CLAIMS, type Claim } from "../claims";
import { ClaimEnum } from "../schema";
import { DEMO_ISSUER_ID, getIssuerPrivateKey, getIssuerPublicKey, pairwiseSubject } from "./issuer";
import { DEMO_USER_HELD_CLAIMS } from "./demoUser";
import { isRevoked } from "./revocation";

// Server-owned TTL policy. Clients cannot influence it. Proofs are always short-lived.
export const POLICY_TTL_SECONDS = 300;
export const MAX_TTL_SECONDS = 300;

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

// Strict validation applied AFTER signature verification. Rejects allowlist-violating claims,
// bad shapes, non-positive / inverted / over-long lifetimes — even if the signature is valid.
const ProofPayloadSchema = z
  .object({
    typ: z.literal("proof"),
    iss: z.string().min(1),
    sub: z.string().min(1),
    aud: z.string().min(1),
    claims: z.array(ClaimEnum),
    iat: z.number().int().nonnegative(),
    exp: z.number().int().positive(),
    jti: z.string().min(1),
  })
  .strict()
  .refine((p) => p.exp > p.iat, { message: "exp must be after iat" })
  .refine((p) => p.exp - p.iat <= MAX_TTL_SECONDS, { message: "lifetime exceeds server policy" });

function b64url(s: string): string {
  return Buffer.from(s, "utf8").toString("base64url");
}
function unb64url(s: string): string {
  return Buffer.from(s, "base64url").toString("utf8");
}

/** Sign an arbitrary object into a `${body}.${sig}` token with the issuer key. */
export function encodeToken(payload: object): string {
  const bodyB64 = b64url(JSON.stringify(payload));
  const sig = edSign(null, Buffer.from(bodyB64, "utf8"), getIssuerPrivateKey()).toString("base64url");
  return `${bodyB64}.${sig}`;
}
export const encodeProof = encodeToken; // back-compat alias

/** Verify token signature against a known issuer; returns the parsed body if authentic. */
export function verifyTokenSignature(token: string): { ok: boolean; issuerKnown: boolean; body: unknown } {
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
}

/**
 * Issue a proof with ONLY claims that are consented AND held AND allowlisted. TTL is clamped to the
 * server policy — callers cannot make it longer than MAX_TTL_SECONDS or non-positive (Problem 2).
 */
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
  return { token: encodeToken(payload), payload, excluded_claims: excluded };
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
  revocation: boolean; // true = not revoked
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
  const sig = verifyTokenSignature(token);
  const checks: VerifyChecks = { ...FAIL };

  checks.issuer = sig.issuerKnown;
  if (!sig.issuerKnown) return { status: "UNKNOWN_ISSUER", checks };
  checks.signature = sig.ok;
  if (!sig.ok) return { status: "BAD_SIGNATURE", checks };

  // Signature is valid — now STRICTLY validate the payload (shape, allowlist, TTL bounds).
  const parsed = ProofPayloadSchema.safeParse(sig.body);
  if (!parsed.success) return { status: "MALFORMED", checks: { ...checks, audience: false, expiry: false, revocation: false } };
  const p = parsed.data;

  checks.audience = p.aud === expectedAudience;
  checks.expiry = Math.floor(nowMs / 1000) < p.exp;
  checks.revocation = !isRevoked(p.jti);

  const base = { checks, issuer: p.iss, subject: p.sub, claims: p.claims, expires_at: p.exp };
  if (!checks.audience) return { status: "AUDIENCE_MISMATCH", ...base };
  if (!checks.expiry) return { status: "EXPIRED", ...base };
  if (!checks.revocation) return { status: "REVOKED", ...base };
  return { status: "VALID", ...base };
}

/** Extract jti+exp from a token ONLY if it is an authentic, well-formed proof (for revocation). */
export function authenticProofRef(token: string): { jti: string; exp: number } | null {
  const sig = verifyTokenSignature(token);
  if (!sig.issuerKnown || !sig.ok) return null;
  const parsed = ProofPayloadSchema.safeParse(sig.body);
  if (!parsed.success) return null;
  return { jti: parsed.data.jti, exp: parsed.data.exp };
}
