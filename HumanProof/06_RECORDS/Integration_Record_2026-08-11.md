# Integration Record — 2026-08-11

## User context

- AI HACK 2026へ非エンジニアのマーケター1名で参加
- 実装はClaude Code、企画・UX・ピッチ・事業検討はChatGPT等と進行
- Claude Codeは利用制限により一時停止中
- 再開後、断片的な追加指示ではなく差分を一度で渡したい

## User requests recorded

1. 既存の上位正本とClaude Code開発指示書を保持する
2. 元提案、Mistral、Sakana AIの良い点を統合する
3. 採用・保留・却下・未検証を明確に分ける
4. 企業ニーズが未検証であることを明記する
5. ChatGPTが今後定期的に参照しやすいフォルダ構成にする
6. Claude Codeへ後から一度で差分指示を渡せる状態にする
7. 正本と判断台帳だけでなく、検討記録も保存する
8. HumanProofへの回答3回に1回、現行正本とSource Mapを再確認する

## Sources recovered

- 旧上位正本: 1,285行
- 旧Claude Code初回マスター指示書: 1,787行
- 参照会話内のMistral共有回答: 原文保存
- 参照会話内のSakana AI共有回答: 原文保存
- ユーザーの「企業が本当に求めるかは別」という問題提起

## Integration decisions

### Retained from original proposal

- 必要な事実だけを証明する価値
- Trusted Issuerを根とするTrust Chain
- Demo Issuer、Consent、Signed Proof、Audience、Expiry、Revocation
- pairwise pseudonymous subject
- Zero identity data to LLM
- Human向けMVPからHuman + AI Trust LayerへつなぐVision

### Added from Mistral review

- Selective Disclosure自体を新規性としない
- HumanProofを信用の根ではなく中間レイヤーとして表現
- 単なるclaim selectorではなくpurpose/requested dataのギャップを分析
- 市場・競合・Beachheadの断定を避ける

### Added from Sakana AI review

- 単純ケースはルールベースで可能という限界を認める
- 曖昧さ、複数目的、前提、確認事項をAIの対象にする
- `Potentially unnecessary for the stated purpose` と限定して表示
- 規制・業界知識・侵害事例は将来候補に留める
- Zero PII、structured output、OrcaRouter observabilityを強調

### Added from user concern

- 「企業がそうすべき」と「企業がお金を払って欲しい」は別
- 企業ニーズ、支払意思、購買主体、導入KPIを未検証と明示
- Privacyそのものより、漏洩、コスト、離脱、不正、監査が購買理由になる仮説

## Artifacts produced

- Current master and decision ledger
- Product, research, AI HACK, development, future documents
- Claude Code v2 delta and handoff checklist
- Original source snapshots with checksums
- Raw Mistral and Sakana AI responses
- Market validation plan and open-question register

## Verification performed

- 旧正本2点と保存スナップショットのbyte-level同一性を確認
- SHA-256を保存
- 全Markdownの相対リンクを確認
- Code fenceの対応を確認
- ZIPの展開テストを確認

## Not performed

- HumanProof実装リポジトリの現状確認
- OrcaRouter実API接続確認
- 企業インタビュー
- 競合・法規制・市場規模の一次情報検証
- Claude Codeへの差分投入

これらは記録時点で未着手であり、「完了」と解釈しない。
