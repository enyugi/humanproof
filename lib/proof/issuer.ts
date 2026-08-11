// Demo Trusted Issuer — SIMULATED. It holds a real Ed25519 keypair (generated per server
// process) so signatures and verification are genuine, but it does NOT perform real identity
// verification. This is made explicit in the UI and README (FR-13, D-007).
//
// A Verifier trusts an Issuer by knowing its id + public key (issuer registry below). HumanProof
// itself is not the root of trust (HumanProof_MASTER §6).

import { generateKeyPairSync, createHmac, type KeyObject } from "node:crypto";

export const DEMO_ISSUER_ID = "did:humanproof:demo-issuer";

// Generated once per process. Real asymmetric keys — private signs, public verifies.
const { publicKey, privateKey } = generateKeyPairSync("ed25519");

// Secret used only to derive pairwise subjects (kept server-side, never exported).
const pairwiseSecret = generateKeyPairSync("ed25519").privateKey.export({ type: "pkcs8", format: "der" });

export function getIssuerPrivateKey(): KeyObject {
  return privateKey;
}

// Issuer registry: which issuers a Verifier trusts, and their public keys.
const REGISTRY: Record<string, KeyObject> = {
  [DEMO_ISSUER_ID]: publicKey,
};

export function getIssuerPublicKey(issuerId: string): KeyObject | null {
  return REGISTRY[issuerId] ?? null;
}

/**
 * Pairwise pseudonymous subject: stable per (user, audience) but uncorrelatable across audiences.
 * Source: Requirements FR-09, D-009.
 */
export function pairwiseSubject(userId: string, audience: string): string {
  return createHmac("sha256", pairwiseSecret).update(`${userId}|${audience}`).digest("base64url");
}
