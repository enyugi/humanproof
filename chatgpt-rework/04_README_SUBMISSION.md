# HumanProof

本人情報の要求を、必要最小限の証明に。

HumanProofは、サービスが要求する本人情報を、その目的に必要な署名付き証明へ変換するTrust LayerのPoCです。本人確認AIやeKYCの代替そのものではありません。

## Demo

架空の18歳以上向け動画サービス `NIGHT SCREEN` への登録を体験できます。

1. 通常の身分証提出とHumanProofを比較する
2. `HumanProofを使う` を選ぶ
3. 共有する2証明と、渡さない5項目を確認する
4. 明示同意する
5. Demo Trusted Issuerが期限付き署名証明を発行する
6. NIGHT SCREENが検証し、登録が完了する
7. Demo Issuerが失効し、再検証が `REVOKED` になることを確認する

共有する証明:

- `over_18`
- `human_verified`

NIGHT SCREENへ渡さない項目:

- 氏名
- 正確な生年月日
- 住所
- 顔写真
- 身分証画像

> 証明も個人に関する属性です。HumanProofは匿名化や「個人情報ゼロ」を主張しません。目的に必要な範囲へ開示を絞ります。

## Why AI

定型の18歳確認だけならルールで実装できます。

HumanProofがAIを使うのは、利用者の登録時ではなく、サービス導入時のPolicy設計です。複数の目的、曖昧な規約文、現在の過剰取得を読み、許可済みClaim Catalogへ制約された最小証明Policyの案へ変換します。

- 利用者の生の本人情報や本人確認書類をAIへ送らない
- PII値を検出した入力はAI送信前にブロックする
- AI出力は許可済みClaim以外を採用しない
- 目的が足りない場合はClaimを確定せずclarificationへ戻す
- Policyを保存し、利用者ごとの登録時にLLMを毎回呼ばない

分析はOrcaRouter経由で実行し、provider / model / latency / request IDを監査情報として記録します。

## Architecture

```text
Service requirement (no user identity values)
        ↓
PII Shield / category normalization
        ↓
OrcaRouter → LLM
        ↓
Allow-listed Claim Policy proposal
        ↓
Human / rule validation and saved Policy

Saved Proof Request
        ↓
User consent
        ↓
Demo Trusted Issuer → signed short-lived proof
        ↓
Service verification
  signature / issuer / audience / expiry / revocation
```

## Implemented in this PoC

- Service requirement analysis through OrcaRouter
- PII-value blocking before AI egress
- Claim Catalog constraint
- Explicit consent
- Signed, short-lived proof
- Pairwise subject per audience
- Verification of signature, issuer, audience, expiry and revocation
- Revocation and re-verification
- Fail-closed verification

## Simulated

- Demo Trusted Issuer
- NIGHT SCREEN
- Source verification for `over_18` and `human_verified`

No real eKYC, JPKI, OCR, face recognition or liveness check is connected.

## Future / not implemented

- Multiple production Trusted Issuers
- Real eKYC / JPKI connection
- Verified Creator / Organization / Worker / Avatar
- Human and AI Agent authorization Trust Layer
- Full DID / Verifiable Credentials compliance

## Revocation semantics

Consent withdrawal and credential revocation are different.

- Consent withdrawal: the holder stops future re-presentation through HumanProof
- Credential revocation: the Issuer invalidates an issued credential; services reject it on verification

The demo uses the second path when showing `REVOKED`.

## What this does not claim

- It does not eliminate all personal data
- It does not make users anonymous
- It does not make legal or compliance decisions
- It does not prove that AI is necessary for every fixed policy
- It does not connect to production identity verification
- It does not eliminate risk; it aims to reduce over-collection and the resulting management risk

## AI HACK 2026

Built as a working Web Prototype. The public experience is a Guided Integration Demo: one person can start from a service registration screen and reach a meaningful service outcome without switching roles.

