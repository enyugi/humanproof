// Consent receipt: a short-lived, issuer-signed token that fixes EXACTLY the audience and claims
// the user reviewed and consented to. Issuance trusts only this receipt, so the proof can never
// diverge from what was consented (Problem 1, invariant "only consented audience+claims").
//
// The receipt is a separate token type (typ:"consent") and can never be used as a proof, nor a
// proof as a receipt.

import { randomUUID } from "node:crypto";
import { z } from "zod";
import { SUPPORTED_CLAIMS, type Claim } from "../claims";
import { ClaimEnum } from "../schema";
import { DEMO_ISSUER_ID } from "./issuer";
import { DEMO_USER_HELD_CLAIMS } from "./demoUser";
import { encodeToken, verifyTokenSignature } from "./proof";

export const CONSENT_TTL_SECONDS = 120; // consent must be acted on promptly

interface ConsentPayload {
  typ: "consent";
  iss: string;
  aud: string;
  claims: Claim[]; // canonical issuable set (sorted)
  iat: number;
  exp: number;
  jti: string;
}

const ConsentSchema = z
  .object({
    typ: z.literal("consent"),
    iss: z.string().min(1),
    aud: z.string().min(1),
    claims: z.array(ClaimEnum),
    iat: z.number().int().nonnegative(),
    exp: z.number().int().positive(),
    jti: z.string().min(1),
  })
  .strict()
  .refine((p) => p.exp > p.iat, { message: "exp must be after iat" })
  .refine((p) => p.exp - p.iat <= CONSENT_TTL_SECONDS, { message: "consent lifetime exceeds policy" });

export interface ConsentReceipt {
  token: string;
  audience: string;
  claims: Claim[]; // exactly what will be issued
  excluded: Claim[]; // requested but not issuable (not held / not allowlisted)
  expires_at: number;
}

/** Build a consent receipt for the canonical issuable set of the requested claims. */
export function issueConsentReceipt(audience: string, requestedClaims: Claim[], nowMs = Date.now()): ConsentReceipt {
  const allow = new Set<string>(SUPPORTED_CLAIMS);
  const held = new Set<string>(DEMO_USER_HELD_CLAIMS);
  const seen = new Set<Claim>();
  const claims: Claim[] = [];
  const excluded: Claim[] = [];
  for (const c of requestedClaims) {
    if (seen.has(c)) continue;
    seen.add(c);
    if (allow.has(c) && held.has(c)) claims.push(c);
    else excluded.push(c);
  }
  claims.sort();

  const iat = Math.floor(nowMs / 1000);
  const payload: ConsentPayload = {
    typ: "consent",
    iss: DEMO_ISSUER_ID,
    aud: audience,
    claims,
    iat,
    exp: iat + CONSENT_TTL_SECONDS,
    jti: randomUUID(),
  };
  return { token: encodeToken(payload), audience, claims, excluded, expires_at: payload.exp };
}

/** Verify a consent receipt and return the fixed (audience, claims). Null if invalid/expired. */
export function verifyConsentReceipt(token: string, nowMs = Date.now()): { audience: string; claims: Claim[] } | null {
  const sig = verifyTokenSignature(token);
  if (!sig.issuerKnown || !sig.ok) return null;
  const parsed = ConsentSchema.safeParse(sig.body);
  if (!parsed.success) return null;
  if (Math.floor(nowMs / 1000) >= parsed.data.exp) return null; // expired consent
  return { audience: parsed.data.aud, claims: parsed.data.claims };
}
