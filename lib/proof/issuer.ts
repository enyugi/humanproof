// Demo Trusted Issuer — SIMULATED. Holds a real Ed25519 keypair, but performs NO real identity
// verification (FR-13, D-007). A Verifier trusts an Issuer by knowing its id + public key.
// HumanProof itself is not the root of trust (HumanProof_MASTER §6).
//
// The signing seed is a per-install SECRET: from PROOF_ISSUER_SEED, else a random seed persisted to
// the local gitignored state file. NEVER hardcoded in source (Problem 1), stable across restarts
// (Problem 4/5). Initialization is LAZY (on first use) so importing a route does not require a
// working key store — `next build` route collection must not fail, and failures surface at request
// time as fail-closed responses rather than crashing at import.

import { createPrivateKey, createPublicKey, createHmac, type KeyObject } from "node:crypto";
import { getSeed } from "./store";

export const DEMO_ISSUER_ID = "did:humanproof:demo-issuer";

const PKCS8_ED25519_PREFIX = Buffer.from("302e020100300506032b657004220420", "hex");

/** Derive a stable Ed25519 keypair from a 32-byte seed (exported for determinism tests). */
export function deriveKeypairFromSeed(seed: Buffer): { privateKey: KeyObject; publicKey: KeyObject } {
  if (seed.length !== 32) throw new Error("Ed25519 seed must be 32 bytes");
  const der = Buffer.concat([PKCS8_ED25519_PREFIX, seed]);
  const privateKey = createPrivateKey({ key: der, format: "der", type: "pkcs8" });
  const publicKey = createPublicKey(privateKey);
  return { privateKey, publicKey };
}

interface Material {
  privateKey: KeyObject;
  publicKey: KeyObject;
  pairwiseSecret: Buffer | string;
  source: "env" | "persisted" | "ephemeral";
}
let material: Material | null = null;

// Lazily initialize keys. May throw (invalid seed, or unavailable store with no env seed) — by
// design, callers that need signing/verification then fail rather than proceeding insecurely.
function init(): Material {
  if (material) return material;
  const { hex, source } = getSeed();
  const { privateKey, publicKey } = deriveKeypairFromSeed(Buffer.from(hex, "hex"));
  const pairwiseSecret =
    process.env.PROOF_PAIRWISE_SECRET?.trim() || createHmac("sha256", Buffer.from(hex, "hex")).update("pairwise-subject").digest();
  material = { privateKey, publicKey, pairwiseSecret, source };
  return material;
}

export function keySource(): "env" | "persisted" | "ephemeral" {
  return init().source;
}

export function getIssuerPrivateKey(): KeyObject {
  return init().privateKey;
}

export function getIssuerPublicKey(issuerId: string): KeyObject | null {
  if (issuerId !== DEMO_ISSUER_ID) return null;
  return init().publicKey;
}

/**
 * Pairwise pseudonymous subject: stable per (user, audience), uncorrelatable across audiences,
 * and stable across restarts (FR-09, D-009).
 */
export function pairwiseSubject(userId: string, audience: string): string {
  return createHmac("sha256", init().pairwiseSecret).update(`${userId}|${audience}`).digest("base64url");
}
