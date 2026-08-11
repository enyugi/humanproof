# HumanProof

> Turn identity requests into minimum proof.

AI HACK 2026 MVP. Compares a service's stated purpose with the personal data it currently
requests, and recommends the minimum proof. This repository contains both the **spec** and the **app**.

- **Spec (正本):** [`HumanProof/`](HumanProof/) — start at [`HumanProof/README.md`](HumanProof/README.md).
  Requirements: [`HumanProof/04_DEVELOPMENT/Requirements.md`](HumanProof/04_DEVELOPMENT/Requirements.md).
- **App:** Next.js (App Router, TypeScript). Current increment: the **AI analysis slice**
  (input → analysis → recommendation), with the PII shield, structured-output validation, and
  server-side policy enforcement. Proof issuance / consent / verify / revoke are the next increment.

## Run

```bash
npm install
npm run dev        # http://localhost:3000
```

Open the page, keep the prefilled 18+ demo, and click **Analyze** → `4 pieces of personal data → 2 proofs`.

## OrcaRouter (LLM gateway)

Without a key the app uses a **MOCK** provider — a deterministic rule-based analyzer, clearly
labelled `MOCK` in the audit panel (it never presents fabricated "actual" metadata). To use the
real gateway, copy `.env.local.example` to `.env.local` and set `ORCAROUTER_API_KEY` (OpenRouter-
compatible). The key is server-side only; the same validation + policy pipeline applies unchanged.

## Quality gates

```bash
npm run typecheck   # tsc --noEmit
npm test            # vitest (Delta §7 tests A–F + units)
npm run lint        # eslint (next)
npm run build       # next build
```

## What is enforced (see Requirements.md)

- **Zero PII to LLM** — real values are masked before egress; only category names are sent (FR-02, NFR-01/02).
- **Deterministic counting** — requested data is normalized + de-duplicated; `N pieces` is the distinct count (FR-04, D-028).
- **Server-side policy** — claims restricted to the fixed allowlist, required/optional disjoint, flags limited to detected items, prohibited determinations neutralized (FR-05/07/14).
- **Actual-only audit** — no fabricated model/cost/logs; MOCK is labelled as MOCK (FR-12, NFR-07).
