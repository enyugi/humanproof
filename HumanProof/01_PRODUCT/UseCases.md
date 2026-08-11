# Use Cases

## MVP representative: 18+ community

目的:

- 成人のみ参加可能
- 実在人物のみ参加可能

現在の要求例:

- full name
- exact date of birth
- home address
- ID photo

推薦Proof:

- `over_18`
- `human_verified`

## Candidate: fan voting

候補Proof:

- `human_verified`
- `unique_person`

実名と投票先を結びつけず、1人1票の実現可能性を探る。効果と不正耐性は未検証。

## Candidate: pseudonymous creator

候補Proof:

- `human_verified`
- 将来の `verified_creator`

ペンネームを維持しながら、信頼された機関との関係を証明する。MVP対象外。

## Candidate only: age-restricted adult services

課題の強さはあり得るが、初期市場には決定しない。法規制、既存手段、ブランド、導入主体を検証するまで保留。

