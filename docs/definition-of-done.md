# Definition of Done — HumanProof (AI HACK 2026 MVP)

**目的**: 「完成」を外部 doc に固定し、churn (何度コミットしても終点に着かない) を防ぐ。以下は正本 `HumanProof/` から**再構成** (発明でない)。各条件は 🔴→🟡→✅ に動かす形で駆動し、条件に紐づかない場当たり修正はモグラ叩きとして弾く。

- **出典**: `HumanProof/04_DEVELOPMENT/Requirements.md` (FR-01..14 / NFR-01..08 / §5 受け入れ基準) / `HumanProof/00_MASTER/HumanProof_MASTER.md` (§7 一本道・§8 不変条件) / `DECISIONS.md` (D-001..D-031) / AI HACK 2026 提出要件 (Day1 資料)。
- **凡例**: ✅ 満たす / 🟡 条件付き・要確認 / 🔴 未達。
- **基準時点**: 2026-08-13 (branch `feat/orca-demo-latency`)。

## 完成条件

| ID | 完成条件 | 検証手段 | 根拠 | 状態 |
|---|---|---|---|---|
| D1 | purpose + currently requested data を入力でき、**実 OrcaRouter で**一本道が動く (Analyze→4→2→quote→consent→issue→VALID→revoke→REVOKED) | 実 Orca で `/api/analyze` が 200・4→2 を返すことを実測 (済) + UI 一本道の目視 | MASTER §7 / FR-01 | 🟡 API 実測済 (4→2)。**UI 全一本道の目視 (quote〜REVOKED) は未実施** |
| D2 | 表現規律: `Potentially unnecessary for the stated purpose` を使い禁止表現 (Unnecessary/Excessive/Illegal/Compliant) を出さない | server-side policy (`lib/policy.ts`) + テスト | FR-05 / Delta §3 | ✅ policy で担保 |
| D3 | 「N pieces → M proofs」を実データの distinct 件数で計算 (代表デモ 4→2) | 実 Orca で data_count=4 / proof_count=2 を実測 (済) | FR-04/06 / D-028 | ✅ 実 Orca で 4→2 確認 |
| D4 | Zero PII to LLM (block-on-detection・カテゴリ名のみ・audit で実測提示) | egress スキャン=0 を audit で実測 (済) | NFR-01/02 / D-027 | ✅ zero_pii egress=0 実測 |
| D5 | Prompt injection 拒否・server-side allowlist enforcement | `lib/policy.ts` + テスト (シナリオ D) | FR-14/07 | ✅ |
| D6 | Consent→Signed Proof(audience/expiry/pairwise)→Verify→Revocation→REVOKED | proof テスト群 (凍結 `758b7ca`) | FR-08..11 / D-029 | ✅ (凍結・再設計しない) |
| D7 | 実 OrcaRouter を**ライブ経路**に載せ actual-only audit (偽ログなし) | 実 Orca ライブ (非中国系 gpt-4o-mini・中央値~7s) で VALID + 実 request_id/model/latency を実測 (済) | FR-12 / NFR-07 / **D-031** | ✅ **本セッションで解決** (D-030 の「MOCK明示のみ」を supersede) |
| D8 | typecheck / test / lint / build が green | `npm run typecheck && npx vitest run && npm run lint && npm run build` | 品質ゲート | ✅ typecheck ok・**83 tests**・lint 0・build ok (2026-08-13) |
| D9 | **審査提出物**: ①GitHub public リポ ②デモ動画 (3分以内・YouTube 限定公開) ③Qiita/Zenn 記事 (OrcaRouter と AI HACK に言及) | 提出物の存在 + Google フォーム提出 | AI HACK 2026 提出要件 (Day1) | 🔴 **②動画・③記事 未作成**。締切 **8/15 15:00 (遅延=対象外)**。別セッションで制作 |
| D10 | 正本・判断台帳・実装記録・README が実装と同期 | doc 差分レビュー | 運用規律 | 🟡 D-031 反映済・demo 入力同期済。README/実装記録の D-031 追記は要確認 |

## 非目標 (スコープを閉じる)

- Proof セキュリティ設計の再設計 (`758b7ca` 凍結)。
- `orcarouter/auto` 自動ルーティングの本番採用 (no-Chinese 担保のため非中国系モデルを明示固定する)。
- ストリーミング UI / 非同期ジョブ+ポーリング / 事前取得リプレイ (実 latency 中央値~7s でライブ成立のため不要)。
- 中国系モデル (qwen/deepseek/kimi/minimax/tencent/z-ai) の使用 (ユーザー恒久ルール)。
- 企業の支払意思・購買主体の検証、「世界初/競合不在」の主張 (誠実な留保・D-021/023)。

## 審査基準との対応 (AI HACK 2026・8項目×5=40点)

- ⑥ LLMコスト = 実測原価提示 + 削減施策: audit が実 request_id/model/latency を actual-only 提示 (偽ログ禁止 D-011)。cost 未返却時は `See OrcaRouter request log` にフォールバック。**削減施策**=高品質 auto (~55s・高コスト) でなく非中国系の高速・低コストモデル固定。
- ⑦ セキュリティ = 機密を預けられる設計: Zero-PII (block-on-detection・egress=カテゴリ名のみ)・Consent・短命 Proof・pairwise・Demo Issuer 明示。OrcaRouter 内蔵 PII Shield とも整合。
- ③ 完成度・デモ / ④ AI必然性: 非定型文からの構造化・最小 proof 推薦 (実 Orca ライブ)。

## 検証コマンド

```bash
npm run typecheck && npx vitest run && npm run lint && npm run build
```

実 Orca ライブ検証 (課金・都度承認・¥3,000 クレジット内): 作業ブランチで `PORT=xxxx npm start` (実 key で実 provider) → 代表入力を `/api/analyze` に POST → `audit.source=ORCAROUTER`・`data_count=4`・`proof_count=2`・`zero_pii.detected...=0` を確認。

## 残タスク (🔴/🟡 を動かす)

1. **D9 (🔴・最重要・締切 8/15)**: デモ動画 (3分) + Qiita/Zenn 記事 + リポ public 化・提出。→ **別セッション** (本 DoD を終点として参照)。
2. **D1 (🟡)**: UI 一本道 (quote→consent→issue→VALID→revoke→REVOKED) の目視/録画確認。
3. **D10 (🟡)**: README・実装記録に D-031 を追記。
