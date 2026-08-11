# Changelog

## 2026-08-11 — Analyze 上流 timeout/deadline + 実 OrcaRouter 疎通実測（D-030）

- 上流呼び出しに有限 timeout(12s)/全体 deadline(20s)/client 切断伝播を実装（504/502/499 分類）
- 実接続を 1 回だけ確認: 到達・処理・課金するが平均遅延 ~55s で deadline 超過 → 504。abort しても上流は完走・課金（実測 直近30日 req3/10.4K tok/$0.0138）
- D-030・実装記録を追記。README にライブデモは既定 MOCK 明示・実接続は latency 証跡の運用注記を追加
- Zero-PII 維持（送信はプロンプト+カテゴリ名のみ、実 PII なし）

## 2026-08-11 — Proof系 既存状態の安全な移行（4次レビュー・D-029 green確定）

- 旧形式 (`{seedHex,revoked,revAuth}`・0644) の状態ファイルを、seed・期限内失効を保持したまま現行形式 (0600) へ in-place atomic 移行
- 移行の途中失敗で旧ファイルを壊さず fail-closed（単純削除で回復しない）
- 応答形状を統一: 変更系(発行/失効)=503、参照系(検証)=200+構造化 REVOCATION_UNAVAILABLE。seed なし＋破損でも検証 route は未処理例外を出さない
- テスト追加 `proofMigration.test.ts`(4)。全体 68 green + 実デフォルト状態ディレクトリの複製で移行検証
- D-029・MASTER §11・README・実装記録を最終設計へ同期

## 2026-08-11 — Proof系 セキュリティ3次レビュー対応（永続 fail-closed・D-029 green確定）

- 永続の信頼境界を fail-closed 化（保存失敗の握り潰し=fail-open を修正）: 状態が読書不能/破損/容量超なら発行・失効は 503、検証は REVOCATION_UNAVAILABLE
- quote を単回使用に確定、鍵は遅延初期化＋不正 seed 拒否、状態ファイルは atomic write(0600)
- D-029・MASTER §11・README・実装記録を最終設計へ同期（green 後）
- テスト追加: `proofStore.test.ts`(4) fail-closed / `proofPersistence.test.ts` 実再起動境界。全体 64 green + 実プロセス kill+restart の runtime 検証

## 2026-08-11 — Proof系 セキュリティ2次レビュー対応（D-029 確定）

- D-029 を最終設計へ改訂（per-install 秘密鍵永続 / quote+明示consent 分離 / 保有者秘密codeでの失効・永続 / 厳格bounded検証）
- MASTER §11・README・`.env.local.example` を同期
- 実装記録 `06_RECORDS/Implementation_Notes_2026-08-11.md` を確定設計に改訂
- 攻撃/失敗テストを追加（`tests/proofSecurity.test.ts` 16 / `tests/proofPersistence.test.ts` 1）。全体 59 green

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
