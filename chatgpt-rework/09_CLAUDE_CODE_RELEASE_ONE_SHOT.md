# Claude Codeへ渡す最終一発指示

以下を、このリポジトリ `/Users/hsmtw/dev/IAMme` を開いたClaude Codeへそのまま渡す。

---

## IAMme / HumanProof AI HACK 2026 最終リリース改修

### 役割

あなたは既存Next.jsリポジトリを完成させる実装者です。新しいプロダクト方針を発明せず、正本と本指示を既存実装へ落としてください。

時間制約が強いため、API、暗号、PII Shield、永続化、i18nを作り直さず、現在動いている実装を最大限再利用してください。

### 最初に必ず読むファイル

次の順で全文を読み、矛盾時は上を優先してください。

1. `HumanProof/00_MASTER/HumanProof_MASTER.md`
2. `HumanProof/00_MASTER/DECISIONS.md`
3. `HumanProof/00_MASTER/RELEASE_EXPERIENCE_CANON.md`
4. `HumanProof/03_AI_HACK/Judging_Criteria.md`
5. `HumanProof/04_DEVELOPMENT/Requirements.md`
6. `chatgpt-rework/11_SITE_DESIGN_REFERENCE.md`
7. 現在の `app/page.tsx`、`app/globals.css`、`app/layout.tsx`
8. `app/components/HowItWorks.tsx`、`app/components/FutureVision.tsx`
9. 既存API routesとテスト
10. `lib/claims.ts`、`lib/proof/proof.ts`、`app/api/proof/revoke/route.ts`

読み終える前に実装を始めないでください。

### 計画をユーザーへ出す前の品質ゲート（必須）

ユーザーを計画のデバッガーにしないでください。ドラフト計画を先に見せず、次をClaude Code側で完了してから、監査済みの計画を一度だけ提示してください。

1. 正本だけでなく実コードを読み、API payload、型、定数、失効権限、現在のbranch/main、未コミット変更を照合する
2. 計画内の全ての固有名、カテゴリ名、API順序、実装済み／模擬／未実装の主張を、根拠ファイルと対応づける
3. 完成した計画全文を `/plan-audit` と `/mistral-redteam` に渡す。要約だけを渡して済ませない
4. Mistralの `Critical` と `High` を全件処理する。採用しない指摘は、好みではなく実コードまたは正本の根拠を明記する
5. 修正後の計画をもう一度Mistralへ渡し、未解決の `Critical=0`、`High=0` を確認する
6. 最後にClaude Code自身が、正本・実コード・テスト・締切・8審査項目を再照合する

Mistralを呼び出せなかった場合、呼んだことにしてはいけません。APIエラーやキー未設定を具体的な技術ブロッカーとして報告し、監査未実施の計画を「最終計画」として提出しないでください。

ユーザーへ提示する計画の末尾には、次だけを簡潔に付けてください。

- Mistral監査を実行した事実
- Critical / High / Medium / Lowの件数
- CriticalとHighをどう解消したか
- 実コードとの照合で修正した点
- 残余リスク

計画を提示した後に「これをMistralへかけます」と次工程へ回さないでください。Mistral監査と反映は、計画提示より前の内部品質工程です。

### 名称の非交渉

- **IAMme**: 私たちが決めた長期プロダクト／構想の名前。公開サイトの上位ブランド。
- **HumanProof**: AI HACK 2026で提出するPoC名。IAMmeのNOWに位置する最初の実証。
- **NIGHT SCREEN**: PoCの架空Verifier／映画サービス。
- **Demo Trusted Issuer**: 属性元確認だけが模擬のIssuer。
- **AI Policy Studio**: サービス導入者向けPolicy設計・監査ツール。一般利用者画面ではない。

HumanProofをIAMmeの代替ブランドとしてサイト全体へ拡張しないでください。一方、提出上すでに使用しているHumanProof名、API、ディレクトリ、PoCビジュアルは維持してください。

### Claude Codeの現在の質問への確定回答

表示された選択肢1〜3ではなく、以下で実装してください。

> `/` はIAMmeのLP、`/demo` はHumanProofの主デモ、`/studio` は既存AI Policy Studio。現行 `app/page.tsx` のPolicy Studio機能は `/studio` へ丸ごと移設する。LPの主CTAは `/demo`。`/demo` 完了後にAI分析の要約を表示し、詳細な要件入力、Stress Test、OrcaRouter監査は `/studio` へ副リンクで開く。

Policy Studioを削除しないでください。LPや主デモの折り畳み内へ混在させないでください。

追加のプロダクト選択質問は止め、正本に従って実装してください。実装を安全に続行できない具体的な技術ブロッカーだけを質問してください。

## 1. ルート構成

### `/` — IAMme Landing Page

役割は理解とデモへの送客です。操作デモ本体をLPへ埋め込みません。

必須構成:

1. IAMmeヘッダー
   - wordmark: `IAMme`
   - 小ラベル: `HumanProof / AI HACK 2026 PoC`
   - 主CTA: `デモを試す` → `/demo`
2. Hero
   - HumanProof PoCのコンセプトポスター
   - 見出し: `身分証を渡さず、必要なことだけ証明する。`
   - 短い説明
   - `デモを試す` → `/demo`
3. HumanProofの仕組み
   - 現在要求4項目 → HumanProof → 2つのProof
   - 渡さない4項目を明示
4. AIの役割
   - `AIは本人を見ない。サービスの要求を読む。`
   - 定型18歳確認だけならルールで足りることも明記
5. 実装境界
   - 実装済み／模擬／構想・未実装
6. IAMme Future
   - NOW: HumanProof
   - NEXT: 複数Trusted Issuer、実eKYC等。構想・未実装
   - FUTURE: 人とAI AgentのTrust Layer。構想・未実装
7. 最終CTA
   - `HumanProof PoCを試す` → `/demo`

現在の `HowItWorks` と `FutureVision` は内容を捨てず、正本違反のコピーだけ修正して再利用してください。

`HowItWorks` にある以下は修正必須です。

- `漏洩の心配もない／never shared` の絶対表現を使わない
- `いつでも自分で失効できる／you can revoke anytime` を使わない
- `漏洩・管理リスクを最小限に抑える`
- `同意の永続管理と再提示停止は構想・未実装`
- `このPoCでは、発行時に保有者へ返した秘密の失効コードでProofを失効する`
- 絵文字を主要アイコンとして使わない

### `/demo` — HumanProof Guided Demo

最初の画面はNIGHT SCREENの会員登録です。一般利用者へサービス要件を入力させないでください。

#### Screen 1: NIGHT SCREEN

表示:

- `会員登録 / 最後の1ステップ`
- `年齢確認が必要です。`
- 従来の確認: 身分証をアップロード。比較表示のみで実アップロードは作らない
- HumanProof: 18歳以上／実在する人
- 主ボタン: `HumanProofを使う`

PCとモバイルの最初の視野に `HumanProofを使う` を出してください。モバイルはHumanProof側を従来確認より先に表示してよいです。

#### Screen 2: 共有確認

サービスへ共有:

- 18歳以上である
- 実在する人である

サービスへ渡さない:

- 氏名
- 正確な生年月日
- 住所
- 身分証画像

同じ視野内に表示:

- `Demo Trusted Issuer / 模擬。本番の本人確認ではありません。`
- `証明も個人に関する属性であり、匿名化を意味しません。`

主ボタン: `この2つだけ共有する`

#### Screen 3: 実API処理

既存実装を再利用し、次を順に実行してください。

1. 保存済みNIGHT SCREEN Policyの `expectedClaims=["over_18","human_verified"]` を使用
2. `quote`
3. 明示consentを伴う `issue`
4. `verify`

`/demo` の登録処理では `/api/analyze` を呼ばないでください。実OrcaRouterによる `analyze` はサービス導入時の処理として `/studio` で実行します。「保存済みPolicyを使う」と「登録のたびにanalyzeする」を混在させないでください。

API失敗時は成功状態へ進めず、再試行可能なエラーを表示してください。成功のモック表示は禁止です。

#### Screen 4: NIGHT SCREENへ戻る

`登録が完了しました。`

`身分証画像をNIGHT SCREENへ提出せず、視聴を始められます。`

実測値:

- 共有した証明: 2
- NIGHT SCREENが受け取った証明: 2
- NIGHT SCREENへ渡さない項目: 4

注記:

`「個人情報が0」ではありません。共有された2つの属性証明は個人に関する情報です。`

操作を3つに分けてください。

1. `AIが何をしたか` — 保存済みPolicyの要約。実OrcaRouter監査は `/studio` で表示
2. `同意管理について` — 永続的な同意撤回と再提示停止は `構想・未実装` と説明する。実装済みの操作として見せない
3. `このProofを失効する` — 発行時に保有者へ返された秘密の `revocationCode` を使ってrevokeし、その後に再verify

詳細リンク:

`Policy Studioで要求設計を検証する` → `/studio`

#### Screen 5: REVOKED

同じProofを再検証し、`REVOKED` を実APIで確認してから表示してください。

`この証明は、もう通用しません。利用を続けるには年齢確認をやり直す必要があります。`

未実装の同意管理と、実装済みのProof失効の違いを短く表示してください。

### `/studio` — AI Policy Studio

現在の `app/page.tsx` にあるサービス要件入力 → AI分析 → 4→2 → Proof lifecycle機能を移設してください。

ただし主役のProof lifecycleは `/demo` にあるため、Studio側は次へ焦点を絞ってよいです。

- サービス目的
- 現在要求中のデータカテゴリ
- OrcaRouter分析
- Minimum Proof候補
- Potentially unnecessary for the stated purpose
- assumptions / clarification questions
- actual-only audit
- Policy Stress Test

既存機能を一度に削除しないでください。移設後に参照されない重複が明確になった場合だけ、テストで同等性を確認して整理してください。

Stress Test例:

1. 配送目的が混在する酒類配送
   - 年齢確認は `over_18`
   - 住所は配送に必要なので不要と断定しない
2. 要求文へ指示が混入
   - 氏名・住所をClaim化しない
   - 固定Claim Catalogとserver-side enforcementを維持
3. 目的が曖昧
   - Claimを自動確定せずclarificationへ戻す

## 2. 既存実装の再利用

必ず維持:

- `/api/analyze`
- `/api/provider`
- `/api/proof/quote`
- `/api/proof/issue`
- `/api/proof/verify`
- `/api/proof/revoke`
- OrcaRouter providerとactual metadata
- PII Shield / block-before-egress
- 固定Claim Catalogとschema validation
- pairwise subject
- quote単回使用
- 明示consent
- サーバ固定TTL
- Ed25519署名
- audience検証
- fail-closed永続
- revocation code
- 日本語／英語i18n

API形状をUI都合で変更しないでください。共有できる状態・型・UI部品を抽出し、3ルートから再利用してください。

## 3. デザイン

`chatgpt-rework/design-reference/` の画像と `11_SITE_DESIGN_REFERENCE.md` を参照してください。

基調:

- 白 `#FFFFFF`
- 墨黒 `#161916`
- 深緑 `#0D4D31`
- 緑 `#16A06A`
- 薄灰 `#F5F6F3`
- 罫線 `#C9CEC7`
- 模擬ラベル淡黄 `#F3EBC5`

文字:

- IAMmeロゴ・大見出し: 日本語セリフ体
- 本文・UI: 日本語サンセリフ体
- Audit: 等幅体
- 左揃え、非対称、1px罫線

禁止:

- 黒背景
- 青紫グラデーション
- glassmorphism
- 薄影＋角丸カードの量産
- 絵文字を主要アイコンとして使う
- 中央寄せ巨大ヒーロー
- 対称3カラムfeature cardの量産
- スクリーンショットを操作UIの代わりに貼る

日本語:

- `line-break: strict`
- 本文に無差別な `text-wrap: balance` を使わない
- 助詞や句読点だけが行頭・行末へ孤立しないよう、カラム幅と文を調整
- `<br>` は文意の境界だけ
- 390px幅でも横スクロールを出さない

## 4. 表現禁止

使わない:

- 個人情報を一切共有しない
- 個人情報ゼロ
- 漏洩の心配がない
- 過剰取得と管理リスクをゼロにする
- 完全匿名
- いつでも利用者自身が証明を失効できる
- AIでなければ不可能
- GDPR準拠
- 実eKYC接続済み
- 世界初／競合不在
- 企業ニーズや効果量を検証済みとする

使う:

- 共有しない具体項目を列挙
- 過剰取得と管理リスクを最小限に抑える
- 定型例はルールで足りる
- AIは導入時のPolicy設計を支援
- 同意の永続管理と再提示停止は構想・未実装
- このPoCでは、発行時に保有者へ返した秘密の失効コードでProofを失効する

## 5. 正式な8審査観点をすべて取る

正本 `Judging_Criteria.md` の8項目を一対一で確認してください。

1. 課題の実在性 — LPと従来確認比較
2. ビジネス成立性 — 価値仮説。未検証を明示
3. 完成度・デモ — `/demo` の一本道
4. AI必然性 — `/studio` の複雑要件とStress Test
5. 技術的作り込み — 署名、audience、expiry、revocation、fail-closed
6. LLMコスト — OrcaRouter actual-only audit。返却されない値は作らない
7. セキュリティ — Zero-PII、PII Shield、allowlist、consent
8. 次世代性 — IAMme NOW → NEXT → FUTURE

提出資料の表現も、サイトの実装境界と一致させてください。

## 6. テスト

既存テストをすべて維持し、次を追加してください。

### Route / content

1. `/` がIAMmeを上位ブランド、HumanProofをPoCとして表示
2. `/` の主CTAが `/demo`
3. `/demo` の入口にサービス要件入力欄がない
4. `/studio` に既存Policy入力と分析機能がある
5. 実装済み／模擬／構想・未実装ラベルが存在
6. 禁止文言が存在しない

### Main flow

7. HumanProof選択 → consent → quote → issue → verify → 登録完了
8. API失敗時に登録完了へ進まない
9. 同意管理が `構想・未実装` と明示される
10. 保有者の秘密 `revocationCode` による失効 → 再verifyでREVOKED

### Policy / security

11. analyzeが代表入力で `over_18` と `human_verified`
12. PII Shieldが実値をblock/maskしてegressしない
13. Claim allowlistが維持される
14. Stress Testの混入指示で氏名・住所をClaim化しない

### Responsive / accessibility

15. 390pxで横スクロールなし
16. 最初のモバイル視野にHumanProof選択と操作ボタン
17. focus-visibleとreduced-motionを維持

実行:

- `npm run typecheck`
- `npm test`
- `npm run lint`
- `npm run build`

利用可能なら実ブラウザでデスクトップと390px幅を確認してください。

## 7. 完成条件

- 10秒でIAMmeとHumanProofの関係が分かる
- LPが説明、`/demo` が操作、`/studio` がAI証拠という役割分担になっている
- デモの最初の視野に `HumanProofを使う` がある
- 90秒以内に登録完了へ到達できる
- `VALID` と `REVOKED` が実API結果
- Policy Studio機能が失われていない
- 正式な8審査観点に対応する証拠がある
- 実装済み、模擬、将来、仮説が混ざらない
- IAMmeをHumanProofで上書きしていない

## 8. 作業終了時の報告

次だけを簡潔に報告してください。

1. 変更ファイル
2. `/`、`/demo`、`/studio` の役割
3. 既存実装の再利用箇所
4. 実APIで確認した `VALID` / `REVOKED` 結果
5. OrcaRouter実接続／MOCK／エラー時の挙動
6. 実行したテストと結果
7. 8審査観点の画面マッピング
8. 未実装・未検証として残したもの

ここにない新機能を発明しないでください。期限内に完成させる優先順位は、

1. `/demo` の一本道
2. LPからデモへの導線
3. `/studio` の機能維持
4. 誠実な境界表示
5. 視覚調整

です。

---
