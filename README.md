# HumanProof

> Turn identity requests into minimum proof.

AI HACK 2026 MVP. Compares a service's stated purpose with the personal data it currently
requests, and recommends the minimum proof. This repository contains both the **spec** and the **app**.

- **Spec (正本):** [`HumanProof/`](HumanProof/) — start at [`HumanProof/README.md`](HumanProof/README.md).
  Requirements: [`HumanProof/04_DEVELOPMENT/Requirements.md`](HumanProof/04_DEVELOPMENT/Requirements.md).
- **App:** Next.js (App Router, TypeScript). Implemented:
  1. **AI analysis slice** — input → analysis → recommendation, with the PII shield, structured-output
     validation, and server-side policy enforcement.
  2. **Proof lifecycle** — review → signed **quote** (server confirms the set) → **explicit consent** →
     Signed Proof (Ed25519, audience-bound, server-fixed short TTL, pairwise subject) → verify
     (signature/issuer/audience/expiry/revocation, strict bounded payload) → revoke (by the holder's
     secret code) → re-verify shows `REVOKED`.

### Proof security model & demo constraints (honest framing)

- **Custom token format** — a compact `base64url(json).base64url(sig)` token, **not** JWT/JWS/VC or any standard.
- **Demo Trusted Issuer is simulated** — it holds a real Ed25519 keypair but performs no real identity verification.
- **Signing key is a per-install secret** — from `PROOF_ISSUER_SEED`, else a **random** seed generated on first run and
  persisted to a gitignored local state file (`.humanproof/`, mode `0600`). It is **never hardcoded in source**, so reading
  the repo does not reveal it; it is stable across restarts. An invalid `PROOF_ISSUER_SEED` is rejected (no silent fallback). Not an HSM.
- **Quote ≠ consent** — the quote proves the *server confirmed a selection*; issuance additionally requires an *explicit
  consent act*. A proof can never differ in audience/claims from the reviewed quote. **Quotes are single-use.**
- **Server-owned TTL** — clients cannot set the lifetime; proofs are always short-lived (≤ policy), enforced at issue and verify.
- **Strict, bounded verification** — even with a valid signature, verification rejects unknown issuers, wrong `typ`,
  allowlist-violating/empty/duplicate claims, over-long fields, oversized tokens, inverted/over-long lifetimes, and future `iat`.
- **Revocation authority** — a secret **revocation code** returned only to the holder at issue; the proof token does not
  contain it, so a Verifier merely shown the proof **cannot** revoke it.
- **Fail-closed persistence** — the state file (secret seed + revocation) uses atomic writes (temp + fsync + rename, `0600`)
  and is validated on load (shape, size cap). If it cannot be read/written or is corrupt, the store is **unavailable** and
  the system fails closed. Response shapes are consistent:
  - **issue / revoke** (mutating) → HTTP **`503`** (no false success);
  - **verify** (read) → HTTP `200` with structured **`REVOCATION_UNAVAILABLE`** (never `VALID`), and it never surfaces an
    unhandled exception even with no env seed + a corrupt file.

  Revocation is persisted, so a revoked in-TTL proof stays `REVOKED` across a real process restart.
  `PROOF_PERSIST=off` is an explicit ephemeral (in-memory) mode. Local single-process store — not a durable/replicated DB.
- **Safe upgrade of an existing state file** — a legacy file (`{seedHex,revoked,revAuth}`, mode `0644`, no `v`/`usedQuotes`)
  is **migrated in place** on load to the current format with `0600` perms, preserving the issuer seed and all in-TTL
  revocations / revocation authority. Migration uses the same atomic write, so a mid-write failure leaves the old file
  intact and fails closed — the state file is never deleted to "recover".

## Run

```bash
npm install
npm run dev        # http://localhost:3000
```

Open the page, keep the prefilled 18+ demo, and click **Analyze** → `4 pieces of personal data → 2 proofs`.

## OrcaRouter (LLM gateway)

Without a key the app uses a **MOCK** provider — a deterministic rule-based analyzer, clearly
labelled `MOCK` in the UI (before analysis) and in the audit panel; it never presents fabricated
"actual" metadata. To use the real gateway, copy `.env.local.example` to `.env.local` and set
`ORCAROUTER_API_KEY`. OrcaRouter exposes an **OpenAI-compatible** chat completions API at
`https://api.orcarouter.ai/v1` (default model `orcarouter/auto`). The key is server-side only;
the same validation + policy pipeline applies unchanged.

## Quality gates

```bash
npm run typecheck   # tsc --noEmit
npm test            # vitest (Delta §7 tests A–F + units)
npm run lint        # eslint (next)
npm run build       # next build
```

## What is enforced (see Requirements.md)

- **Zero PII to LLM** — if real values are detected in the purpose text the request is **blocked** (not sent) so the user can remove them; only the PII-shield-passed service-purpose text and canonical category names are sent (FR-02, NFR-01/02). The heuristic shield detects, it does not guarantee absence.
- **Deterministic counting** — requested data is normalized + de-duplicated; `N pieces` is the distinct count (FR-04, D-028).
- **Server-side policy** — claims restricted to the fixed allowlist, required/optional disjoint, flags limited to detected items, prohibited determinations neutralized (FR-05/07/14).
- **Actual-only audit** — no fabricated model/cost/logs; MOCK is labelled as MOCK (FR-12, NFR-07).
- **Signed Proof** — real Ed25519 signatures from a simulated Demo Trusted Issuer; audience-bound,
  short-lived, pairwise pseudonymous subject; consent-gated; revocable (FR-08/09/10/11/13, D-008/09).
