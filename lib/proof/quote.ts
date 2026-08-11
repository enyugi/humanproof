// Quote = a short-lived, issuer-signed statement of EXACTLY the audience + issuable claims the
// server confirmed for a selection. IMPORTANT: a quote is "the server confirmed this set", NOT
// "the user consented". Consent is a separate, explicit affirmative act carried at issue time and
// bound to a specific quote (Problem 2 — do not conflate confirmation with consent).
//
// Issuance trusts only a valid quote for the audience/claims, so a proof can never diverge from
// what was reviewed. Separate token type (typ:"quote") — cannot be used as a proof or vice versa.

import { randomUUID } from "node:crypto";
import { z } from "zod";
import { SUPPORTED_CLAIMS, type Claim } from "../claims";
import { ClaimEnum } from "../schema";
import { DEMO_ISSUER_ID } from "./issuer";
import { DEMO_USER_HELD_CLAIMS } from "./demoUser";
import { encodeToken, verifyTokenSignature, CLOCK_SKEW_SECONDS } from "./proof";

export const QUOTE_TTL_SECONDS = 120; // must be acted on promptly
const MAX_STR = 256;

interface QuotePayload {
  typ: "quote";
  iss: string;
  aud: string;
  claims: Claim[];
  iat: number;
  exp: number;
  jti: string;
}

const QuoteSchema = z
  .object({
    typ: z.literal("quote"),
    iss: z.string().min(1).max(MAX_STR),
    aud: z.string().min(1).max(MAX_STR),
    claims: z.array(ClaimEnum).min(1).max(SUPPORTED_CLAIMS.length),
    iat: z.number().int().nonnegative(),
    exp: z.number().int().positive(),
    jti: z.string().min(1).max(MAX_STR),
  })
  .strict()
  .refine((p) => p.exp > p.iat, { message: "exp must be after iat" })
  .refine((p) => p.exp - p.iat <= QUOTE_TTL_SECONDS, { message: "quote lifetime exceeds policy" })
  .refine((p) => new Set(p.claims).size === p.claims.length, { message: "duplicate claims" });

export interface Quote {
  token: string;
  audience: string;
  claims: Claim[]; // exactly what will be issued
  excluded: Claim[]; // requested but not issuable (not held / not allowlisted)
  expires_at: number;
}

/** Build a quote for the canonical issuable set of the requested claims. Empty issuable => null. */
export function issueQuote(audience: string, requestedClaims: Claim[], nowMs = Date.now()): Quote | null {
  if (typeof audience !== "string" || audience.length === 0 || audience.length > MAX_STR) return null;
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
  if (claims.length === 0) return null;

  const iat = Math.floor(nowMs / 1000);
  const payload: QuotePayload = { typ: "quote", iss: DEMO_ISSUER_ID, aud: audience, claims, iat, exp: iat + QUOTE_TTL_SECONDS, jti: randomUUID() };
  return { token: encodeToken(payload), audience, claims, excluded, expires_at: payload.exp };
}

/** Verify a quote and return its fixed (audience, claims). Null if invalid/expired/malformed. */
export function verifyQuote(token: string, nowMs = Date.now()): { audience: string; claims: Claim[] } | null {
  const sig = verifyTokenSignature(token);
  if (!sig.issuerKnown || !sig.ok) return null;
  const parsed = QuoteSchema.safeParse(sig.body);
  if (!parsed.success) return null;
  const p = parsed.data;
  const nowSec = Math.floor(nowMs / 1000);
  if (p.iat > nowSec + CLOCK_SKEW_SECONDS) return null; // future-dated
  if (nowSec >= p.exp) return null; // expired
  return { audience: p.aud, claims: p.claims };
}
