# Changelog

## 2026-08-11 — Proof系のセキュリティ強化を実装・記録

- D-029 を追記（consent receipt 束縛 / サーバ固定 TTL / 正当トークンのみ失効 / 厳格 payload 検証 / seed 決定論鍵）
- MASTER §11 に D-029 を同期
- 実装記録 `06_RECORDS/Implementation_Notes_2026-08-11.md` を追加（原因・設計・不採用理由・追加テスト・残存制約）

## 2026-08-11 — 要件定義（正本）を新設し、監査所見 #2/#3 を反映

- `04_DEVELOPMENT/Requirements.md` を新設（ID 付き FR/NFR + 受け入れ基準 + トレーサビリティ）。正本優先順位で MVP_Scope の次・Delta の前に挿入
- 優先順位を `README.md` と `06_RECORDS/README.md` に反映
- 所見 #2: `required_claims` / `optional_claims` の意味を Delta §4 に定義
- 所見 #3: `DECISIONS.md` に「読み方（append-only ID 順・Status 俯瞰は MASTER §11）」を追記し、MASTER §11 に D-027/D-028 を反映して同期
- 改変禁止ファイル（`99_REFERENCE/`, `06_RECORDS/*_Raw_Response_*`）は非改変

## 2026-08-11 — requested data の正規化・カウント規則を明確化

品質監査 (所見 #1) の反映。`id_photo` / `face_image` / `raw_identity_document` の写像とカウントの曖昧さを解消。

- 正規カテゴリ集合と「単一 emit・distinct カウント」規則を `ClaudeCode_Delta_Instructions.md` §2/§3/§4 に明記
- デモの "ID photo" は `id_photo` に正規化 (二重計上しない) と確定
- `HumanProof_MASTER.md` §4/§7 に件数の数え方の注記を追加
- 判断台帳へ D-028 を追記
- 改変禁止ファイル (`99_REFERENCE/`, `06_RECORDS/*_Raw_Response_*`) は非改変を SHA-256 で確認

## 2026-08-11 — 記録層を追加

- `06_RECORDS/` を追加
- Mistral / Sakana AIの共有原文を、未検証の判断材料として保存
- 統合作業の経緯、要求、採否への反映先、未解決事項を記録
- 正本・判断台帳・記録の役割と優先順位を明確化

## 2026-08-11 — v2.0 統合版

Mistral / Sakana AI壁打ちと、ユーザーの「企業が本当に求めるかは未確認」という指摘を反映。

主な変更:

- AIを単純なclaim selectorから、purposeとrequested dataのギャップ分析へ変更
- `unnecessary` の断定をやめ、記述された目的に対する候補表示へ変更
- 曖昧さ、前提、確認事項を構造化出力へ追加
- 企業ニーズ、支払意思、購買主体を明示的に未検証へ変更
- 規制知識、侵害事例、Adult beachheadを保留へ分類
- AI AgentはMVPから外したままFuture Visionとして維持
- Claude Codeへ一度で渡せる差分指示を追加
- 2026-08-11の旧正本と旧開発指示書を `99_REFERENCE/` に保存
