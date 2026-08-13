# 「18歳以上」を知りたいだけなのに、なぜ身分証を渡すのか — HumanProofを作った

本人確認が必要になるたび、私たちは同じような情報を別々のサービスへ渡しています。

氏名。正確な生年月日。住所。身分証画像。

しかし、そのサービスが本当に知りたいのは、本人情報一式ではないかもしれません。18歳以上か。実在する人か。一人一アカウントの条件を満たすか。必要なのは、特定の条件に対する答えだけという場面があります。

AI HACK 2026で、本人情報の要求を必要最小限の証明へ変えるPoC `HumanProof` を作りました。HumanProofは、長期構想`IAMme`の最初の動く断面です。

## 最初のデモは、動くけれどプロダクトになっていなかった

最初の版では、来訪者に次を入力させていました。

- サービス名
- audience / slug
- サービスの目的と現在の運用
- 現在要求している本人情報のカテゴリ

AIが文章を読み、4つの本人情報を2つのClaimへ変換する。その後、同意、発行、検証、失効まで動きます。

APIの動作確認としては正しい。しかし公開デモとしては、来訪者が導入企業、一般利用者、Issuer、Verifierを一人で演じる構成でした。

「私はいま誰なのか」「VALIDになって、何ができたのか」が分からない。説明文を足しても、役割の混線は直りませんでした。

## 入口を、映像作品ECの購入画面へ変えた

新しいデモでは、まずIAMmeのデモアカウントを作り、Demo Trusted Issuerによる属性確認を利用者自身が操作します。元確認はPoCのため模擬です。その後、確認済みProofを持った状態で、架空の18歳以上向け映像作品EC`NIGHT SCREEN`へ進みます。

購入の最後に、年齢確認方法を選びます。

- 従来の確認例: 氏名、正確な生年月日、住所、身分証画像をサービスへ渡す
- HumanProof: `over_18`と`human_verified`だけを共有する

HumanProofを選ぶと、共有する2つのProof（`over_18` / `human_verified`）と、サービスへ渡さない4項目が同じ画面に出ます。利用者が確認して同意すると、Demo Trusted Issuerが短い有効期限を持つ署名付きProofを発行します。

NIGHT SCREENは、署名、発行者、宛先、有効期限、失効状態を検証します。

大切なのは、その後です。

HumanProof内で`VALID`と表示して終わらず、NIGHT SCREENへ戻り「購入が完了しました」と表示します。利用者が欲しいのは暗号状態の成功ではなく、ECで目的を完了できることだからです。

## AIは、利用者の本人情報を読まない

HumanProofのAIは、身分証を読んで人を判定するものではありません。

読むのは、サービス側の目的と現在の運用です。

```text
We operate an 18+ service and need to confirm
each member is a real human over 18.
We currently ask for full name, exact date of birth,
home address and ID photo.
```

AIは、要件を許可済みClaim Catalogへ写像します。

```json
{
  "required_claims": ["over_18", "human_verified"]
}
```

この分析はAI Policy StudioからOrcaRouterを経由して実行します。resolved model、latency、request IDは実レスポンスだけを監査情報として表示します。

実名、住所、生年月日、ID番号などの値を検出した場合は、AIへ送る前にブロックします。AIへ送るのはサービスの目的文と正規化されたカテゴリ名です。

## 「18歳以上」なら、AIはいらない

ここは誤魔化せません。

18歳以上なら`over_18`を要求する。この一例だけならルールで十分です。

AIを使うのは、サービス導入時のPolicy設計です。現実の要件には、複数の目的が混ざります。

- 年齢確認には、正確な生年月日や身分証原本を利用サービスへ渡さなくてよい
- 配送には住所が必要になる
- bot対策と複数アカウント対策は別の目的かもしれない
- 「安全のため全部必要」だけでは、何を証明すべきか決められない

AIは文章から目的を分け、許可済みClaimだけを使ったPolicy案を作ります。根拠が足りなければ、勝手にClaimを確定せず確認へ戻します。

Policyは導入時に保存します。利用者が購入・利用するたびにLLMを呼ぶ設計にはしません。

## Proofのライフサイクルも実装した

デモで発行するProofは、見た目だけの成功表示ではありません。

- Ed25519署名
- audienceごとのpairwise subject
- サーバが固定する短い有効期限
- signature / issuer / audience / expiry / revocationの検証
- 状態異常時のfail-closed

発行時には、保有者だけへ秘密のrevocation codeを返します。このコードで失効した後、同じProofを再検証すると`REVOKED`になります。Proofを見せられただけのサービスは失効できません。

永続的な同意撤回と再提示停止は、今回のPoCでは未実装です。実装済みのProof失効と混同しないよう、画面でも分けています。

## 「個人情報ゼロ」とは言わない

`over_18`や`human_verified`も、個人に関する属性です。

HumanProofは匿名化を提供するものでも、個人情報を完全になくすものでもありません。目指しているのは、正確な生年月日や身分証原本を利用サービスごとに複製する代わりに、その場に必要な範囲の証明へ開示を絞ることです。

価値は「ゼロ」ではなく「最小化」にあります。

## 実装済み、模擬、未実装

実装済み:

- OrcaRouter経由のService Requirement分析
- AI送信前のPII値ブロック
- 固定Claim Catalogとschema validation
- 明示同意
- 署名付き・短命のProof
- pairwise subject
- 検証、失効、再検証、fail-closed

模擬:

- Demo Trusted Issuerによる属性の元確認
- NIGHT SCREEN

構想・未実装:

- 実eKYC / JPKI
- 複数Trusted Issuer
- 永続的な同意管理
- Verified Avatar
- AI Agent Trust
- DID / VC完全準拠

## この先

IAMmeの出発点は、人がオンラインで自分を必要以上に晒さず、それでも必要な信頼を示せるようにすることです。

将来、人とAI Agentが同じネットワークで行動するとき、必要になる問いは増えます。

何者か。誰が許可したか。どの権限を持つか。誰のために動くか。いつまで有効か。失効可能か。

その答えを、必要最小限だけ証明する。

HumanProofは、その一番小さな実装です。
