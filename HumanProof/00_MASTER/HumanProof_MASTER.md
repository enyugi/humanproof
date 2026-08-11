# HumanProof 現行正本

**Version:** 2.0  
**Updated:** 2026-08-11  
**Status:** AI HACK 2026 MVP仕様。企業ニーズ・市場性は未検証。  
**Owner:** 参加者本人（非エンジニアのマーケター、1人チーム）

## 1. 一言定義

> **本人情報の要求を、必要最小限の「証明」に変える。**

HumanProof は本人確認AIではない。サービスの目的と、現在要求している本人情報を比較し、目的を満たし得る最小のProofを提案する **Trust UX / Trust Layer** である。

英語の中心表現:

> **Turn identity requests into minimum proof.**

ユーザー価値を短く伝える表現:

> **「あなたが誰か」を渡さず、必要なことだけ証明する。**

## 2. 課題仮説

年齢確認等のために、サービスが氏名、正確な生年月日、住所、顔写真、本人確認書類画像まで受け取る場合がある。しかし目的が「18歳以上の実在人物であること」の確認だけなら、より少ない情報で達成できる可能性がある。

HumanProof は次を分離する。

- Trusted Issuerが本人・属性を確認すること
- サービスが何を確認する必要があるかを設計すること
- ユーザーが何を共有するか同意すること
- Verifierが署名・Issuer・期限・失効・audienceを検証すること

## 3. 企業ニーズについての明示

> **企業がそうすべきことと、企業がお金を払ってまで欲しいことは別である。**

以下はすべて現時点では仮説であり、顧客インタビュー、導入意向、支払意思、購買主体を検証できていない。

- 不要なPIIを持たないことで漏洩時の損失を下げたい
- 本人確認コストや審査運用を下げたい
- 本人確認による離脱を下げたい
- 不正利用や複数アカウントを抑えたい
- データ最小化・規制対応を説明可能にしたい

AI HACKでは「企業が求めている」と断定せず、**実在し得る問題に対するプロダクト仮説**として提示する。

## 4. AIの役割

サービス事業者が、目的と現在要求しているデータを自然言語で入力する。

例:

> We operate an 18+ community. We currently ask users for their full name, exact date of birth, home address and ID photo to confirm eligibility.

AIは次を行う。

1. 記述された目的を抽出する
2. 現在の要求データを抽出する
3. 固定Claim Catalogから最小Proof候補を推薦する
4. 目的との必要性が確認できない要求を示す
5. 曖昧さ、前提、追加確認事項を示す

出力例:

```text
Stated purpose
✓ Adult eligibility
✓ Human verification

Minimum proof
✓ Over 18
✓ Verified Human

Potentially unnecessary for the stated purpose
⚠ Full name
⚠ Exact date of birth
⚠ Home address
⚠ ID photo

4 pieces of personal data → 2 proofs
```

`4 pieces` の件数は、正規化・重複排除後の distinct な要求項目数で数える（このデモは `full_name` / `exact_birth_date` / `address` / `id_photo` の 4。"ID photo" は `id_photo` に正規化し二重計上しない）。詳細は [`ClaudeCode_Delta_Instructions.md`](../04_DEVELOPMENT/ClaudeCode_Delta_Instructions.md) §4。

AIは法務判断者でも本人確認者でもない。`Unnecessary` と断定せず、**Potentially unnecessary for the stated purpose** と表現する。最終判断はサービス事業者とユーザーに残す。

## 5. AIである必然性の説明

定型的な「18歳確認 → over_18」だけならルールベースで十分である。この限界は隠さない。

AIを使う対象は、実際の要件が利用規約、運用目的、不正対策、年齢条件などを含む非定型の文章であり、次が必要になる部分である。

- 複数目的と現在の要求データの対応付け
- 暗黙の目的や矛盾の発見
- 曖昧な語の検出と確認事項の提示
- 目的に対して説明されていない過剰要求候補の抽出
- 固定Schemaへの構造化

ただし、規制知識・業界慣習・過去事例との照合はMVPでは実装せず、将来候補として保留する。

## 6. Trust構造

```text
Trusted Issuer
  ↓ signed verified attributes
User / HumanProof
  ↓ minimum proof after consent
Verifier / Service
  ↓ verify issuer, signature, audience, expiry, revocation
```

HumanProof自身を信用の根源にしない。MVPでは `Demo Trusted Issuer` を使い、本人確認が模擬であることをUIとREADMEに明示する。

## 7. AI HACK MVP

代表ユースケースは18歳以上限定オンラインコミュニティ。

実装する一本道:

1. Demo Issuerから `human_verified`、`over_18`、`unique_person` が発行済み
2. サービスが目的と現在要求中のデータを入力
3. OrcaRouter経由でAI分析
4. 目的、最小Proof、過剰要求候補、前提を表示
5. サービスがProof Requestを作成
6. ユーザーが共有内容を確認して明示同意
7. audience-bound・短命のSigned Proofを発行
8. サービスが署名、Issuer、audience、期限、失効を検証
9. Proofを失効し、再検証で `REVOKED` を表示
10. 実際のOrcaRouter model / latency / request ID / cost参照先をAuditで表示

固定Claim Catalog:

- `human_verified`
- `over_18`
- `unique_person`

Proofへ入れない情報:

- full name
- exact date of birth
- address
- face image（`face_image`: 素の顔写真）
- ID document/image/number（`id_photo` / `raw_identity_document` / `driver_license_number` / `government_id_number`）
- phone number
- email

`face_image`（素の顔写真）と `id_photo`（本人確認書類の写真）は別カテゴリとして扱い、件数は正規化・重複排除後の distinct 件数で数える（[`ClaudeCode_Delta_Instructions.md`](../04_DEVELOPMENT/ClaudeCode_Delta_Instructions.md) §4）。

## 8. 非交渉の設計原則

- Zero raw identity documents to LLM
- Zero personal identity attributes to LLM
- サービス入力にはデータ種別名だけを使い、実在人物の氏名・住所・生年月日等の値を入れない。検出した場合は送信前にblockまたはmaskする
- LLM出力はserver-side schema validationとallowlist enforcementを通す
- AIは推薦者であり権限者ではない
- ユーザーの明示同意なしにProofを発行しない
- サービス間で共通Human IDを渡さずpairwise pseudonymous subjectを使う
- Proofは署名、audience、有効期限、失効を持つ
- 偽のOrcaRouterログ・コスト・モデル名を表示しない
- 実装済み、模擬、将来、仮説をUI・README・ピッチで分ける

## 9. 今回作らないもの

- 本番eKYC、JPKI、公的ID接続
- 運転免許証OCR、顔認証、ライブネス
- 完全なVerifiable Credentials / DID実装
- モバイルアプリ、本格SSO、課金
- Creator / Organization / Avatar認証本実装
- AI Agent認証・権限委譲の本実装
- 規制・業界ルールの自動法務判定
- 侵害事例データベースや市場ベンチマーク連携

## 10. 将来像

MVPはHuman向けSelective Proofに集中する。AI Agentは開発対象ではなく、次世代性を示すFuture Visionとして残す。

> **A trust layer for an internet shared by humans and AI agents.**

将来は `Verified Human`、`Verified Organization`、`AI Agent`、`Human-operated AI`、`Authorized Avatar` 等について、何者か、誰が許可したか、どの権限をいつまで持つかを必要最小限だけ証明する。

## 11. 現在の判断サマリー

| 区分 | 内容 |
|---|---|
| 採用 | purpose と requested data のギャップ検出 |
| 採用 | 「過剰」と断定せず、記述目的に対する候補として表示 |
| 採用 | Demo Issuer、Consent、Signed Proof、Expiry、Revocation、Audience |
| 採用 | pairwise subject、Zero PII to LLM、OrcaRouter実ログ |
| 採用 | requested dataは種別名のみ送信し実値はblock/mask (D-027) |
| 採用 | requested dataを正規化し、単一emit・distinct件数で数える (D-028) |
| 保留 | 規制・業界慣習・侵害事例・過去事例とのRAG/照合 |
| 保留 | Adult業界を初期市場とすること |
| 保留 | 実Issuer、価格、課金、最初のBeachhead |
| 却下 | AIに本人確認または法的判断を任せること |
| 却下 | Adult専用プロダクト化 |
| 却下 | AI Agent Visionを削除すること |
| 未検証 | 企業ニーズ、支払意思、購買主体、導入障壁 |
| 未検証 | 独自性の強さ、競合不在、市場規模、効果量 |

詳細は [`DECISIONS.md`](DECISIONS.md) を参照。
