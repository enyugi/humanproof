# Gemini 最終横断監査 — 対応記録

実施日: 2026-08-13  
モデル: Gemini 3.5 Flash

## 現行版の日本語原稿再監査

体験変更後の提出フォーム原稿、3分動画台本、4分ピッチ原稿、Qiita / Zenn原稿、README、現行6枚Pitchの全テキストをGeminiへ再提示した。技術監査はMistralへ分離し、Geminiには次だけを依頼した。

- 直訳調、抽象語の連続、重複、助詞、改行、用語統一
- IAMme / HumanProof / NIGHT SCREEN / Demo Trusted Issuerの関係
- `2 Proof / 4 withheld`とAI利用地点の一貫性
- 誇張表現の有無
- 3分動画、4分Pitchとして読み切れる密度

最終回答:

`GO — Critical / High 0、修正提案 0件`

Geminiは、日本語表現、主要な境界、誇張の排除、想定時間配分が校閲基準を満たしており、提出前の追加修正は不要と判定した。

### Zenn改稿の日本語再校閲

Issuer側で年齢を確認する処理と、HumanProofのAIがサービス要件を最小Proofへ整理する処理を混同していた旧稿を全面改稿した。Geminiは、三つの役割を示す表と酒類宅配の具体例により旧稿の誤解が解消されたと判定した。

結果: `GO / confusionResolved=true`

## 旧版に対する横断監査履歴

> **履歴記録:** この監査後に、`/demo`へIAMmeアカウント作成と模擬属性確認を追加する体験変更を行った。以下のGO判定は当時の提出物に対するものであり、現行版の最終GO判定ではない。現行版は再監査後に提出可否を判断する。

正本、現行実装、テスト、README、提出原稿、Pitchテキストを横断して、AI HACK 2026の8審査項目、数値・用語・実装境界、旧資料の誤認リスクを監査した。

## 初回判定

`CONDITIONAL GO` — 36.0 / 40.0

Critical / Highは次の3件だった。

1. 日本語の一般的な名字を含む組織名までPIIとして止める可能性がある。
2. ルートREADMEから旧検討資料の除外宣言が見えない。
3. Proof APIの一時障害時に、利用者へ再試行方法が示されない。

## 対応

- 名字辞書単体のPII検知を削除した。ラベル付き氏名、敬称付き氏名、英語文脈による検知は維持した。
- `佐藤商店`と`山本ビル`を通し、`氏名：山田太郎`と`山田さん`を止める回帰テストを追加した。
- ルートREADMEに、`chatgpt-rework/`と`HumanProof/99_REFERENCE/`を現行仕様として使用しない旨を明記した。
- Proof発行・失効エラー時に、再試行とページ再読込を案内するようにした。
- `実在する人`へ日本語表記を統一した。
- 91 / 91 tests、typecheck、lint、production buildが合格した。

Render Freeのfilesystemは書込不能ではなく、再起動・spin-downで失われるephemeral storageである。3分の一本道デモは同一稼働中に完結する。長期永続はPoCの主張外とし、発表前warm-upを提出前チェックに残した。

実モデルによりPolicy Studioの推奨Proof数が変動し得るというMedium指摘は、Guided Demoの`2 Proof / 4 withheld`と矛盾しないため変更しなかった。Guided Demoは審査用に保存した固定Policyを使い、Policy Studioは別の導入者向けAI分析だからである。

## 修正後再監査

`GO`

Geminiは、前回のCritical / Highがすべて修正・明記され、提出可能な品質に達したと判定した。
