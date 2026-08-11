# HumanProof 判断台帳

**Updated:** 2026-08-11  
**Rule:** 変更時は行を消さず、Status・Reason・Evidence neededを更新する。

| ID | Status | Decision | 主な由来 | 理由 / 条件 |
|---|---|---|---|---|
| D-001 | 採用 | 「あなたが誰か」ではなく必要な事実だけ証明する | 元提案 | 最も直感的なユーザー価値 |
| D-002 | 採用 | HumanProofを本人確認主体ではなくTrust UX / 中間レイヤーと位置づける | 元提案 + Mistral | 信用の根はTrusted Issuerに置く |
| D-003 | 採用 | AIはpurposeとrequested dataのギャップを分析する | Mistral + Sakana AI | 単なるclaim selectorより差別化とAI必然性が明確 |
| D-004 | 採用 | `Potentially unnecessary for the stated purpose` と表示する | Sakana AI | 未記述の法務・不正対策目的を否定しない |
| D-005 | 採用 | AIは曖昧さ・前提・確認事項を返す | Sakana AI | 定型ルールとの差を見せ、過剰断定を避ける |
| D-006 | 採用 | 最終決定をサービス事業者とユーザーに残す | 元提案 + 両レビュー | AIの責任範囲を限定 |
| D-007 | 採用 | Demo Issuerを明示し、本番本人確認を装わない | 元提案 | ハッカソンの誠実性とスコープ管理 |
| D-008 | 採用 | Signed Proof / audience / expiry / revocation / trusted issuer検証 | 元提案 + 両レビュー | Trust設計の最低限。ただし主役はUX |
| D-009 | 採用 | pairwise pseudonymous subject | 元提案 | サービス横断追跡を減らす |
| D-010 | 採用 | Zero raw identity data to LLM | 元提案 + Sakana AI | セキュリティとAI HACK評価に直結 |
| D-011 | 採用 | OrcaRouterの実接続と実メタデータのみ表示 | 元提案 + Sakana AI | コスト・運用性・監査性を実証 |
| D-012 | 採用 | AI Agent構想をFutureとして残す | 元提案 + 統合判断 | 次世代性を保ち、MVPは集中させる |
| D-013 | 保留 | 規制・業界標準を知識ベースとして照合 | Sakana AI | 有用だが法域・更新・責任設計が重い |
| D-014 | 保留 | 過去の侵害事例や業界ベンチマークを利用 | Sakana AI | データ品質・出典・更新方式が未設計 |
| D-015 | 保留 | Adult platformをBeachheadにする | Mistral | 課題は強い可能性があるが規制・ブランド・需要が未検証 |
| D-016 | 保留 | Verified Avatarを実装 | 元提案 | Futureとの整合はあるがCore MVP完成を優先 |
| D-017 | 保留 | 実eKYC / 公的ID / VC / DID接続 | 元提案 | 本番化フェーズで選定する |
| D-018 | 却下 | HumanProofをAdult専用にする | 統合判断 | 代表例と初期市場を混同しない |
| D-019 | 却下 | AIに本人確認、属性推測、法的適合性保証をさせる | 全ソース | 誤判定と責任の範囲が不適切 |
| D-020 | 却下 | `Unnecessary` / `Excessive` と無条件に断定する | Sakana AI | 記述されていない正当目的を否定し得る |
| D-021 | 却下 | 「競合がいない」「世界初」と主張する | Mistral検討 + 統合判断 | 競合調査未完了 |
| D-022 | 却下 | AI Agent Visionを消す | 統合判断 | テーマとの接続と長期一貫性を損なう |
| D-023 | 未検証 | 企業が過剰取得の削減に予算を持つ | ユーザー指摘 | 顧客インタビューと支払意思調査が必要 |
| D-024 | 未検証 | 主な購買理由がプライバシー、コスト、離脱、不正、規制のどれか | 統合判断 | 優先課題とKPIを顧客別に検証する |
| D-025 | 未検証 | HumanProofのAI-assisted minimizationが十分に独自 | 両レビュー | 競合機能比較が必要 |
| D-026 | 未検証 | 4件のPIIを2 Proofへ置換すると導入効果が出る | 統合判断 | 漏洩影響、離脱率、コスト等の効果測定が必要 |
| D-027 | 採用 | LLMへ送るrequested dataは種別名のみとし、実値はblock/maskする | 統合判断 | サービス説明へ実PIIが混入する経路も閉じる |

## 変更方法

新しい調査や実装結果が出たら、Evidence欄を追記して `未検証 → 採用/却下`、`保留 → 採用/却下` のように更新する。結論だけでなく、誰のどの事実で変わったかを記録する。
