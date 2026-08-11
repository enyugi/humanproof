# Source Map

| Source | Preservation | Current role | Location |
|---|---|---|---|
| 旧上位正本 | 完全原文 + SHA-256 | 履歴参照 | `99_REFERENCE/Original_Master_2026-08-11.md` |
| 旧Claude Code指示書 | 完全原文 + SHA-256 | 実装Baseline | `99_REFERENCE/Original_ClaudeCode_Instructions_2026-08-11.md` |
| 元提案の要点 | 要約 | 維持原則の確認 | `02_RESEARCH/Original_Proposal_Summary.md` |
| Mistral回答 | 共有原文 | 未検証の判断材料 | `06_RECORDS/Mistral_Raw_Response_2026-08-11.md` |
| Mistral採否 | 要約 | 判断の説明 | `02_RESEARCH/Mistral_Review.md` |
| Sakana AI回答 | 共有原文 | 未検証の判断材料 | `06_RECORDS/SakanaAI_Raw_Response_2026-08-11.md` |
| Sakana AI採否 | 要約 | 判断の説明 | `02_RESEARCH/SakanaAI_Review.md` |
| ユーザー懸念 | 統合記録 | 市場性の留保 | `06_RECORDS/Integration_Record_2026-08-11.md` |
| 統合結論 | 現行正本 | 最優先 | `00_MASTER/HumanProof_MASTER.md` |
| 個別判断 | 判断台帳 | 正本に次ぐ | `00_MASTER/DECISIONS.md` |
| Claude Code変更 | 差分仕様 | 実装再開用 | `04_DEVELOPMENT/ClaudeCode_Delta_Instructions.md` |

## Traceability examples

| Current decision | Source trail |
|---|---|
| Purpose/request gapへ変更 | Mistral原文 → Mistral要約 → D-003 → MASTER §4 |
| 断定表現を避ける | Sakana原文 → Sakana要約 → D-004/D-020 → MASTER §4 |
| 企業ニーズ未検証 | ユーザー懸念 → Integration Record → D-023/D-024 → MASTER §3 |
| AgentはFutureのみ | 元提案 + 両レビュー → D-012/D-022 → MASTER §10 |

