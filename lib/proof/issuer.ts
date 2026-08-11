// Demo Trusted Issuer — SIMULATED. Holds a real Ed25519 keypair, but performs NO real identity
// verification (FR-13, D-007). A Verifier trusts an Issuer by knowing its id + public key.
// HumanProof itself is not the root of trust (HumanProof_MASTER §6).
//
// The signing seed is a per-install SECRET: it comes from PROOF_ISSUER_SEED, else a random seed
// persisted to the local gitignored state file. It is NEVER hardcoded in source, so reading the
// repository does not reveal the key (Problem 1). It is stable across restarts (Problem 4/5).

import { createPrivateKey, createPublicKey, createHmac, type KeyObject } from "node:crypto";
import { getOrCreateSeedHex } from "./store";

export const DEMO_ISSUER_ID = "did:humanproof:demo-issuer";

// PKCS8 DER prefix for an Ed25519 private key; the 32-byte seed is appended to form the full DER.
const PKCS8_ED25519_PREFIX = Buffer.from("302e020100300506032b657004220420", "hex");

/** Derive a stable Ed25519 keypair from a 32-byte seed (exported for determinism tests). */
export function deriveKeypairFromSeed(seed: Buffer): { privateKey: KeyObject; publicKey: KeyObject } {
  if (seed.length !== 32) throw new Error("Ed25519 seed must be 32 bytes");
  const der = Buffer.concat([PKCS8_ED25519_PREFIX, seed]);
  const privateKey = createPrivateKey({ key: der, format: "der", type: "pkcs8" });
  const publicKey = createPublicKey(privateKey);
  return { privateKey, publicKey };
}

const { hex: seedHex, source } = getOrCreateSeedHex();

/** Where the signing key came from: env-provided, persisted per-install secret, or ephemeral. */
export const KEY_SOURCE: "env" | "persisted" | "ephemeral" = source;

const { privateKey, publicKey } = deriveKeypairFromSeed(Buffer.from(seedHex, "hex"));

// Pairwise secret: from env, else derived from the (secret) issuer seed — so it is also secret and
// stable, without a second stored value.
const pairwiseSecret =
  process.env.PROOF_PAIRWISE_SECRET?.trim() ||
  createHmac("sha256", Buffer.from(seedHex, "hex")).update("pairwise-subject").digest();

export function getIssuerPrivateKey(): KeyObject {
  return privateKey;
}

const REGISTRY: Record<string, KeyObject> = { [DEMO_ISSUER_ID]: publicKey };

export function getIssuerPublicKey(issuerId: string): KeyObject | null {
  return REGISTRY[issuerId] ?? null;
}

/**
 * Pairwise pseudonymous subject: stable per (user, audience), uncorrelatable across audiences,
 * and stable across restarts (FR-09, D-009).
 */
export function pairwiseSubject(userId: string, audience: string): string {
  return createHmac("sha256", pairwiseSecret).update(`${userId}|${audience}`).digest("base64url");
}
