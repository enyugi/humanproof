# Implementation Notes — Proof system (2026-08-11)

**Status:** 実装記録（証跡）。正本は上書きしない。優先順位は README/RECORDS の Authority に従う。
**Scope:** AI HACK MVP のアプリ実装（リポジトリ直下 Next.js）。仕様 [`../04_DEVELOPMENT/Requirements.md`](../04_DEVELOPMENT/Requirements.md)、判断 [`../00_MASTER/DECISIONS.md`](../00_MASTER/DECISIONS.md) D-029。
**Revision:** セキュリティレビュー2回目の確定設計を反映（初版の consent receipt / token 失効 / 固定公開 seed を差し替え）。

## 信頼境界（誰が何をできるか）

- **発行 (Issue)**: Demo Issuer（サーバ）のみが署名。発行には ①署名付き quote（サーバが確認した aud/claims）と ②明示 consent の両方が必要。
- **同意 (Consent)**: ユーザーの明示的行為。quote に束縛され、quote と異なる aud/claims では発行不可。
- **失効 (Revoke)**: 発行時に保有者へ返す秘密 **revocation code** を持つ者のみ。Proof を提示されただけの Verifier は code を持たないため失効不可。
- **検証 (Verify)**: 誰でも公開鍵で検証可能。署名・Issuer・audience・expiry・revocation を独立判定。

## 発見した根本原因と対処（2次レビュー）

| # | 根本原因 | 対処 |
|---|---|---|
| 1 | 固定公開 seed がソースにあり第三者が正規署名を偽造可能 | 署名 seed を **per-install ランダム生成 + ローカル永続**（`.humanproof/`、gitignored）。env `PROOF_ISSUER_SEED` 優先。ソース非搭載 |
| 2 | consent receipt が同意前に発行され、issue が明示同意なしで発行 | 「サーバ確認 = **quote**」と「ユーザー明示 **consent**」を分離。issue は quote + `consent:true` の二要件（片方欠落で 422） |
| 3 | Proof トークン所持を失効権限にしていた（Verifier が失効可能） | 失効は発行時に保有者へ返す秘密 **revocation code**（token に含めない）でのみ。任意 id/token は拒否 |
| 4 | 鍵は永続だが失効はメモリのみ→再起動で失効済みが VALID 復活 | 失効状態を seed と同じローカルストアに **永続**。再起動（reload）後も REVOKED を維持 |
| 5 | 厳格 schema と称しつつ上限長/空・重複 claim/未来 iat 等が無制限 | token 全体長・iss/sub/aud/jti 上限長・claim 1..N・重複禁止・未来 iat・TTL 上限を検証で強制（署名後） |
| 6 | D-029 が未レビュー方式を正本へ「採用」記載 | 最終設計で D-029・本記録・MASTER §11・README を同期（本改訂） |

## 採らなかった案と理由

- 標準 VC/DID/JWT 準拠 / HSM / 失効の DB・Redis 永続: MVP スコープ外（`MASTER §9`）。ローカル単一プロセスのデモに対し過剰。
- 失効を「発行者の署名 challenge」に限定: デモ UX 過剰。保有者秘密 code で十分。
- ephemeral ランダム鍵（毎起動変更）: 再起動で既存 Proof が検証不能になり不安定。永続ランダム seed を採用。

## 再起動前後の Proof / 失効状態

- **鍵**: seed 永続のため不変 → 既存 Proof は再起動後も署名検証成功。
- **失効**: 永続のため再起動後も維持 → 失効済み・期限内 Proof は再起動しても `REVOKED`（VALID 復活しない）。
- **pairwise subject**: seed 由来で安定（同一 user・aud で不変、異 aud で相異）。

## 追加した攻撃・失敗テスト

`tests/proofSecurity.test.ts`（16）: 旧公開 seed からの偽造→BAD_SIGNATURE、quote 改ざん/型取り違え、明示 consent 欠如→422（route）、quote と一致した発行、TTL clamp・過大 TTL 検証拒否、token 失効/任意 id 失効の拒否と code 失効の成立、未来 iat・重複 claim・空 claim・過大 audience・巨大 token・allowlist 外 claim の拒否、seed 決定論。
`tests/proofPersistence.test.ts`（1）: 失効後の擬似再起動で REVOKED 維持。
`tests/proof.test.ts`（9）: lifecycle G。全体 **59 green**。

## ローカル/デプロイで残る Demo 制約

- ローカル**単一プロセス**の JSON ファイル永続（`npm run dev`/`start`・localhost が現行の提出方法）。durable/replicated ではない。
- 既定は env seed 無しで**ランダム自動生成 seed をローカル永続**（秘匿は OS のファイル権限に依存）。マルチプロセス/デプロイでは env seed 注入を推奨。
- Demo Issuer は本人確認をしない（模擬）。独自トークン形式は標準非準拠。
- 失効は「所持 = 権限（revocation code）」モデル。人間性や発行者権限の厳密な PKI ではない。
