# 元提案から維持するもの

これは旧正本の要約。全文は `../99_REFERENCE/Original_Master_2026-08-11.md` を参照。

## Strong points retained

- 「あなたが誰か」を渡さず、必要な条件だけ証明する直感的な価値
- ログイン認証、本人確認、属性証明、権限管理の分離
- Trusted Issuer → User/HumanProof → VerifierのTrust Chain
- Demo Issuerと本番Issuerの明確な分離
- User Consent
- Signed Proof、audience、expiry、revocation
- pairwise pseudonymous subject
- Zero raw identity data to LLM
- OrcaRouter実接続、コスト・レイテンシ・監査ログ
- 小さなHuman向けMVPからHuman + AI Trust Layerへ伸ばすVision

## Updated after reviews

旧仕様の「AIが必要なProofを選ぶ」は狭すぎたため、「目的と現在の要求を比較し、最小Proofへの変更案を示す」へ更新した。

