# Claude Code Handoff Checklist

## Before sending

- [ ] HumanProofリポジトリの場所を確認
- [ ] 未コミットのユーザー変更を保持できる状態か確認
- [ ] OrcaRouter API keyの有無だけ確認（チャット本文へ貼らない）
- [ ] 旧初回指示書をすでに渡したか確認

## Send together

- [ ] `00_MASTER/HumanProof_MASTER.md`
- [ ] `04_DEVELOPMENT/MVP_Scope.md`
- [ ] `04_DEVELOPMENT/ClaudeCode_Delta_Instructions.md`
- [ ] 必要な場合のみ `99_REFERENCE/Original_ClaudeCode_Instructions_2026-08-11.md`

## Short message to Claude Code

```text
HumanProofの現行正本と、旧指示書に対するv2差分を渡します。
まず現在のリポジトリと未完了箇所を確認し、既存の動作と私の変更を壊さず、差分だけを実装してください。
仕様の優先順位は HumanProof_MASTER → MVP_Scope → ClaudeCode_Delta_Instructions → 旧指示書です。
外部資格情報が本当に必要な場合を除き、確認を細切れにせず、実装・テスト・実OrcaRouter確認・最終報告まで進めてください。
```

## Acceptance

- [ ] Purpose + current requested dataが入力できる
- [ ] `Potentially unnecessary for the stated purpose` 表現
- [ ] 4 data → 2 proofsが実データから計算される
- [ ] 曖昧さと追加目的のテスト
- [ ] Zero PII to LLM
- [ ] Consent、Signed Proof、Audience、Expiry、Revocation
- [ ] OrcaRouter実接続とactual-only audit
- [ ] Build / tests / typecheck / lint結果

