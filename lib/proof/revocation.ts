// In-memory revocation store (demo). A production system would use a durable, replicated store.
// Source: Requirements FR-11.
const revoked = new Set<string>();

export function revoke(jti: string): void {
  revoked.add(jti);
}

export function isRevoked(jti: string): boolean {
  return revoked.has(jti);
}

// test helper
export function _clearRevocations(): void {
  revoked.clear();
}
