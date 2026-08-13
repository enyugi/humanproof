# Demo Structure — under 3 minutes

## 0:00–0:28 IAMmeアカウントと属性確認

IAMmeのデモアカウントを作り、Demo Trusted Issuerで`over_18` / `human_verified`の元確認を操作する。元確認のみ模擬と明示。

## 0:28–0:48 NIGHT SCREENで選ぶ

架空の18歳以上向け映像作品ECで、身分証アップロードではなく`IAMmeで証明する`を選ぶ。

## 0:48–1:35 共有確認、同意、署名、検証

`4 pieces of personal data → 2 proofs`を示し、共有する2 Proofと渡さない4項目を確認して明示同意。短命Proofを実APIで発行・検証する。

## 1:35–1:53 購入完了

NIGHT SCREENへ戻り、`VALID`と「購入が完了しました」を表示する。

## 1:53–2:23 AI Policy Studio

AIは購入時ではなく導入時に使うことを説明。OrcaRouter経由の分析で、実model / latency / request ID / cost or dashboard reference、identity data sent to AI = 0を表示。

## 2:23–2:43 失効と再検証

保有者へ返された秘密コードで失効し、同じProofの再検証で`REVOKED`を表示。

## 2:43–3:00 境界とFuture

実装済み／模擬／構想・未実装を分け、Agent authorizationへのFutureを一枚で示す。
