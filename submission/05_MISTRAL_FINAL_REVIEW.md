# Mistral 最終提出監査 — 対応記録

実施日: 2026-08-13

## 現行版の技術再監査

対象は、IAMmeアカウント作成から`VALID → REVOKED`までの現行5段階デモ、Proof API、Policy Studio、PII送信防止、テスト、正本、release checklist。日本語原稿の品質はGeminiへ分離し、Mistralには技術境界と破綻ケースだけを監査させた。

初回再監査では`Critical 2 / High 5`が提示されたが、コードに存在しない前提を含んでいたため、該当箇所を全文で再提示して反証確認を行った。

- 一時ファイルは書込み前に`0600`で作成している。
- 一度消費した署名付きquoteは、後段失敗時にも復活させない。復活はreplayを再び可能にするため、再試行では新しいquoteを取得する。
- Demo Trusted Issuerは、画面見出し、模擬説明、操作ボタン、後段のDEMO badgeで継続表示している。
- OrcaRouterのモデル制約は、信頼できないフロントエンドではなくサーバー側で固定している。
- 外部APIのlatency / request IDは提出前の実接続確認項目であり、決定的なunit testへ偽値を置かない。
- `tests/proof.test.ts`が実APIの`VALID → holder code revoke → REVOKED`を検証し、`tests/releaseExperience.test.ts`が画面から4つのProof routeを呼ぶことを検証している。

反証確認後の最終回答:

`GO — Critical 0 / High 0`

Mistralは、初回のblockerがすべて提示コードで否定され、残るCritical / Highはないと判定した。

### Zenn改稿の事実整合再監査

旧稿の「『18歳以上』なら、AIはいらない」がIssuer側の年齢確認AIまで否定して読めるため、Issuerの元確認、AI Policy StudioのPolicy設計、VerifierのProof検証を分離して記事を改稿した。酒類宅配の実例では、`over_18`へ置き換える年齢確認と、業務入力として残す配送住所を区別した。

初回指摘を正本と照合して修正・反証した後の再監査結果は、`GO / Critical 0 / High 0 / findings 0`。

## 旧版に対する監査履歴

> **履歴記録:** この監査後に、`/demo`へIAMmeアカウント作成と模擬属性確認を追加する体験変更を行った。以下の判定は当時の提出物に対するものであり、現行版の最終GO判定ではない。現行版は再監査後に提出可否を判断する。

最終提出パッケージを、AI HACK 2026の審査項目、ファイル間整合、誇張、実装境界、提出漏れの観点でMistralへレッドチームした。

## 初回判定

`CONDITIONAL GO`

条件は次の3点だった。

1. `Judging_Criteria.md`の旧デモ順「目的入力→AI→同意」が、現在の利用者体験と矛盾する。
2. Qiita / Zenn原稿の「2つの事実」を、全提出物と同じ「2つのProof」へ揃える。
3. Pitchの「Policy分析」を、他資料と同じOrcaRouter経由のサービス要件分析へ揃える。

## 反映済み

- `Judging_Criteria.md`を「保存済みPolicy→同意→署名Proof→サービス検証→失効」へ更新した。
- `04_QIITA_ZENN_FINAL.md`を「2つのProof（`over_18` / `human_verified`）と、サービスへ渡さない4項目」へ更新した。
- `03_PITCH_SCRIPT_FINAL.md`を「OrcaRouter経由でサービス要件を分析」へ更新した。

修正後に対象語を横断検索し、旧表現が正本と最終提出資料に残っていないことを確認した。

## 再監査について

修正後の再監査はMistral APIの一時的な`500 Service unavailable`と応答タイムアウトで完了しなかった。初回監査自体は完了しており、提示された全条件は反映・機械確認済み。外部API障害を、提出物の未修正として扱わない。
