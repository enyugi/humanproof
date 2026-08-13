# HumanProof デモ動画 — 制作・公開メモ

更新日: 2026-08-13

## 生成物

- ファイル: `HumanProof_AI_HACK_2026_DEMO_VIDEO_v1.mp4`
- 尺: 173.6秒（2分53.6秒）
- 画面: 1280 × 720
- 映像: H.264
- 音声: AAC / 日本語

## 使用した実画面

1. IAMme / HumanProof LP
2. IAMmeデモアカウント作成
3. Demo Trusted Issuerによる元確認（模擬）
4. 架空EC NIGHT SCREENでIAMmeを選択
5. 2 Proofを共有し、4項目を渡さない同意画面
6. 実APIの`VALID`
7. 実OrcaRouterによるPolicy Studio分析結果
8. 実APIの`REVOKED`
9. 実装済み / 模擬 / 構想・未実装の境界

Policy Studioでは、酒類宅配の代表入力を実OrcaRouterへ送り、5件の要求から`over_18`の1 Proofを推奨する結果を使用した。配送住所は本人証明ではなく業務上必要な入力として残し、氏名、身分証画像、電話番号を過剰候補として示している。

## 公開前の確認

- 冒頭から最後まで再生し、文字欠け、無音、音割れがないことを人の耳と目で確認する。
- 現在の音声はmacOSの日本語システム音声で作ったレビュー版。AIっぽい印象を避けるなら、同じ台本を本人の声で録音して差し替える。
- YouTubeへ「限定公開」でアップロードする。
- 公開URLを`00_SUBMISSION_INDEX.md`、提出フォーム、記事へ記入する。
- 本番URLの実行結果と動画内の画面が一致していることを最後に確認する。

## 誇張しない境界

- Demo Trusted Issuerの元確認は模擬。
- NIGHT SCREENは架空EC。
- 署名、発行、検証、期限、失効、OrcaRouter分析は実装・実行結果。
- 実eKYC、複数Issuer、AI Agent Trust、同意の永続管理は未実装。
