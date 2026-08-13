# Judging Criteria Mapping

| Criterion | What to show | Caveat |
|---|---|---|
| 課題の実在性 | 免許証画像を年齢確認ごとに渡す不安 | 市場規模は未検証 |
| ビジネス成立性 | 漏洩、確認コスト、離脱、不正、監査の価値仮説 | 支払意思は未検証 |
| 完成度・デモ | IAMmeアカウント作成→模擬属性確認→ECでIAMmeを選択→2 Proofへの同意→署名・検証→購入完了→失効 | 元確認だけが模擬。`VALID → REVOKED`は実API |
| AI必然性 | `/studio`で非定型要件と現在要求のギャップ、複数目的、曖昧さを構造化 | 単純な18歳確認はルールで可能と認める。AIは導入時に使う |
| 技術的作り込み | schema validation、allowlist、pairwise subject、署名、audience、expiry、revocation | 過剰な標準実装はしない |
| LLMコスト | OrcaRouter実ログ・actual metadata | 偽のcostを出さない |
| セキュリティ | Zero PII to LLM、Consent、短命Proof、pairwise subject、失効、fail-closed | Demo Trusted Issuerの元確認は模擬と明示 |
| 次世代性 | 必要最小限のIdentityからAgent権限Proofへ | AgentはFutureのみ |
