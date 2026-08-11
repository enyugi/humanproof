// Signed Proof: issue (sign) + verify. Real Ed25519 signatures over an audience-bound, short-lived,
// pairwise-subject payload. Source: HumanProof_MASTER §7/§8, Requirements FR-08..FR-11, D-008/D-009.

import { sign as edSign, verify as edVerify, randomUUID } from "node:crypto";
import { SUPPORTED_CLAIMS, type Claim } from "../claims";
import { DEMO_ISSUER_ID, getIssuerPrivateKey, getIssuerPublicKey, pairwiseSubject } from "./issuer";
import { DEMO_USER_HELD_CLAIMS } from "./demoUser";
import { isRevoked } from "./revocation";

export const DEFAULT_TTL_SECONDS = 300; // short-lived

export interface ProofPayload {
  iss: string; // issuer id
  sub: string; // pairwise pseudonymous subject
  aud: string; // audience the proof is bound to
  claims: Claim[]; // disclosed claims (never PII)
  iat: number; // issued-at (unix seconds)
  exp: number; // expiry (unix seconds)
  jti: string; // unique id for revocation
}

function b64url(s: string): string {
  return Buffer.from(s, "utf8").toString("base64url");
}
function unb64url(s: string): string {
  return Buffer.from(s, "base64url").toString("utf8");
}

function signBody(bodyB64: string): string {
  return edSign(null, Buffer.from(bodyB64, "utf8"), getIssuerPrivateKey()).toString("base64url");
}

export function encodeProof(payload: ProofPayload): string {
  const bodyB64 = b64url(JSON.stringify(payload));
  return `${bodyB64}.${signBody(bodyB64)}`;
}

export interface IssueConsentedProofInput {
  userId: string;
  audience: string;
  consentedClaims: Claim[]; // the claims the user explicitly agreed to share
  ttlSeconds?: number;
  nowMs?: number;
}

export interface IssueResult {
  token: string;
  payload: ProofPayload;
  excluded_claims: Claim[]; // requested-but-not-issued (not held or not allowlisted)
}

/**
 * Issue a proof containing ONLY claims that are (a) explicitly consented, (b) actually held by the
 * user, and (c) on the allowlist. Anything else is excluded. Source: FR-07/FR-08.
 */
export function issueConsentedProof(input: IssueConsentedProofInput): IssueResult {
  const nowMs = input.nowMs ?? Date.now();
  const ttl = input.ttlSeconds ?? DEFAULT_TTL_SECONDS;
  const allow = new Set<string>(SUPPORTED_CLAIMS);
  const held = new Set<string>(DEMO_USER_HELD_CLAIMS);

  const seen = new Set<Claim>();
  const claims: Claim[] = [];
  const excluded: Claim[] = [];
  for (const c of input.consentedClaims) {
    if (allow.has(c) && held.has(c) && !seen.has(c)) {
      seen.add(c);
      claims.push(c);
    } else if (!seen.has(c)) {
      excluded.push(c);
    }
  }

  const iat = Math.floor(nowMs / 1000);
  const payload: ProofPayload = {
    iss: DEMO_ISSUER_ID,
    sub: pairwiseSubject(input.userId, input.audience),
    aud: input.audience,
    claims,
    iat,
    exp: iat + ttl,
    jti: randomUUID(),
  };

  return { token: encodeProof(payload), payload, excluded_claims: excluded };
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

const FAIL_CHECKS: VerifyChecks = { signature: false, issuer: false, audience: false, expiry: false, revocation: false };

export function verifyProof(token: string, expectedAudience: string, nowMs: number = Date.now()): VerifyResult {
  const parts = token.split(".");
  if (parts.length !== 2) return { status: "MALFORMED", checks: { ...FAIL_CHECKS } };
  const [bodyB64, sigB64] = parts;

  let payload: ProofPayload;
  try {
    payload = JSON.parse(unb64url(bodyB64)) as ProofPayload;
    if (!payload || typeof payload.iss !== "string" || typeof payload.jti !== "string") throw new Error("bad shape");
  } catch {
    return { status: "MALFORMED", checks: { ...FAIL_CHECKS } };
  }

  const issuerPub = getIssuerPublicKey(payload.iss);
  const checks: VerifyChecks = { ...FAIL_CHECKS };
  checks.issuer = issuerPub !== null;
  if (!issuerPub) return { status: "UNKNOWN_ISSUER", checks, issuer: payload.iss };

  try {
    checks.signature = edVerify(null, Buffer.from(bodyB64, "utf8"), issuerPub, Buffer.from(sigB64, "base64url"));
  } catch {
    checks.signature = false;
  }
  if (!checks.signature) return { status: "BAD_SIGNATURE", checks, issuer: payload.iss };

  checks.audience = payload.aud === expectedAudience;
  checks.expiry = Math.floor(nowMs / 1000) < payload.exp;
  checks.revocation = !isRevoked(payload.jti);

  const base = {
    checks,
    issuer: payload.iss,
    subject: payload.sub,
    claims: payload.claims,
    expires_at: payload.exp,
  };

  if (!checks.audience) return { status: "AUDIENCE_MISMATCH", ...base };
  if (!checks.expiry) return { status: "EXPIRED", ...base };
  if (!checks.revocation) return { status: "REVOKED", ...base };
  return { status: "VALID", ...base };
}
