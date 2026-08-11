// In-memory revocation store (demo constraint: resets on process restart; mitigated by short TTL).
// Entries are keyed by jti and carry the proof's exp so expired entries can be pruned — this bounds
// memory and prevents unbounded growth from repeated revocations (Problem 3/5).
// Source: Requirements FR-11.

const MAX_ENTRIES = 10_000; // hard cap: refuse to grow unbounded
const revoked = new Map<string, number>(); // jti -> exp (unix seconds)

function prune(nowSec: number): void {
  for (const [jti, exp] of revoked) {
    if (exp <= nowSec) revoked.delete(jti);
  }
}

/**
 * Revoke a jti until its proof would have expired anyway. Only call with a jti extracted from an
 * AUTHENTIC proof (see authenticProofRef) — the API layer enforces that. Returns false if the cap
 * is hit (caller should surface an error rather than grow memory without bound).
 */
export function revoke(jti: string, exp: number, nowMs = Date.now()): boolean {
  const nowSec = Math.floor(nowMs / 1000);
  prune(nowSec);
  if (exp <= nowSec) return true; // already expired -> no need to store, treat as success (harmless)
  if (!revoked.has(jti) && revoked.size >= MAX_ENTRIES) return false;
  revoked.set(jti, exp);
  return true;
}

export function isRevoked(jti: string, nowMs = Date.now()): boolean {
  prune(Math.floor(nowMs / 1000));
  return revoked.has(jti);
}

export function _size(): number {
  return revoked.size;
}
export function _clearRevocations(): void {
  revoked.clear();
}
