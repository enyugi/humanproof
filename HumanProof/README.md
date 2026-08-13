# HumanProof documentation hub

**Updated:** 2026-08-13
**Purpose:** IAMmeの上位構想とHumanProof PoCの現行方針を、ChatGPT・Claude Code・人間が同じ順序で参照するための入口。

## 最初に読む順序

1. [`00_MASTER/HumanProof_MASTER.md`](00_MASTER/HumanProof_MASTER.md) — 現在の正本
2. [`00_MASTER/DECISIONS.md`](00_MASTER/DECISIONS.md) — 採用・保留・却下・未検証の判断台帳
3. [`00_MASTER/RELEASE_EXPERIENCE_CANON.md`](00_MASTER/RELEASE_EXPERIENCE_CANON.md) — IAMme / HumanProofの名称、LP・デモ・Studioの役割
4. 作業別の文書
   - プロダクト検討: [`01_PRODUCT/`](01_PRODUCT/)
   - 壁打ち・市場仮説: [`02_RESEARCH/`](02_RESEARCH/)
   - ピッチ／デモ: [`03_AI_HACK/`](03_AI_HACK/)
   - 要件定義（実装契約）: [`04_DEVELOPMENT/Requirements.md`](04_DEVELOPMENT/Requirements.md)
   - Claude Code再開: [`04_DEVELOPMENT/ClaudeCode_Delta_Instructions.md`](04_DEVELOPMENT/ClaudeCode_Delta_Instructions.md)
   - 将来構想: [`05_FUTURE/`](05_FUTURE/)
   - 検討経緯・原回答・作業記録: [`06_RECORDS/README.md`](06_RECORDS/README.md)

## 正本の優先順位

矛盾した場合は次の順で優先する。

1. `00_MASTER/HumanProof_MASTER.md`
2. `00_MASTER/DECISIONS.md`
3. `00_MASTER/RELEASE_EXPERIENCE_CANON.md`（名称・公開体験・ページ構成に限る）
4. `04_DEVELOPMENT/MVP_Scope.md`
5. `04_DEVELOPMENT/Requirements.md`
6. `04_DEVELOPMENT/ClaudeCode_Delta_Instructions.md`
7. その他のテーマ別文書
8. `06_RECORDS/` の経緯・原回答
9. `99_REFERENCE/` の旧原本

`99_REFERENCE/` は履歴確認用であり、そこにある旧仕様をそのまま現行仕様と解釈しない。
`06_RECORDS/` は「なぜそう決めたか」を追跡する証跡であり、正本を上書きしない。

## ステータスの意味

- **採用**: 現時点の正本。MVP・説明・設計へ反映する。
- **保留**: 価値はあり得るが、MVPでは実装・断定しない。
- **却下**: 現在の方向では採らない。再採用には新しい根拠が必要。
- **未検証**: 事実・市場性・実現性を確認できていない。ピッチで断定しない。

## 更新ルール

- 方針を変えるときは、まず `DECISIONS.md` に判断と理由を追記する。
- その後 `HumanProof_MASTER.md` と関連文書を同時更新する。
- 実装変更は `ClaudeCode_Delta_Instructions.md` にまとめ、断片的な追加指示を増やさない。
- 市場調査の仮説と、実装済みの事実を混ぜない。

## ChatGPTの定期確認ルール

- HumanProofについて回答する3回に1回、回答前に次を再確認する。
  1. `00_MASTER/HumanProof_MASTER.md`
  2. `06_RECORDS/Source_Map.md`
- 方針変更や実装判断を含む場合は、あわせて `00_MASTER/DECISIONS.md` も確認する。
- 2026-08-11のユーザー指示により、このルールを継続する。
