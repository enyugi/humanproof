# Sakana AI壁打ち — 統合用サマリー

**Source:** 2026-08-11の参照会話内で共有されたSakana AI回答。これは逐語録ではなく、採否判断のための要約。

## Valuable critiques

- 現MVPのAI必然性は弱く、固定ルールで代替できる部分が大きい
- AIを使うなら曖昧な自然言語、複数目的、文脈依存性を扱う必要がある
- 「過剰」の判断には法規制、業務目的、不正対策など未記述の事情がある
- 独自性はpurposeとrequested dataのズレをどれだけ深く・正確に見つけるかに依存する
- Zero PII to LLM、structured output、OrcaRouter observabilityは技術的に有効
- 規制知識、侵害事例、業界標準との連携は将来の強化候補
- AI Agentとの接続は概念上自然だが、MVPではHumanへ集中すべき

## Adopted

- `Potentially unnecessary for the stated purpose` という限定表現
- 曖昧さ、前提、確認事項の表示
- AI recommendation only / legal determinationではないことの明示
- Zero PII、structured output、実observability
- AI AgentはFutureとしてのみ扱う

## Held

- 規制・業界標準の知識ベース
- 侵害事例・過去事例データとの連携
- Human→Agent権限委譲の簡易デモ

## Rejected for MVP

- AIが規制適合性を保証すること
- 「不要」と無条件に断定すること
- Agent機能をCore MVPへ追加すること

