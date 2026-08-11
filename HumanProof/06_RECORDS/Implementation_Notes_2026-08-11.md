# Implementation Notes — Proof system (2026-08-11)

**Status:** 実装記録（証跡）。正本は上書きしない。優先順位は README/RECORDS の Authority に従う。
**Scope:** AI HACK MVP のアプリ実装（リポジトリ直下 Next.js）。仕様は [`../04_DEVELOPMENT/Requirements.md`](../04_DEVELOPMENT/Requirements.md)、判断は [`../00_MASTER/DECISIONS.md`](../00_MASTER/DECISIONS.md) D-029。

## セキュリティレビューで発見した原因と対処

| # | 原因 | 対処 |
|---|---|---|
| 1 | 同意後に audience/Claim を変更でき、同意内容と発行 Proof が乖離しうる | 署名付き **consent receipt**（`typ:"consent"`, 短命）を発行し、Proof 発行は receipt の aud/claims のみを信頼。UI も receipt（サーバ確定値）を表示し、選択変更で receipt を無効化 |
| 2 | TTL を外部入力で不適切に変更できる | TTL はサーバ方針（`POLICY_TTL`=300s, `MAX_TTL`=300s）で固定。発行時に clamp、検証時に `exp-iat<=MAX_TTL` を強制 |
| 3 | 失効 API が任意識別子を受理（他者 Proof 失効・メモリ肥大） | 失効は **正当な Proof トークン**（署名+Issuer 検証）からのみ jti を抽出。失効ストアは exp で prune + 件数上限で有界化 |
| 4 | 署名が正しくても payload/Claim/期限の不正を拒否できない | 署名検証後に zod で厳格検証（`typ`/allowlist claim/`exp>iat`/TTL 上限/strict・余剰キー禁止）。不正は `MALFORMED` |
| 5 | 鍵・pairwise secret・失効状態がプロセス内のみで検証が不安定 | 鍵と pairwise secret を **seed から決定論導出**（env `PROOF_ISSUER_SEED`/`PROOF_PAIRWISE_SECRET`、無ければ固定公開デモ seed）。再起動/別プロセスでも検証・subject が安定 |
| 6 | 独自形式・Demo Issuer・プロセス内状態の制約が説明と不一致 | README「Proof security model & demo constraints」/ UI で、独自形式・模擬 Issuer・デモ seed・in-process 失効を明示 |

## 採用した設計と理由

- **consent receipt 束縛**: 発行の権威をサーバに置き、クライアント入力（aud/claims/TTL）を受け付けない最小構成。既存 Ed25519 署名を再利用（新規依存なし）。
- **サーバ固定 TTL**: 短命性の不変条件をコードで担保。発行と検証の二重防御。
- **失効=正当トークン提示**: デモ範囲で「所持=権限」。任意 id を排除し、有界メモリと両立。
- **seed 決定論鍵**: 単一プロセスのローカルデモ（`npm run dev`/`start`）でも再起動をまたいで安定。運用秘匿は env seed で後付け可能。

## 採らなかった案と理由

- 標準 VC/DID/JWT 準拠: MVP スコープ外（`MASTER §9`）。独自最小形式で不変条件を満たす方を優先。
- 失効の永続化（DB/ファイル/Redis）: 単一プロセスのローカルデモには過剰。短命 TTL で実害を限定し、制約として明示。
- 失効を「発行者権限（署名 challenge）」に限定: デモの UX を複雑化。所持ベースで十分と判断。

## 追加した攻撃・失敗テスト（`tests/proofSecurity.test.ts` ほか）

同意後改変（receipt 改ざん/期限切れ/型取り違え）、不正 TTL（過大/非正の clamp・検証拒否）、無関係な失効要求（任意 id/非 Proof/receipt を拒否）、malformed payload（allowlist 外 claim・`exp<=iat`・欠落/余剰キー）、tampered signature / unknown issuer / wrong audience / expired / revoked、pairwise（同一 aud 安定・異 aud 相異）、seed 決定論（同 seed→同公開鍵）。全体 58 テスト green。

## ローカル/デプロイで残る制約

- **失効状態はプロセス内のみ**（再起動でリセット）。短命 TTL で緩和。永続化は本番フェーズ。
- デプロイ構成なし（`npm run dev`/`start` の単一プロセス・localhost が現行の提出方法）。
- 既定は**公開デモ seed**。秘匿が要る環境では env seed 必須。
- Demo Issuer は本人確認をしない（模擬）。独自トークン形式は標準非準拠。
