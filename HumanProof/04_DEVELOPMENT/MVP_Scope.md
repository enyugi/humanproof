# MVP Scope

## Core path

1. Demo Human ID
2. Service purpose + currently requested data input
3. OrcaRouter AI analysis
4. Purpose / minimum proofs / potentially unnecessary items / caveats
5. Proof request
6. Explicit user consent
7. Signed, audience-bound, short-lived Proof
8. Verification
9. Revocation and re-verification
10. OrcaRouter audit

## Fixed claims

- `human_verified`
- `over_18`
- `unique_person`

## Required security properties

- Server-only OrcaRouter key
- Zero identity document / user attribute payload to LLM
- Requested dataはカテゴリ名だけを送り、入力中の実PII値は送信前にblockまたはmask
- Structured output validation
- Claim allowlist enforcement independent of LLM
- Prompt injection test
- Pairwise subject
- Signature, issuer, audience, expiry, revocation checks
- Actual-only audit metadata

## Out of scope

Real eKYC/JPKI, biometric checks, VC/DID full standards, regulation RAG, breach database, Avatar, AI Agent implementation, payment, mobile, production SSO.
