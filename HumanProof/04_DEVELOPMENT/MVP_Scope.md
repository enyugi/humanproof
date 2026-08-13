# MVP Scope

## Core path

### 利用者向けGuided Demo（`/demo`）

1. IAMmeデモアカウント作成
2. Demo Trusted Issuerによる属性元確認（元確認のみ模擬）
3. NIGHT SCREENでIAMmeを選択
4. 保存済みPolicyに基づく2 Proofの共有確認
5. Explicit user consent
6. Signed, audience-bound, short-lived Proof
7. NIGHT SCREENで検証し購入完了（`VALID`）
8. Revocation and re-verification（`REVOKED`）

### サービス導入者向けAI Policy Studio（`/studio`）

1. Service purpose + currently requested data input
2. OrcaRouter AI analysis
3. Purpose / minimum proofs / potentially unnecessary items / caveats
4. OrcaRouter actual-only audit

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
