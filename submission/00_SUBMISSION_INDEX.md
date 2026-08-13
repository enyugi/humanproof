# IAMme / HumanProof — AI HACK 2026 提出パッケージ

更新日: 2026-08-13

このフォルダを提出原稿の正本とする。数値・実装境界・操作順は、公開サイトの現行実装と統一している。

## 提出物

1. `01_ENTRY_FORM_FINAL.md` — 提出フォーム用原稿
2. `02_DEMO_VIDEO_SCRIPT_FINAL.md` — 3分デモ動画台本
3. `03_PITCH_SCRIPT_FINAL.md` — 4分ピッチ原稿と想定問答
4. `04_QIITA_ZENN_FINAL.md` — Qiita / Zenn投稿原稿
5. `HumanProof_AI_HACK_2026_FINAL_v2.pptx` — 現行5段階デモへ同期した6枚のピッチ資料
6. `05_MISTRAL_FINAL_REVIEW.md` — 最終提出監査と対応記録
7. `06_GEMINI_FINAL_REVIEW.md` — 正本・実装・提出物の横断監査とGO判定
8. `HumanProof_AI_HACK_2026_DEMO_VIDEO_v1.mp4` — 実デモ画面を使った2分54秒の720pレビュー動画
9. `07_VIDEO_PRODUCTION_NOTES.md` — 動画の素材、実装境界、差替え・公開手順

GitHub公開用READMEはリポジトリ直下の `README.md` を使用する。

`HumanProof_AI_HACK_2026_FINAL.pptx`は体験変更前の履歴版。提出には`FINAL_v2`を使用する。

## URL

- LP: `https://humanproof.onrender.com/`
- Guided Demo: `https://humanproof.onrender.com/demo`
- AI Policy Studio: `https://humanproof.onrender.com/studio`
- 公開リポジトリ: `https://github.com/enyugi/humanproof`
- デモ動画: `https://youtu.be/Zr59tJ3ceO4`（YouTube限定公開）
- Zenn: `https://zenn.dev/enyugi/articles/b5a703567eec46`

## 全提出物で固定する事実

- **IAMme**: 長期プロダクト／上位構想
- **HumanProof**: IAMmeのNOWに位置するAI HACK 2026 PoC
- **NIGHT SCREEN**: 架空の18歳以上向け映像作品EC。模擬
- **Demo Trusted Issuer**: 属性の元確認だけが模擬。署名処理は実装済み
- NIGHT SCREENへ共有する証明: `over_18` / `human_verified` の2つ
- NIGHT SCREENへ渡さない項目: 氏名 / 正確な生年月日 / 住所 / 身分証画像の4つ
- `/demo`の購入時にはLLMを呼ばない。保存済みデモPolicyを使う
- 実OrcaRouter分析は `/studio` で行う
- Proof失効は、発行時に保有者へ返す秘密の `revocationCode` を使う
- 同意の永続管理と再提示停止は構想・未実装
- 実eKYC / JPKI / 複数Issuer / AI Agent Trustは未実装

## 禁止する説明

- 個人情報ゼロ、完全匿名、漏洩リスクゼロ
- AIでなければ不可能
- 実eKYC接続済み、GDPR準拠、世界初、競合不在
- Issuer専用の失効APIであるという説明
- 利用者の購入・利用ごとにAIが判断するという説明
