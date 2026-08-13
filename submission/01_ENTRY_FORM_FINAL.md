# AI HACK 2026 提出フォーム用原稿

## プロダクト名

HumanProof

## 上位ブランド

IAMme

## 一言説明

本人情報の要求を、必要最小限の証明へ変えるTrust Layer。

## 概要・短文

18歳以上か確認したいだけなのに、氏名、生年月日、住所、身分証画像までサービスへ渡す。HumanProofは、利用者の同意のもと「18歳以上」「実在する人」といった必要な署名付き証明だけを共有するPoCです。

## 概要・標準文

HumanProofは、本人情報の要求を、そのサービスに必要な最小限の証明へ変えるTrust LayerのPoCです。デモではIAMmeアカウントを作り、Demo Trusted Issuerによる属性確認を操作してから、架空の18歳以上向け映像作品EC「NIGHT SCREEN」で購入します。属性の元確認だけは模擬です。購入時は「18歳以上」「実在する人」だけを共有し、氏名、正確な生年月日、住所、身分証画像をECへ渡しません。Proofは署名、発行者、宛先、有効期限、失効状態を検証でき、失効後の再検証では`REVOKED`になります。

## 解決する課題

年齢確認などのたびに、目的以上の本人情報や身分証原本が複数サービスへ複製されます。利用者には漏洩や悪用への不安、事業者には保管コスト、漏洩時の影響、利用離脱、過剰取得の説明負担が残ります。必要な条件と、収集する情報の粒度が一致していないことが課題です。

## 解決策

利用サービスへ本人情報の原本を渡す代わりに、Trusted Issuerが確認した属性のうち、その目的に必要な署名付きProofだけを共有します。NIGHT SCREENの例では、4つの本人情報ではなく`over_18`と`human_verified`の2つだけを受け取ります。

## AIの使い方

AIは利用者や身分証を判定しません。サービス導入時に、自然言語で書かれた目的、現在運用、取得カテゴリを読み、許可済みClaim Catalogに制約されたPolicy案を作ります。定型の18歳確認だけならルールで足ります。AIは複数目的や曖昧な規約文を扱うPolicy設計を支援し、根拠が足りない場合は自動採用せず確認へ戻します。購入・利用時には保存済みPolicyを使い、LLMを呼びません。

## OrcaRouterの使い方

AI Policy StudioからService Requirement分析を実際にOrcaRouter経由で呼び出します。レスポンスのprovider、resolved model、latency、request IDをactual-onlyの監査情報として表示します。costがレスポンスに無い場合は作らず、OrcaRouterのrequest logを参照します。

## セキュリティ

- 本人情報の実値を検出した入力はAI送信前にブロック
- AIへ送るのはサービス目的文と正規化されたカテゴリ名
- AI出力は固定Claim Catalogとschemaで制約
- 明示同意後にのみ署名付きProofを発行
- audienceごとのpairwise subject
- サーバ固定の短い有効期限
- signature / issuer / audience / expiry / revocationを独立検証
- 状態異常時はfail-closed
- 発行時に保有者へ返す秘密コードによる失効

## 独自性

本人確認書類を読むAIではなく、「サービスが本当に必要とする証明は何か」を設計するAIとして置いた点です。一般利用者のGuided Demoと、導入者向けAI Policy Studioを分離し、AIは導入時、保存済みPolicyとProofは利用時という責務分担にしています。

## ビジネス価値仮説

利用者は、必要以上に自分を晒さずサービスを利用できます。事業者は、収集・保管する本人情報を減らし、管理コスト、漏洩時の影響、利用離脱、過剰取得の説明負担を抑えられる可能性があります。企業需要と支払意思は未検証で、次の検証対象です。

## 実装済み

OrcaRouter分析、PII Shield、Claim制約、明示同意、Ed25519署名、pairwise subject、audience、有効期限、検証、失効、再検証、fail-closed永続。

## 模擬

NIGHT SCREEN、Demo Trusted Issuerによる年齢・実在性の元確認。

## 構想・未実装

実eKYC / JPKI、複数Trusted Issuer、永続的な同意管理、Verified Avatar、AI Agent Trust、DID / VC完全準拠。

## 注意書き

HumanProofは匿名化、個人情報ゼロ、法的・規制上の適合を主張しません。属性Proofも個人に関する情報です。目的に必要な範囲へ開示を絞ることを目指します。
