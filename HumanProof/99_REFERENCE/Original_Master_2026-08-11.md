# HumanProof（仮称）
## AI HACK 2026向け 要件・全体構想・将来方針

**作成日:** 2026-08-11  
**用途:** AI HACK 2026の開発・ピッチ・デモ動画・Qiita/Zenn記事・将来の事業検討に共通して使う上位整理資料  
**ステータス:** 構想整理版。サービス名「HumanProof」は仮称。  
**開発前提:** 非エンジニアのマーケター1名で参加し、実装は主にClaude Codeへ任せる。ChatGPTは要件整理、UX、コピー、プロンプト、評価、資料化、提出物設計を担当する。

---

# 0. この資料で最優先に守ること

1. 今回の開発物を「本人確認サービス」だけに縮小しない。
2. 一方で、巨大なIdentity PlatformをAI HACK期間中に実装しようとしない。
3. **未来構想と今回のMVPを明確に分ける。**
4. 今回のMVPは、将来構想の中で最も小さく、最も価値を説明しやすい断面を実装する。
5. 本物の公的本人確認・JPKI・eKYC・顔認証・ライブネス等を実装したように見せない。
6. ハッカソンではDemo Trusted Issuerを使用し、「認証済み属性が既に発行されている」状態を模擬する。
7. LLMに本人確認そのものをさせない。
8. AIは「このサービスに必要な証明は何か」「何を渡さなくてよいか」を提案する役割とする。
9. OrcaRouterは単なる利用条件消化ではなく、AI判断・コスト・監査・セキュリティを支える本番志向の基盤として使う。
10. 「できていること」「デモ上の模擬」「将来構想」「事業仮説」を必ず区別する。

---

# 1. AI HACK 2026の前提

## 1.1 テーマ

**本番で通用する次世代のAI Product**

## 1.2 審査項目

8項目、各5点、合計40点。

1. 課題の実在性
2. ビジネス成立性
3. 完成度・デモの説得力
4. AIである必然性
5. 技術的な作り込み
6. LLMコスト
7. セキュリティ
8. 次世代性・独創性

## 1.3 提出

**締切：2026年8月15日 15:00**

提出物：

- GitHubリポジトリ、またはソースコード
- 3分以内のデモ動画
- QiitaまたはZennの記事

GitHubの場合はPublic Repository。  
デモ動画はYouTube限定公開リンク。  
最終プレゼンは上位8チーム、4分プレゼン＋3分質疑。

## 1.4 OrcaRouter

今回のプロダクトではOrcaRouterを必須利用する。

スポンサー説明資料上の主な特徴：

- 1つのAPIで多数のLLMを扱う
- プロンプト難易度等に応じたモデルルーティング
- 品質優先／コスト優先／バランス／auto
- フェイルオーバー
- PII Shield
- Agent Firewall
- 異常検知
- リクエスト単位の使用モデル・原価・レイテンシ等のログ
- 既存OpenAI互換APIから比較的簡単に切替可能

今回の価値は「OrcaRouterそのものを作る」ことではなく、**HumanProofのAI判断を本番志向で運用するための基盤として利用すること**にある。

---

# 2. プロダクトの一言定義

## 2.1 最もシンプルな説明

> **「あなたが誰か」を教えなくても、必要な条件だけ証明できる。**

たとえば、あるサービスが知りたいのが「18歳以上か」だけなら、

- 本名
- 正確な生年月日
- 住所
- 運転免許証画像
- 顔写真

まで渡す必要はない。

HumanProofでは、

- Verified Human
- Over 18

という**必要な事実だけ**を共有する。

---

# 3. 現在の身近な課題

## 3.1 典型例：年齢確認

ユーザーがあまり信用していないWebサービスから、

> 「18歳以上であることを確認するため、運転免許証をアップロードしてください」

と言われる。

しかし免許証には、サービス側が本来必要としていない情報まで含まれる。

- 氏名
- 生年月日
- 住所
- 顔写真
- 免許証番号等

サービスが本当に必要としているのが、

> 「この利用者は18歳以上か」

だけなら、これらを丸ごと渡すのは過剰である。

## 3.2 HumanProofの場合

```text
信頼できる本人確認元
        ↓
本人確認・属性確認
        ↓
「本人確認済み」
「18歳以上」
という証明
        ↓
HumanProof
        ↓
サービスA

サービスAが受け取るもの：
✓ Verified Human
✓ Over 18

受け取らないもの：
× 氏名
× 住所
× 正確な生年月日
× 運転免許証画像
× 顔写真
```

サービス側も不要な個人情報を保有しなくて済む。

---

# 4. 分かりやすい利用例

## 4.1 18歳以上限定コミュニティ

条件：

- 実在する人間
- 18歳以上

共有：

- ✓ Verified Human
- ✓ Over 18

非共有：

- × 本名
- × 正確な年齢
- × 生年月日
- × 住所
- × 顔画像

---

## 4.2 ファン投票

運営が確認したいこと：

- 人間による投票か
- 1人が大量の複数アカウントで投票していないか

共有候補：

- ✓ Verified Human
- ✓ Unique Person / One-person proof

不要：

- × 誰がどのキャラクターへ投票したかに紐づく実名
- × 住所
- × 顔画像

---

## 4.3 ペンネームで活動するクリエイター

公開表示：

```text
NEKO
✓ Verified Human
✓ Verified Creator
```

公開しない：

- 本名
- 住所
- 本人確認書類

裏側では信頼できる本人確認元によって実在人物との関係が確認されている。

---

## 4.4 将来：AI Agent

将来的には、

- Verified Human
- AI Agent
- Human-operated AI
- Authorized Avatar
- Verified Organization
- Verified Creator

等を区別する。

例：

> 「このAIエージェントは本当にA社から契約権限を与えられているのか？」

HumanProofが将来的に、

```text
AI Agent
   ↓
Authorized by
   ↓
Verified Human / Verified Organization
   ↓
Allowed action / scope / expiry
```

のような権限の証明まで扱えるようにする。

---

# 5. なぜ「次世代AIプロダクト」なのか

## 5.1 今後のインターネット

オンライン上で次が混在していく。

- 人間
- BOT
- 自律型AI Agent
- 人間が操作するAI
- アバター
- AIキャラクター
- 企業AI
- 人間の代理として行動するAI

今後は単に、

> 「この人の名前は何か」

だけでは信用を作れない。

必要になる問いは、

> **これは何者なのか？**
>
> **誰の権限で動いているのか？**
>
> **何をする権限があるのか？**

へ変わる可能性がある。

## 5.2 将来のHumanProof

HumanProofの長期Vision：

> **人間とAIが共存するインターネットのTrust Layer**

人間の実名を何でも公開するのではなく、

- Humanである
- 成人である
- この企業に所属している
- この資格を持つ
- このクリエイター本人である
- このAI Agentはこの人・企業から権限を与えられている
- このAvatarは認証済み本人に紐づく

といった**必要な証明だけを扱う。**

---

# 6. 最大の論点：「誰がその認証を信用するのか」

HumanProofが自分で、

> 「この人は18歳以上です」

と言うだけでは信用にならない。

必要なのは**信用の鎖（Trust Chain）**である。

## 6.1 将来の基本構造

```text
Trusted Issuer
公的ID / eKYC / 企業 / 大学 / 資格団体 等
        ↓
署名された証明
        ↓
HumanProof / User Wallet
        ↓
必要な属性だけ提示
        ↓
Verifier / Service
        ↓
署名・期限・失効・Issuerを検証
```

## 6.2 Verifier側が確認すること

- 誰が証明を発行したか
- そのIssuerを自社は信頼するか
- 改ざんされていないか
- 有効期限内か
- 失効していないか
- 自分のサービス向けに発行されたProofか
- 本当に要求した属性だけが含まれているか

## 6.3 AI HACKでの扱い

今回、本物の公的Issuer接続は作らない。

**Demo Trusted Issuerを固定で用意する。**

例：

```text
Demo Trusted Issuer

human_verified = true
over_18 = true
issuer = demo.humanproof
issued_at = ...
expires_at = ...
```

画面上にも、

> Hackathon prototype: identity verification is simulated.  
> Production version will connect to certified eKYC / public identity providers.

等と明示する。

今回検証するのはeKYC技術そのものではなく、

> **認証済み属性を、必要最小限だけ、安全に第三者サービスへ提示する体験**

である。

---

# 7. 今回のMVP

## 7.1 MVPの一文

> **サービス事業者が利用条件を自然言語で入力すると、AIが必要最小限の証明属性を提案し、ユーザーは個人情報そのものを渡さず、条件を満たしている証明だけ共有できるWebプロトタイプ。**

## 7.2 今回の一本道

```text
[1] User has HumanProof ID
        ↓
[2] Service enters its requirement in natural language
        ↓
[3] OrcaRouter経由でAIが分析
        ↓
[4] 必要なProof / 不要な個人情報を提案
        ↓
[5] User consent
        ↓
[6] 短時間有効のSigned Proof発行
        ↓
[7] Service verifies it
        ↓
[8] Valid / Expired / Revokedを確認
```

---

# 8. MVP画面

## 8.1 Home

仮コピー：

> **Prove what matters. Not everything about you.**

入口：

- I am a User
- I am a Service

---

## 8.2 Human ID

例：

```text
Human ID
HP-2026-0001

✓ Human Verified
✓ Over 18
○ Verified Creator
○ Verified Organization

Real Name
Private

Verification valid until
2027-08-11
```

注意：

- 本人確認自体はDemo Issuerによる模擬
- 実名等の生データをMVPの中心データにしない
- Verificationには期限を持たせる

---

## 8.3 Service Requirement

サービス事業者が自然言語で入力する。

例：

> 18歳以上の実在する人間だけ参加できるオンラインコミュニティです。不正な複数アカウントを防ぎたいです。

ボタン：

`Analyze requirements`

---

## 8.4 AI Recommendation

OrcaRouter経由でAIが提案。

例：

```text
Recommended Proof Request

Required
✓ Verified Human
✓ Over 18

Optional
○ Unique person proof

Not necessary
× Full name
× Exact date of birth
× Address
× Face image

Reason:
This service needs human presence and age eligibility,
but does not need civil identity.
```

重要：

**AIが最終的な法的判断を自動決定するのではない。**

サービス事業者への「最小開示案」の提案とする。

---

## 8.5 Consent

ユーザー側：

```text
Example Community wants to verify:

✓ You are a verified human
✓ You are over 18

They will NOT receive:

× Your real name
× Your exact age
× Your date of birth
× Your address
× Your face image

[Share proof]
[Decline]
```

HumanProofのUX価値を最も分かりやすく見せる画面。

---

## 8.6 Issued Proof

例：

```text
HUMANPROOF

✓ VERIFIED HUMAN
✓ OVER 18

Issued: 2026-08-11
Expires: 2026-08-11 10:30
Proof ID: HP-X7K92...

Personal information shared:
NONE
```

Proofに含める最小候補：

- proof_id
- issuer
- audience
- claims
  - human_verified
  - over_18
- issued_at
- expires_at

MVPでは短命の署名付きトークン等を利用する。

---

## 8.7 Verify Proof

サービス側：

```text
PROOF VALID

✓ Signature valid
✓ Trusted issuer
✓ Not expired
✓ Not revoked
✓ Verified Human
✓ Over 18

Personally identifiable information received:
NONE
```

無効ケースも表示できるようにする。

- Expired
- Revoked
- Invalid signature
- Wrong audience

---

## 8.8 Revoke

ユーザーまたはIssuer側がProofを失効させる。

目的：

- 「認証済み」を永久状態にしない
- デモでTrustの運用性を見せる

---

## 8.9 AI / Cost Audit

例：

```text
AI Decision Audit

Route
OrcaRouter

Model
[actual model]

Latency
[actual]

Cost
[actual]

Requested claims
2

PII shared with service
0
```

可能であればOrcaRouter側の実ログもデモ動画で見せる。

---

# 9. OrcaRouterの役割

今回、OrcaRouterを何箇所も無理に使わない。

中心用途：

```text
サービス事業者の自然言語要件
        ↓
OrcaRouter
        ↓
LLM
        ↓
必要証明属性の提案
        ↓
HumanProof UI
```

## 9.1 AI出力のイメージ

```json
{
  "required_claims": [
    "human_verified",
    "over_18"
  ],
  "optional_claims": [
    "unique_person"
  ],
  "unnecessary_claims": [
    "full_name",
    "exact_birth_date",
    "address",
    "face_image"
  ],
  "reason": "..."
}
```

## 9.2 OrcaRouterを使う意味

- 適切なモデルへルーティング
- LLMコスト管理
- ログによる監査
- PII Guardrail等のセキュリティ
- 将来モデルを差し替えてもプロダクト側を大きく変えない
- 本番運用を意識した構成

## 9.3 AIにやらせないこと

- 顔を見て本人と断定
- 公的本人確認の代替
- 法律上必須の本人確認項目を勝手に決定
- ユーザーの属性をLLMだけで推測
- 自動拒否を永久確定

---

# 10. 今回実装しないもの

AI HACK MVPでは以下を実装しない。

- マイナンバーカード読取
- JPKI
- 本番eKYC
- 運転免許証OCR
- 顔照合
- ライブネス
- 生体情報の本格管理
- OpenFGA
- AWS本番移行
- Cognito
- Verifiable Credentials完全実装
- 分散ID
- 本格SSO
- モバイルアプリ
- Zoom / Teams / Meet連携
- 3Dアバター
- TalkingHead
- 決済
- NFT
- AI Agent認証の本実装

これらは将来構想または別フェーズ。

---

# 11. 元の共通Identity構想との関係

既存構想では「認証」を4層へ分離して考えている。

1. ログイン認証
2. 本人確認
3. 属性証明
4. 権限管理

HumanProofはこの考え方を維持する。

特に、

- 本人確認済みを単一booleanで全て表現しない
- Verified Attributeを分離する
- 証明には有効期限・失効を持たせる
- 各サービスには必要な属性だけ開示する
- 認証元と利用サービスを分離する

ことを重要な設計原則とする。

---

# 12. 認証付きアバターとの関係

アバター構想は廃止しない。

ただしHumanProofの本体ではなく、将来の**表示・利用形態の一つ**と整理する。

## 12.1 将来のVerified Avatar

> 生顔を公開しなくても、認証済み本人としてオンラインに存在できる。

将来：

```text
Verified Human
      ↓
Authorized Avatar
      ↓
Zoom / Meet / Teams / Discord / Event
```

証明候補：

- 生成元本人
- 本人確認済み
- アバター利用権
- 端末認証済み
- AI限定補正
- 証明書有効
- 失効していない

## 12.2 AI HACKでの扱い

Core MVPが十分早く完成した場合のみStretch Goalとして検討。

最初から開発範囲へ入れない。

---

# 13. 将来ロードマップ

## Phase 0：AI HACK Prototype

- Demo Trusted Issuer
- Human ID
- Verified Human / Over 18
- Service Requirement
- OrcaRouter AI Recommendation
- Selective Disclosure UX
- Consent
- Signed Proof
- Verify
- Expiry / Revocation
- AI/Cost Audit

---

## Phase 1：実Identity接続

- 外部eKYC
- 公的本人確認手段の調査・接続
- 本人確認Provider abstraction
- 複数Issuer
- Issuer trust policy
- Verification Ledger
- 証明更新・失効

---

## Phase 2：属性証明

- Age
- Organization
- Creator
- Professional qualification
- Student
- Rights holder
- Employment
- その他サービス固有属性

---

## Phase 3：Verified Avatar

- 認証済み本人アバター
- 限定補正
- アバター利用権
- 更新・失効
- 会議・配信サービス利用

---

## Phase 4：Human / AI Trust Layer

- Verified Human
- Verified Organization
- Verified Creator
- AI Agent
- Human-operated AI
- Authorized Avatar
- Authorized AI Agent

---

## Phase 5：Agent Authorization

AI Agentに対し、

- 誰が所有・管理しているか
- 誰から権限を受けたか
- 何ができるか
- 金額上限
- 操作範囲
- 利用期限
- 失効

等を証明する。

例：

```text
Agent A
✓ Authorized by Company X
✓ Can schedule meetings
✓ Can purchase up to ¥10,000
× Cannot sign contracts
Valid until: ...
```

---

## Phase 6：外部Trust Infrastructure

将来的には、

> 「Sign in / Verify with HumanProof」

のような外部利用へ拡張。

候補：

- オンラインコミュニティ
- ファンコミュニティ
- クリエイタープラットフォーム
- 求人・採用
- フリーランス
- オンラインイベント
- 投票
- 年齢制限サービス
- クラウドファンディング
- B2Bサービス
- AI Agentサービス

---

# 14. ビジネスモデル仮説

**未検証。現時点では確定しない。**

候補：

- Verification従量課金
- API利用料
- 月額SaaS
- 法人プラン
- 証明書発行・更新料
- 高度な企業・資格認証
- SDK
- White Label
- 不正対策オプション

重要：

AI HACKでは市場規模を過大に断定しない。

まずは、

> 個人情報を相手へ過剰提供せず、必要な条件だけ証明したい場面が存在する

ことを課題仮説として示す。

その後、

- 年齢確認
- コミュニティ
- 投票
- クリエイター
- 採用
- AI Agent

のどこから市場に入るべきか検証する。

---

# 15. HumanProofの価値

## ユーザー側

- 不要な個人情報を渡さなくてよい
- 本人確認書類を多数の事業者へ配布しなくてよい
- 本名を出さずに必要な属性を証明できる
- 何を共有するか確認して同意できる

## サービス事業者側

- 不要なPIIを保有しなくて済む
- 本当に必要な条件だけ確認できる
- Proofの期限・失効を検証できる
- 将来的には複数Issuerを利用できる
- BOT・複垢・なりすまし等への対策へ発展可能

## AI時代

- HumanとAIを区別
- AIが誰から権限を得たかを証明
- Avatarが本人に紐づくことを証明
- 「正体全部の開示」から「必要なTrustだけ提示」へ移行

---

# 16. ピッチの中心メッセージ

## 16.1 現在の課題から入る

> 本人確認のために、知らないサービスへ運転免許証や顔写真を渡したことはありませんか？

↓

> でも、そのサービスが本当に必要なのは、あなたの住所や正確な生年月日まででしょうか？

↓

> 成人確認なら、必要なのは「18歳以上」という事実だけです。

↓

> **HumanProofは、個人情報そのものではなく、必要な証明だけを渡します。**

## 16.2 AI時代へ広げる

> そしてAI Agentが人間と同じようにオンラインで活動する時代には、さらに新しい問題が起きます。

↓

> 「これは人間か？」
> 「AIか？」
> 「誰の権限で動いているのか？」

↓

> **HumanProofを、人間とAIが共存するインターネットのTrust Layerへ。**

---

# 17. 今回のデモで必ず伝えること

1. 本人確認そのものはHackathon用Demo Issuerである。
2. AIが本人確認をしているわけではない。
3. AIは「必要最小限の属性」を提案する。
4. ユーザーが最終的に共有へ同意する。
5. サービスには生の本人確認書類を渡さない。
6. Proofには期限がある。
7. Proofは失効できる。
8. サービス側で署名・期限・失効を検証する。
9. OrcaRouterを実際に利用している。
10. OrcaRouterのコスト・モデル・レイテンシ等を実測で示す。

---

# 18. AI HACK審査8項目への対応方針

## 1. 課題の実在性

身近な例：

- 運転免許証等の本人確認書類を信用度の分からないサービスへ提出する不安
- 年齢確認なのに過剰な個人情報を渡す
- 各サービスがそれぞれ本人確認データを保有する

ただし、具体的な市場ニーズの大きさは別途検証する。

## 2. ビジネス成立性

B2B API / Verification / SaaS等の可能性を提示。  
AI HACKでは断定せず、初期ユースケースと課金仮説を示す。

## 3. 完成度・デモ

3分で一本道が理解できることを優先。

## 4. AIである必然性

サービス事業者の自然言語要件をAIが理解し、必要最小限の証明属性を提案。

## 5. 技術的作り込み

- Demo Issuer
- Signed Proof
- Expiry
- Revocation
- Audience
- Verification
- OrcaRouter integration
- Structured AI output

## 6. LLMコスト

OrcaRouterの実測ログを提示。

## 7. セキュリティ

- PII最小化
- 不要属性を共有しない
- Proof expiry
- Revocation
- PII Shield等
- 生の本人確認書類をサービスへ渡さない思想

## 8. 次世代性・独創性

Human / AI Agent / Human-operated AI / Authorized Avatar / Organization等が混在する世界のTrust Layerへ発展するVision。

---

# 19. 開発と資料作成の役割分担

## Claude Code

担当：

- Webアプリ実装
- DB
- API
- Signed Proof
- Verification
- Expiry
- Revocation
- OrcaRouter API integration
- UI実装
- テスト
- GitHub整理

Claude Codeには次の開発指示書で、画面・仕様・非対象・完成条件まで一式で渡す。

## ChatGPT

担当：

- プロダクト要件
- UX整理
- コピー
- AI Prompt
- Structured Output Schema
- テストケース
- セキュリティ整理
- 審査8項目対応
- 競合・市場調査
- ビジネスモデル検討
- Future Vision
- 4分ピッチ
- プレゼン資料
- 3分デモ動画構成
- ナレーション
- Qiita/Zenn記事
- GitHub README原稿
- 最終提出チェック

## ユーザー

- プロダクト判断
- 優先順位の最終決定
- 実デモ確認
- ピッチ
- 必要なアカウント作成等

非エンジニア1人参加であるため、ユーザーへ不必要なターミナル作業や技術判断を押し戻さない。

---

# 20. 今後の資料体系

本資料を上位正本とし、ここから目的別に派生させる。

1. **HumanProof_全体構想_要件_未来方針.md**
   - 本資料

2. **HumanProof_AI_HACK_ClaudeCode開発指示書.md**
   - 次に作成
   - 実装だけに必要な内容
   - 勝手なスコープ拡張禁止

3. **HumanProof_AI_HACK_Pitch.md**
   - 4分ピッチ
   - 6枚前後

4. **HumanProof_AI_HACK_DemoScript.md**
   - 3分動画
   - 画面遷移・ナレーション

5. **HumanProof_AI_HACK_Qiita_or_Zenn.md**
   - 開発背景
   - 技術構成
   - OrcaRouter
   - 今後

6. **HumanProof_AI_HACK_README.md**
   - GitHub用

7. 必要に応じて
   - 競合・市場調査
   - Trust / Issuer設計
   - 実eKYC導入調査
   - Verified Avatar
   - AI Agent Authorization
   を別資料化する。

---

# 21. 未検証・今後調べる事項

以下は現時点で確定していない。

- 最も強い初期市場がどこか
- ユーザーがどの程度この課題を感じているか
- サービス事業者が外部Proofをどの条件で信用するか
- 日本国内で接続可能な本人確認Provider
- 国際展開時の本人確認・年齢確認制度
- Verifiable Credentials等をどの段階で採用すべきか
- 既存Identity / Age Verification / Proof-of-Personhood系サービスとの差別化
- AI Agent Identity / Authorization市場の成熟度
- HumanProofという名称の利用可否・商標・ドメイン

市場性はハッカソンのコンセプト評価と分けて、別途シビアに検証する。

---

# 22. 現時点のプロダクト方針

## NOW

> **「あなたが誰か」を渡さず、必要な条件だけ証明する。**

AI HACKでは、

> **Verified Human + Over 18**

を代表ユースケースとして実装する。

## NEXT

- Verified Creator
- Verified Organization
- Verified Worker
- Verified Avatar
- Verified Qualifications

## FUTURE

> **人間とAIが共存するインターネットのTrust Layer**

- Human
- AI Agent
- Human-operated AI
- Authorized Avatar
- Organization

について、

> **何者か**
>
> **誰の権限で動いているか**
>
> **何をする権限があるか**

を必要最小限の情報で証明できる世界を目指す。

---

# 23. 現時点の短いコピー候補

### 説明用

> **あなたが誰かを教えずに、必要なことだけ証明する。**

### 英語

> **Prove what matters. Not everything about you.**

### 将来Vision

> **Trust infrastructure for a world of humans and AI agents.**

または

> **The Trust Layer for the Human + AI Internet.**

※名称・コピーは現時点では仮。ピッチ資料作成時に再検討する。

---

# 24. 参照した既存資料

今回の整理は、以下の既存資料・会話上の合意を基礎としている。

- `AI HACK 2026 Day1.pdf`
- `【最新】AI_HACK2026_OrcaRouter_deck_v2 (2).pdf`
- `02_認証_本人確認_共通Identity(1).md`
- `03_認証付きアバター生成.md`
- `本人認証アカウント基盤構想 追補資料`
- `本人認証付き・限定補正型アバター／デジタルプレゼンス企画 引き継ぎ資料`

特に既存構想から引き継いでいる主要原則：

- ログイン認証・本人確認・属性証明・権限管理を分離する
- 本人確認済みを永久状態にしない
- 有効期限・失効を持つ
- 必要な属性だけ開示する
- 実名と活動名を分離できる
- 一人一IDと複数の活動名を両立する
- 将来、人間・AI Agent・Human-operated AI・Authorized Avatar等を区別する
- アバター自体ではなく、本人認証アカウント／Trust Layerを中核資産とする

---

# 25. 次の作業

次に作成するもの：

> **Claude Codeへ最初に一度で渡す開発指示書**

その指示書では、

- MVPの完成条件
- 画面
- UI状態
- データモデル
- API
- OrcaRouter接続
- AI Prompt
- Structured Output
- Proof署名
- Expiry
- Revocation
- Verify
- Demo Issuer
- セキュリティ
- テスト
- GitHub構成
- 非対象
- 「勝手に機能を増やさない」制約

まで、実装開始前に固定する。

