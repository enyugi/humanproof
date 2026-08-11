// Demo Trusted Issuer — SIMULATED. Holds a real Ed25519 keypair, but performs NO real identity
// verification (FR-13, D-007). A Verifier trusts an Issuer by knowing its id + public key.
// HumanProof itself is not the root of trust (HumanProof_MASTER §6).
//
// Keys and the pairwise secret are DETERMINISTIC from a seed so that Proof verification and pairwise
// subjects stay stable across process restarts and across worker processes (Problem 5). The seed
// comes from the environment; without it, a FIXED, PUBLIC demo seed is used — stable but NOT secret.
// This is a demo issuer, never presented as production/HSM-backed (Problem 6).

import { createPrivateKey, createPublicKey, createHmac, type KeyObject } from "node:crypto";

export const DEMO_ISSUER_ID = "did:humanproof:demo-issuer";

// PKCS8 DER prefix for an Ed25519 private key; the 32-byte seed is appended to form the full DER.
const PKCS8_ED25519_PREFIX = Buffer.from("302e020100300506032b657004220420", "hex");

// FIXED public demo seed (documented as insecure). Overridden by PROOF_ISSUER_SEED (64 hex chars).
const DEMO_ISSUER_SEED_HEX = "00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff";
const DEMO_PAIRWISE_SECRET = "humanproof-demo-pairwise-secret-do-not-use-in-production";

function seedFromEnv(hex: string | undefined): Buffer {
  if (hex && /^[0-9a-fA-F]{64}$/.test(hex.trim())) return Buffer.from(hex.trim(), "hex");
  return Buffer.from(DEMO_ISSUER_SEED_HEX, "hex");
}

/** Derive a stable Ed25519 keypair from a 32-byte seed (exported for determinism tests). */
export function deriveKeypairFromSeed(seed: Buffer): { privateKey: KeyObject; publicKey: KeyObject } {
  if (seed.length !== 32) throw new Error("Ed25519 seed must be 32 bytes");
  const der = Buffer.concat([PKCS8_ED25519_PREFIX, seed]);
  const privateKey = createPrivateKey({ key: der, format: "der", type: "pkcs8" });
  const publicKey = createPublicKey(privateKey);
  return { privateKey, publicKey };
}

const issuerSeed = seedFromEnv(process.env.PROOF_ISSUER_SEED);
const { privateKey, publicKey } = deriveKeypairFromSeed(issuerSeed);
const pairwiseSecret = process.env.PROOF_PAIRWISE_SECRET?.trim() || DEMO_PAIRWISE_SECRET;

/** Whether keys come from the environment (true) or the fixed public demo seed (false). */
export const KEY_SOURCE: "env" | "demo-fixed" =
  process.env.PROOF_ISSUER_SEED && /^[0-9a-fA-F]{64}$/.test(process.env.PROOF_ISSUER_SEED.trim()) ? "env" : "demo-fixed";

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
 * Pairwise pseudonymous subject: stable per (user, audience), uncorrelatable across audiences.
 * Deterministic from the pairwise secret, so it is stable across restarts too (FR-09, D-009).
 */
export function pairwiseSubject(userId: string, audience: string): string {
  return createHmac("sha256", pairwiseSecret).update(`${userId}|${audience}`).digest("base64url");
}
