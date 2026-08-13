# HumanProof — 3分デモ動画 完成台本 v1

**Version:** 1.0  
**Created:** 2026-08-11  
**Maximum length:** 3:00  
**Recommended final length:** 2:50–2:55  
**Status:** 実装確認前。画面名と最終操作はClaude Code再開後に実物へ合わせる。

## 1. 動画の目的

3分で次を証明する。

1. 課題が一目で分かる
2. AIがpurposeとrequested dataのズレを分析する
3. 4つの本人情報要求を2つのProofへ変える
4. ユーザーが共有内容へ同意する
5. Signed Proofを検証できる
6. Proofを失効し、再検証で `REVOKED` になる
7. OrcaRouterを実際に利用している
8. Demo Issuer、Zero PII、企業ニーズ未検証を誠実に区別する

## 2. 動画全体の構成

| Time | Screen | Main message |
|---|---|---|
| 0:00–0:15 | Problem title | 年齢確認に免許証の全部は必要か |
| 0:15–0:35 | Service Requirement | 目的と現在要求中のデータを入力 |
| 0:35–1:05 | AI Recommendation | 4 data → 2 proofs |
| 1:05–1:30 | User Consent | 共有するのはProofだけ |
| 1:30–1:55 | Proof Issued / Verify | 署名・Issuer・audience・期限を検証 |
| 1:55–2:15 | Revoke / Re-verify | 失効後は信頼できない |
| 2:15–2:40 | AI Audit / OrcaRouter | 実model・latency・request ID・cost参照 |
| 2:40–2:55 | Security / boundary | Demo Issuer、Zero PII、AIの責任範囲 |
| 2:55–3:00 | Future closing | Human + AI InternetのTrust Layerへ |

## 3. 秒単位の完成台本

### 0:00–0:15 — Problem

**画面**

- 黒または白のシンプルなタイトル
- 左に `Full name / Date of birth / Address / ID photo`
- 右に `Over 18?`

**画面テキスト**

```text
「18歳以上」の確認に、
免許証の全部が必要ですか？
```

**ナレーション**

> 年齢確認のために、知らないサービスへ免許証や顔写真を渡したことはありませんか。でも、そのサービスが本当に必要なのは、あなたの氏名や住所まででしょうか。

**編集**

- 最初の2秒で問いを表示
- 個人情報4項目を薄いグレー、`Over 18?` を青で表示

### 0:15–0:35 — Service Requirement

**画面**

- HumanProofのService Requirement画面
- デモ値を入力済みにする

**入力文**

```text
We operate an 18+ community.
We currently ask users for their full name,
exact date of birth, home address and ID photo
to confirm eligibility.
```

**操作**

1. Service nameを確認
2. Requirement textを見せる
3. Currently requested dataの4項目を見せる
4. `Analyze requirements` をクリック

**ナレーション**

> サービス事業者は、利用目的と、現在要求している本人情報を自然な文章で入力します。ここでは18歳以上の実在人物を確認するために、4つの個人情報を要求しています。

### 0:35–1:05 — AI Recommendation

**画面**

- Loadingは必要最小限
- AI Recommendation画面へ遷移

**必ず映す項目**

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

**ナレーション**

> OrcaRouter経由のAIが、目的と現在の要求を比較します。必要なのはVerified HumanとOver 18。一方、氏名、生年月日、住所、ID写真は、記述された目的だけでは必要性を確認できない候補として示します。不要と断定するのではなく、追加の業務目的がないかを事業者へ問い返します。

**重要**

- `Unnecessary` や `Illegal` と表示しない
- `Potentially unnecessary for the stated purpose` を読める時間だけ静止
- `4 → 2` を動画内で最も大きく見せる

### 1:05–1:30 — User Consent

**操作**

1. `Create proof request`
2. User側へ切り替える
3. Consent画面を表示
4. 共有する2 Proofと、共有しない情報を見せる
5. `Share proof` をクリック

**画面テキスト**

```text
Example Community wants to verify:
✓ Verified Human
✓ Over 18

They will NOT receive:
× Real name
× Exact date of birth
× Address
× Face / ID image
```

**ナレーション**

> ユーザーは、サービスへ何を渡すかを確認します。共有するのは2つのProofだけ。本名、正確な生年月日、住所、顔画像は共有しません。Proofはユーザーの明示同意後にだけ発行されます。

### 1:30–1:55 — Proof Issued and Valid

**画面**

- Proof Issued
- `Verify as Service` をクリック
- `PROOF VALID`

**必ず映す検証項目**

```text
✓ Signature valid
✓ Trusted issuer
✓ Correct audience
✓ Not expired
✓ Not revoked
✓ Verified Human
✓ Over 18

Personally identifiable information received: NONE
```

**ナレーション**

> 発行されるのは、サービスごとのaudienceに結びついた短時間有効のSigned Proofです。サービス側は、署名、Issuer、audience、有効期限、失効状態を検証できます。本人確認書類そのものは受け取りません。

### 1:55–2:15 — Revoke and Re-verify

**操作**

1. `Revoke proof`
2. 確認表示
3. 同じProofを再検証
4. `PROOF REVOKED`

**ナレーション**

> Proofは永久の認証状態ではありません。ユーザーまたはIssuerが失効させると、同じProofを再検証してもREVOKEDになります。これにより、発行後のTrustも管理できます。

### 2:15–2:40 — AI Audit / OrcaRouter

**画面**

- HumanProofのAI Audit
- 必要に応じてOrcaRouter dashboardの該当requestへ切り替える

**実値だけを表示**

```text
Provider: OrcaRouter
Route: [actual]
Model: [actual if exposed]
Latency: [actual]
Request ID: [actual if exposed]
Cost: [actual or “See OrcaRouter request log”]

Raw identity documents sent to AI: 0
Personal identity attribute values sent to AI: 0
```

**ナレーション**

> この分析はOrcaRouterを実際に経由しています。使用モデル、レイテンシ、request ID、取得可能なコスト情報を監査できます。LLMへ送るのはサービスの目的とデータ種別だけで、本人確認書類やユーザー属性の実値は送りません。

**禁止**

- 推定costをactual costとして表示しない
- 実際と異なるmodel名やrequest IDを作らない
- 失敗したリクエストを成功したように編集しない

### 2:40–2:55 — Boundary and honesty

**画面**

```text
Hackathon prototype

Identity verification: Demo Issuer / simulated
AI role: Recommendation only
Legal determination: No
Business demand: Not yet validated
```

**ナレーション**

> 今回の本人確認元は、明示されたDemo Issuerです。AIは本人確認も法的判断もしません。また、企業ニーズと支払意思は今後検証する仮説です。

### 2:55–3:00 — Future

**画面**

```text
Human → Organization → AI Agent

The Trust Layer for the Human + AI Internet.
```

**ナレーション**

> Humanから始め、将来はAI Agentの権限まで。HumanProofです。

## 4. 録画時の正確なクリック経路

実装完成後、ボタン名とURLを実物へ合わせて更新する。

```text
Home
→ I am a Service
→ Service Requirement
→ Analyze requirements
→ AI Recommendation
→ Create proof request
→ Switch to User / View request
→ User Consent
→ Share proof
→ Proof Issued
→ Verify as Service
→ PROOF VALID
→ Revoke proof
→ Verify again
→ PROOF REVOKED
→ AI Audit
→ OrcaRouter request log
```

## 5. 録画前チェックリスト

### Data and security

- [ ] API key、JWT secret、Supabase key等が映らない
- [ ] ブラウザのpassword managerや通知をOFF
- [ ] 実在人物の氏名・住所・生年月日・ID番号を使わない
- [ ] Demo User / Demo Serviceのみ使用
- [ ] OrcaRouter dashboardに他案件・秘密情報が映らない
- [ ] request logのpromptに実PIIが含まれていない

### Demo state

- [ ] OrcaRouter実呼び出しが成功する
- [ ] model / latency / request IDの表示が実レスポンスと一致
- [ ] costが取れない場合は `See OrcaRouter request log`
- [ ] Valid Proofを発行できる
- [ ] 同じProofを失効できる
- [ ] 再検証でREVOKEDになる
- [ ] audience違い・期限切れ等のテストは動画外でも確認済み

### Recording

- [ ] 1920×1080、16:9
- [ ] ブラウザ倍率と文字サイズを事前固定
- [ ] カーソルを必要な要素以外で動かさない
- [ ] 入力待ち時間は編集で短縮してよいが、実処理結果は変えない
- [ ] ナレーションを先に仮録音し、操作速度を合わせる
- [ ] 完成尺を2:50–2:55に収める
- [ ] 最後の5秒を切らない

## 6. 不安定時の代替方法

### OrcaRouterが録画中に不安定

- 事前に成功した**実リクエスト**の録画を使用してよい
- dashboardの同じrequest IDを映す
- デモ用の偽レスポンスや偽ログは使わない

### Cost metadataがAPIから取れない

- アプリには `See OrcaRouter request log` と表示
- dashboardの実ログへ切り替える
- costを推定してactualとして表示しない

### Live demoが遅い

- 実際の成功フローを画面録画し、待ち時間のみ短縮する
- Loading直後に別の結果画面を貼り合わせる場合も、同じ実requestの結果を使う

### 一部機能が未完成

- 未完成機能を動いたように合成しない
- 完成した一本道へ動画を短縮する
- `Prototype limitation` と明示する
- Signed ProofやRevocationが未完成なら、ピッチ上でも「実装済み」と言わない

## 7. 実装確認後に更新する項目

- 実際のURLと画面名
- ボタン名
- OrcaRouter metadataの取得項目
- Proofの有効期限
- Revokeの権限主体
- Demo動画内で表示可能なdashboard範囲
- 40秒のアプリデモを4分ピッチへ組み込む場合の短縮原稿

