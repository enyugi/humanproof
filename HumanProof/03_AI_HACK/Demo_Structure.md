# Demo Structure — under 3 minutes

## 0:00–0:20 Problem

18+ communityが氏名、生年月日、住所、ID photoを要求している状態を表示。

## 0:20–0:55 AI analysis

OrcaRouter経由で分析し、次を表示。

- Stated purpose: adult eligibility + human verification
- Minimum proof: over_18 + human_verified
- Potentially unnecessary for the stated purpose: 4 data items
- Assumptions / clarification if any

## 0:55–1:15 Before / After

`4 pieces of personal data → 2 proofs` を大きく表示。

## 1:15–1:45 Consent and issue

ユーザーが共有内容と非共有PIIを確認し、明示同意。短命Proofを発行。

## 1:45–2:15 Verify and revoke

署名、Issuer、audience、expiry、revocationを検証。失効後に `REVOKED`。

## 2:15–2:40 OrcaRouter audit

実model / latency / request ID / cost or dashboard reference、identity data sent to AI = 0 を表示。

## 2:40–3:00 Future and caveat

Agent authorizationへのFutureを一枚で示す。Demo Issuer、企業ニーズ未検証、AIは法務判断をしないことを明記。

