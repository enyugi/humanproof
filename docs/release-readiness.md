# AI HACK 2026 Release Readiness

更新日: 2026-08-13

## 🔴 提出前に外部作業が必要

- [x] 現在の実装をmainへ反映し、Render本番へデプロイ
- [x] 本番URLで`/`、`/demo`、`/studio`がHTTP 200かつ現行内容であることを確認
- [x] 実OrcaRouterで酒類宅配の代表入力を実行し、`source=ORCAROUTER`、`response_model=gpt-4o-mini-2024-07-18`、`latency=5151ms`、request IDを確認
- [x] 実デモ画面から3分以内の720p動画を生成
- [ ] 動画を最終試聴し、必要なら本人ナレーションへ差し替え、YouTube限定公開URLを確定
- [ ] QiitaまたはZennへ記事を公開し、URLを確定
- [x] 公開前の秘密情報監査後にリポジトリをpublic化
- [ ] 提出フォームへ最終URLを入力し、期限前に送信

## 🟡 信頼性のため提出前に確認

- [x] 本番で`VALID → revoke → REVOKED`を完走
- [ ] PCと390pxで画像、改行、ボタン位置を確認
- [x] Demo Trusted Issuerの模擬表示が動画で読める
- [x] ピッチ、動画、README、記事が「2 Proof / 4 withheld」で一致
- [ ] Proof失効を「保有者の秘密コード」と説明
- [ ] 同意の永続管理を未実装と説明
- [ ] costを取得できない場合に数値を作っていない
- [x] 今回の公開確認ではRenderをwarm up済み。発表当日も開始前に再実施する
- [x] 現行実装・正本をMistralで技術再監査し、反証確認後`GO / Critical 0 / High 0`
- [x] 現行提出原稿・PitchをGeminiで日本語再監査し、`GO / Critical・High 0 / 修正提案 0`

## 🟢 完了

- [x] IAMme LP、HumanProof Guided Demo、AI Policy Studioを3ルートへ分離
- [x] `/demo`でIAMmeアカウント作成→模擬属性確認→EC購入→`VALID → REVOKED`を一続きで操作可能
- [x] ポスターと仕組み図をLPへ組込み
- [x] `/demo`で要件入力とAI呼び出しを排除
- [x] 実APIで`VALID`と`REVOKED`を確認
- [x] 390pxの最初の視野に`HumanProofを使う`を表示
- [x] 91テスト、typecheck、lint、production buildがgreen
- [x] 旧版に対するMistral / Gemini監査結果を履歴として保存
- [x] 現行の5段階デモへ6枚Pitchを更新し、目視・はみ出し検査に合格
- [x] 提出フォーム原稿、動画台本、ピッチ原稿、記事原稿を現行の5段階デモへ統一
- [x] 実画面9場面、実OrcaRouter結果、実`VALID / REVOKED`を使った2分54秒のレビュー動画を生成
