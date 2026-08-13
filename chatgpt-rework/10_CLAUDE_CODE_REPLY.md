# Claude Codeの質問への回答

表示された3択のどれでもなく、次の3ルート構成にしてください。

> **その他:** `/` はIAMmeのLP、`/demo` はHumanProofの主デモ、`/studio` は既存AI Policy Studioとする。現行 `app/page.tsx` のPolicy Studio機能は削除せず `/studio` へ丸ごと移設する。新しい `/demo` はNIGHT SCREENから始まる一般利用者体験とし、LPの主CTA `デモを試す` は `/demo` へ遷移する。`/demo` の登録完了後に `AIが何をしたか` の要約を表示し、詳細な要件入力・Stress Test・OrcaRouter監査は `/studio` への副リンクで開く。Policy StudioをLPや主デモへ折り畳んで混在させない。

理由:

- `/` にPoC全機能を詰めるとLPでもデモでもない画面になる
- `/demo` は審査員が一般利用者として完走する一本道に集中させる
- `/studio` はAI必然性、OrcaRouter、Policy設計の審査証拠を失わず保持できる
- IAMmeとHumanProofの関係をLPで説明し、HumanProofの操作は専用ページで見せられる

この回答後は、`09_CLAUDE_CODE_RELEASE_ONE_SHOT.md` をそのまま渡してください。同ファイルの「計画をユーザーへ出す前の品質ゲート」に従い、実コード照合、`/plan-audit`、`/mistral-redteam`、Critical/High解消、再監査までClaude Code側で終えてから、監査済み計画を一度だけ提示してください。
