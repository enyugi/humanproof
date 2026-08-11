# HumanProof 要件定義（正本）

**Version:** 1.0
**Updated:** 2026-08-11
**Status:** AI HACK 2026 MVP の実装契約。企業ニーズ・市場性は未検証。
**Authority:** 正本優先順位で `MVP_Scope.md` の次、`ClaudeCode_Delta_Instructions.md` の前。矛盾時は [`../00_MASTER/HumanProof_MASTER.md`](../00_MASTER/HumanProof_MASTER.md) → [`../00_MASTER/DECISIONS.md`](../00_MASTER/DECISIONS.md) → [`MVP_Scope.md`](MVP_Scope.md) → 本書 → [`ClaudeCode_Delta_Instructions.md`](ClaudeCode_Delta_Instructions.md) の順。

## 0. 目的と非重複の原則

本書は「何を作るか」を **ID 付き・検証可能** な要件へ構造化した唯一の実装契約。散在していた要件（MASTER の散文、`MVP_Scope` の箇条書き、`ClaudeCode_Delta_Instructions` のテスト A–G、`Handoff_Checklist` の受け入れ）を **参照でまとめ、再記述しない**。各要件は出典（MASTER §・D-xxx）と検証手段（Delta テスト等）にトレースする。詳細手順は Delta 指示書、判断理由は DECISIONS、スコープ境界は MVP_Scope が正で、本書は重複させない。

## 1. スコープ

対象は [`MVP_Scope.md`](MVP_Scope.md) の Core path（10 ステップ）と Fixed claims。対象外は [`MVP_Scope.md`](MVP_Scope.md) の Out of scope および [`../00_MASTER/HumanProof_MASTER.md`](../00_MASTER/HumanProof_MASTER.md) §9。ここでは再掲しない。

代表ユースケース: 18歳以上限定オンラインコミュニティ（[`../01_PRODUCT/UseCases.md`](../01_PRODUCT/UseCases.md)）。

## 2. 用語・データモデル

### 2.1 Claim Catalog（固定）

`human_verified` / `over_18` / `unique_person` の 3 種のみ。追加・変更は新しい判断（DECISIONS）を要する。

### 2.2 required / optional claims

- **required_claims**: 記述された目的を満たす最小限の proof。18+ community では `over_18` + `human_verified`。
- **optional_claims**: 目的に関連しうるが記述目的だけからは必須と確認できない proof（例: `unique_person`）。追加時は理由提示を促す。
- required と optional は互いに素。両者とも Catalog 外を含めない。
- 出典: [`ClaudeCode_Delta_Instructions.md`](ClaudeCode_Delta_Instructions.md) §4「required / optional claims の意味」。

### 2.3 requested data 正規カテゴリ

正規カテゴリ集合・単一 emit・distinct カウントは [`ClaudeCode_Delta_Instructions.md`](ClaudeCode_Delta_Instructions.md) §4「正規化とカウント規則」および D-028 に従う。proof へ変換してはならない情報は [`../00_MASTER/HumanProof_MASTER.md`](../00_MASTER/HumanProof_MASTER.md) §7。

## 3. 機能要件（FR）

| ID | 要件 | 出典 | 検証 |
|---|---|---|---|
| FR-01 | Service Requirement 入力を持つ（service name / audience・slug / purpose text〔必須〕/ currently requested data〔構造化選択を優先〕） | MASTER §4, Delta §2 | Delta テスト A/F |
| FR-02 | 自由文中の実 PII 値を検知したら OrcaRouter 送信前に block または mask し、送信はカテゴリ名のみ | D-010, D-027, Delta §2/§5 | Delta テスト E |
| FR-03 | AI 分析で purpose 抽出・requested data 抽出・最小 proof 推薦・potentially unnecessary 抽出・曖昧さ/前提/確認事項の提示を行う | MASTER §4, D-003/D-004/D-005 | Delta テスト A/B |
| FR-04 | requested data を正規カテゴリへ正規化し、単一 emit・distinct 件数で数える | D-028, Delta §4 | Delta テスト A |
| FR-05 | Recommendation UI を規定順で表示し、禁止表現を使わず推奨表現で potentially unnecessary を提示 | Delta §3, D-004/D-020 | Delta テスト A/C |
| FR-06 | Before/After 件数（distinct）を「N pieces of personal data → M proofs」で表示。デモは 4 → 2 | Delta §3, D-026/D-028 | Delta テスト A |
| FR-07 | Structured output v2 を schema 検証し、Claim allowlist 交差・required/optional 排他・PII→proof 変換禁止を強制 | Delta §4/§6, D-010/D-019 | Delta テスト D |
| FR-08 | ユーザーが共有内容と非共有 PII を確認し明示同意。同意で選ばれていない claim を proof に入れない | MASTER §7, D-006, Delta §6 | Delta テスト G |
| FR-09 | Signed Proof を発行（audience-bound / short-lived / pairwise pseudonymous subject） | MASTER §7/§8, D-008/D-009 | Delta テスト G |
| FR-10 | 検証で signature / issuer / audience / expiry / revocation を確認 | MASTER §7, D-008 | Delta テスト G |
| FR-11 | 失効後の再検証で `REVOKED` を表示 | MASTER §7 | Delta テスト G |
| FR-12 | OrcaRouter audit を actual-only で表示（model / latency / request ID / cost。cost 不取得時は `See OrcaRouter request log`）。identity data sent to AI = 0 を提示 | MASTER §7/§8, D-011, Delta §8 | §5 の受け入れ |
| FR-13 | Demo Trusted Issuer を模擬と明示し、`human_verified` / `over_18` / `unique_person` を発行済みとする | MASTER §6/§7, D-007 | UI/README 明記 |
| FR-14 | service text 内の指示を無視し（prompt injection 耐性）、server-side enforcement を LLM から独立に適用 | Delta §5/§6, D-019 | Delta テスト D |

## 4. 非機能・セキュリティ要件（NFR）

| ID | 要件 | 出典 |
|---|---|---|
| NFR-01 | raw identity documents sent to AI = 0 | D-010, MASTER §8 |
| NFR-02 | personal identity attributes sent to AI = 0（カテゴリ名のみ送信） | D-010/D-027, MASTER §8 |
| NFR-03 | OrcaRouter API key は server 側のみ | MVP_Scope |
| NFR-04 | LLM 出力の文字列を code / HTML として実行しない | Delta §4 |
| NFR-05 | 空・不正な LLM 出力は 1 回だけ再試行し、その後安全なエラー | Delta §4 |
| NFR-06 | 実装済み / 模擬 / 将来 / 仮説を UI・README・pitch で分離表示 | MASTER §8 |
| NFR-07 | audit は actual-only。偽のログ・コスト・モデル名を表示しない | D-011, MASTER §8 |
| NFR-08 | Claim allowlist enforcement は LLM 出力から独立。required/optional 排他 | Delta §6 |

## 5. 受け入れ基準

MVP は次をすべて満たしたとき「完成」とする。詳細ケースは [`ClaudeCode_Delta_Instructions.md`](ClaudeCode_Delta_Instructions.md) §7（テスト A–G）と [`Handoff_Checklist.md`](Handoff_Checklist.md) の Acceptance を正とし、ここでは対応関係のみ示す。

| 受け入れ | 対応 FR | 対応テスト |
|---|---|---|
| purpose + current requested data を入力できる | FR-01 | A/F |
| `Potentially unnecessary for the stated purpose` 表現・禁止表現なし | FR-05 | A/C |
| 「4 data → 2 proofs」が実データの distinct 件数で計算される | FR-04/FR-06 | A |
| 曖昧さ（seniors 等）で確定せず質問を返す | FR-03 | B |
| 追加正当目的（配送の住所等）を年齢目的だけで不要と断定しない | FR-03 | C |
| Zero PII to LLM（=0）を実証 | NFR-01/NFR-02 | E |
| Prompt injection を拒否 | FR-14/FR-07 | D |
| Consent → Signed Proof → Audience → Expiry → Revocation | FR-08〜FR-11 | G |
| OrcaRouter 実接続・actual-only audit | FR-12/NFR-07 | §8 |
| build / tests / typecheck / lint が緑 | — | CI/ローカル |

## 6. トレーサビリティ方針

- 各 FR/NFR は出典（MASTER §・D-xxx）へ後方リンクし、要件を新設・変更するときは先に DECISIONS を更新してから本書を同期する（[`../README.md`](../README.md) の更新ルールに従う）。
- 実装が要件と乖離したら、Delta 指示書ではなく本書と DECISIONS を先に更新する。
- 数値・件数・コストは実データ由来のみ。固定値を偽装しない（D-011/D-028）。

## 7. 未確定・依存

- OrcaRouter response metadata / cost 取得可否の実 shape は未確認（[`../06_RECORDS/Open_Questions.md`](../06_RECORDS/Open_Questions.md) Technology）。取得不可時は FR-12 のフォールバック表示に従う。
- 企業ニーズ・支払意思・購買主体・効果量は未検証（D-023〜D-026）。本書は「作るもの」を定義し、市場性を断定しない。
