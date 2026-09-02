# CitizenAI UK Release Candidate 4

Exact pack version: `2026.09.02-rc.4`
Pack id: `GB-2026.09.02-rc.4`
State: `review`

## Engineering scope

- 65 authoritative government/public-body sources
- 68 evidence records
- 68 canonical concepts
- 68 verified facts
- 204 independently authored question variants
- Provenance invariant: question → approved fact → evidence → approved source
- Sports source policy: government/public-body sources only; no commercial study sites
- Pre-1066 map: Roman Britain, early medieval Britain, Anglo-Saxon settlement, Vikings and Sutton Hoo
- Live source-body SHA-256 capture: blocking CI job `uk-source-snapshot-backfill`
- Frozen five-screen visual capture remains a blocking UI gate

## Lawful-scope boundary

GOV.UK states that the Life in the UK Test is based on the official Guide for New Residents. CitizenAI does not reproduce or translate that guide. This pack is independently authored from authoritative public sources.

Therefore this release candidate does **not** self-declare official-guide alignment, exam completeness or guaranteed pass coverage.

## Exact-version human certification

The final reviewer must explicitly review **this exact pack version** and decide whether the public-source scope map is sufficient for CitizenAI's stated preparation product.

The reviewer should verify:

1. The source policy is acceptable and no commercial study material is used as canonical evidence.
2. Government, rights, history and culture domains have reasonable breadth for the product's preparation claims.
3. Sports coverage is acceptably grounded in government/public bodies.
4. Pre-1066 breadth is acceptably represented without copied handbook wording.
5. Every source has a successful source-body snapshot in the CI artifact for this exact version.
6. Question wording is independently authored and answers resolve to canonical facts.
7. Product wording remains `estimated readiness` / `Pass Ready`, never a guaranteed exam result.
8. Any approval applies only to `2026.09.02-rc.4`; a changed pack requires a new certification.

## Approval record

Not approved yet.

Required fields:

- `approved: true`
- `reviewerId: <human reviewer>`
- `exactPackVersion: 2026.09.02-rc.4`
- `reviewedAt: <timestamp>`
- optional reviewer notes

Activation must remain blocked until this explicit human record exists.
