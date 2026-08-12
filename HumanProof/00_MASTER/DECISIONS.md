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
| D-028 | 採用 | requested dataを正規カテゴリへ正規化し、同一項目は単一 emit・distinct 件数で数える | 品質監査 | `id_photo`/`face_image`/`raw_identity_document` の二重計上を防ぎ「4 pieces → 2 proofs」の件数を決定論化する (MASTER §4 / Delta §4) |
| D-029 | 採用 | Proofセキュリティ設計 (4次レビューでgreen確定): 署名鍵は per-install ランダム seed をローカル永続 (ソース非搭載・不正seedは拒否・遅延初期化)。発行は署名付き quote(=サーバ確認) + 明示 consent の二要件、quote は単回使用。TTLはサーバ固定。失効は保有者の秘密 revocation code のみ。検証は署名後に typ/allowlist/重複・空・上限長・未来iat・TTL上限を厳格検証。**永続は fail-closed**(atomic write 0600・load時 shape/size 検証): 状態が読書不能/破損/上限超なら store=unavailable。**応答形状を統一**: 変更系(発行/失効)は HTTP 503、参照系(検証)は 200 + 構造化 REVOCATION_UNAVAILABLE (VALID にしない・未処理例外を出さない)。**旧形式(seedHex/revoked/revAuth・0644)は seed と期限内失効を保持したまま現行形式(0600)へ in-place 移行**し、途中失敗時は旧ファイルを壊さず fail-closed (削除で回復しない) | セキュリティレビュー(4回) | 鍵漏洩(source)・同意と発行の乖離・確認と同意の混同・TTL操作・提示者失効・再起動での失効消失・永続失敗の握り潰し(fail-open)・既存デモ環境の更新破綻・不正/巨大payloadを防ぐ。Demo Issuer/独自形式/ローカル単一プロセス永続は本番非準拠として明示 (実装記録: [`../06_RECORDS/Implementation_Notes_2026-08-11.md`](../06_RECORDS/Implementation_Notes_2026-08-11.md)) |
| D-030 | 採用 | Analyze 上流呼び出しに有限 per-call timeout(既定12s)＋全体 deadline(既定20s)＋client切断伝播。応答分類: 上流timeout→504(retriable)、上流HTTP非成功→502(secret非露出)、client切断→499、schema不正のみ deadline内で最大1回retry | 設計レビュー + 実接続実測 | ハング防止と入力エラーの区別。**実接続確認(2026-08-11)**: OrcaRouterは到達・処理・課金する(実測: 直近30日 req 3 / tokens 10.4K / cost $0.0138 / 平均遅延 ~55s)が、平均遅延が現行deadlineを超過し常時504。**fetch abort は上流を止めず課金は発生**(504はUXハング防止であってコスト防止ではない)。Zero-PIIは維持(送信はプロンプト+カテゴリ名のみ)。→ ライブデモは既定 MOCK(明示)を用い、実接続はlatency証跡として扱う。deadline引上げ/provider latency改善は将来判断 (実装記録参照) |
| D-031 | 採用 | 実 OrcaRouter をデモ/本番のライブ経路に載せる (D-030 の「ライブは MOCK 明示」を supersede)。①**非中国系の高速モデルをコード既定に固定** (`ORCAROUTER_DEFAULT_MODEL = openai/gpt-4o-mini`)。`orcarouter/auto` は難易度採点で frontier に振り ~55s になる上、中国系 (qwen/deepseek 等) にも振り得るため既定にしない (**no-Chinese ルールをコードで fail-safe に担保**)。env `ORCAROUTER_MODEL` で上書き可。②**system prompt に v2 出力スキーマを明示** (Level A)。従来 prompt は「version '2' の JSON を返せ」だけで実体スキーマ未指定のため、実モデルは妥当だが非適合な形を返し 422 になっていた (D-030 で常時504だったため実モデルのスキーマ適合は一度も検証されていなかった=MOCKでのみ通過)。③**provider に `max_tokens`(既定1500) 追加**で生成時間を上限化。④実測 (2026-08-13) の中央値 ~7s に合わせ **timeout 既定を per-call 20s / overall 32s に引上げ** (稀なテールのみ retriable 504)。⑤**代表デモ入力に「実在の人間である必要」を明記** (over-steer でなく目的の明確化) し、実 AI が正当に `over_18 + human_verified` の 2 proofs を返す=「4 pieces → 2 proofs」が実 AI 出力と一致 | 実接続実測(2026-08-13・非中国系モデル横断) + 別分布計画監査(Mistral) + ユーザー方針(no-Chinese) | 「Orca 利用必須」を本物の課金付きライブ経路で満たす。Zero-PII 維持 (egress はカテゴリ名のみ・egress スキャン0)。実測: 非中国系 flash は 2.6〜9s (gpt-4o-mini 中央値~7s)、auto の ~55s は frontier ルートが原因。審査⑥ LLMコストは実 request_id/model/latency を actual-only で提示 (偽ログ禁止 D-011 維持・cost未返却時は "See OrcaRouter request log")。参加者 ¥3,000 クレジット内で実測課金は誤差 |

## 読み方

この台帳は **ID 昇順の追記専用（append-only）** で並ぶ。Status（採用 / 保留 / 却下 / 未検証）でまとまってはいないため、新しい行（例: D-027, D-028）は Status で見ると末尾に現れる。Status 別のまとまった俯瞰は [`HumanProof_MASTER.md`](HumanProof_MASTER.md) §11 を参照する（両者は同期させる）。

## 変更方法

新しい調査や実装結果が出たら、Evidence欄を追記して `未検証 → 採用/却下`、`保留 → 採用/却下` のように更新する。結論だけでなく、誰のどの事実で変わったかを記録する。行は消さず ID 昇順で追記する。
