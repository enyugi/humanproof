# IAMme / HumanProof

**IAMme**は、本人性、属性、権限、同意、期限、失効を扱う長期的なTrust Layer構想です。**HumanProof**は、そのNOWに位置するAI HACK 2026向けPoCです。

> 本人情報の要求を、必要最小限の証明へ。

## 体験する

- `/` — IAMmeとHumanProofの関係、仕組み、実装境界、未来像
- `/demo` — 18歳以上向けEC「NIGHT SCREEN」の購入でHumanProofを使うGuided Demo
- `/studio` — サービス導入者向けAI Policy StudioとOrcaRouter監査

### Guided Demo

架空の18歳以上向け映像作品EC`NIGHT SCREEN`で、次の流れを操作できます。デモ内でIAMmeアカウントを作り、Demo Trusted Issuerによる属性確認も操作します。属性の元確認だけは模擬です。

1. IAMmeのデモアカウントを作る
2. Demo Trusted Issuerで属性確認を完了する（元確認は模擬）
3. NIGHT SCREENで`IAMmeで証明する`を選ぶ
4. 共有する2つのProofと、共有しない4項目を確認
5. 明示同意後、署名付きProofを発行
6. NIGHT SCREENが検証し`VALID`、購入完了
7. 発行時に保有者へ返された秘密コードでProofを失効
8. 再検証し`REVOKED`

共有するProof:

- `over_18`
- `human_verified`

NIGHT SCREENへ渡さない項目:

- 氏名
- 正確な生年月日
- 住所
- 身分証画像

Proofも個人に関する属性です。HumanProofは匿名化や「個人情報ゼロ」を主張しません。開示を目的に必要な範囲へ絞ります。

## AIの役割

定型の18歳確認だけならルールで実装できます。

HumanProofがAIを使うのは、利用者の購入・利用時ではなく、サービス導入時のPolicy設計です。自然言語で書かれた複数目的や曖昧な規約文を読み、許可済みClaim Catalogへ制約されたPolicy案へ変換します。

- 本人情報の実値を検出した入力はAI送信前にブロック
- AIへ送るのはサービス目的文と正規化されたカテゴリ名
- AI出力は固定Claim Catalogとschemaで制約
- 根拠が足りない場合は自動採用せずclarificationへ戻す
- 購入・利用時は保存済みPolicyを使い、LLMを呼ばない

分析は`/studio`からOrcaRouter経由で実行し、source / resolved model / latency / request IDをactual-onlyの監査情報として表示します。costがレスポンスに無い場合は作りません。

## Proofの実装

- Ed25519署名
- audience-bound Proof
- audienceごとのpairwise subject
- 明示同意と単回使用quote
- サーバ固定の短い有効期限
- signature / issuer / audience / expiry / revocationの独立検証
- 発行時に保有者だけへ返す秘密revocation code
- fail-closed永続

独自のコンパクトtoken形式であり、JWT / JWS / DID / VC準拠を主張しません。

## 実装境界

### 実装済み

- OrcaRouter分析と監査情報
- PII ShieldとClaim制約
- 明示同意
- 署名、検証、期限、失効、再検証
- fail-closed

### 模擬

- NIGHT SCREEN
- Demo Trusted Issuerによる`over_18` / `human_verified`の元確認

### 構想・未実装

- 実eKYC / JPKI
- 複数Trusted Issuer
- 永続的な同意管理と再提示停止
- Verified Avatar / Creator / Organization / Worker
- Human + AI Agent Trust
- DID / VC完全準拠

## ローカル実行

```bash
npm install
npm run dev
```

通常は`http://localhost:3000`で起動します。

実OrcaRouterを使う場合は`.env.local.example`を参考に`ORCAROUTER_API_KEY`をサーバ側へ設定してください。キーがない場合、AI Policy Studioは明示されたMOCK providerを使用します。Guided DemoのProof lifecycleはAI providerと独立しています。

## 品質ゲート

```bash
npm run typecheck
npm test
npm run lint
npm run build
```

現行実装では91テストがgreenです。

## 正本と提出資料

- 正本: `HumanProof/00_MASTER/`
- 要件: `HumanProof/04_DEVELOPMENT/Requirements.md`
- 提出原稿一式: `submission/`
- 提出前チェック: `docs/release-readiness.md`

### 旧検討資料について

`chatgpt-rework/`と`HumanProof/99_REFERENCE/`は、現在の体験・実装設計を確定する前の検討ログ／出典保存です。現行仕様として使用しません。最新の仕様は`HumanProof/00_MASTER/`、提出内容は`submission/`を参照してください。
