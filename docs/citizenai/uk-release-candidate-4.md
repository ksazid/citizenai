# CitizenAI UK Release Candidate 4

Exact pack version: `2026.09.02-rc.4`
Pack id: `GB-2026.09.02-rc.4`
State: `review` → **human coverage certified**

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

Human certification approves the independently sourced coverage for CitizenAI's stated preparation product. It does **not** assert official-guide equivalence, exhaustive official-exam coverage, or a guaranteed pass result.

## Exact-version human certification

The product owner approved **this exact pack version** after the engineering, provenance, public-source coverage, sports-source, pre-1066 breadth, and 65/65 live source-body snapshot gates passed.

Approval checklist:

1. Source policy acceptable; no commercial study material is canonical evidence. ✅
2. Government, rights, history and culture domains have reasonable breadth for CitizenAI's preparation claims. ✅
3. Sports coverage is grounded in government/public bodies. ✅
4. Pre-1066 breadth is represented without copied handbook wording. ✅
5. 65/65 source-body snapshots succeeded for the exact version. ✅
6. Question wording is independently authored and resolves to canonical facts. ✅
7. Product wording remains `estimated readiness` / `Pass Ready`, never a guaranteed exam result. ✅
8. Approval applies only to `2026.09.02-rc.4`; changed factual content requires recertification. ✅

## Approval record

- `approved: true`
- `reviewerId: ksazid`
- `exactPackVersion: 2026.09.02-rc.4`
- `reviewedAt: 2026-09-02T11:09:23.000Z`
- source snapshot workflow: `33619666540`
- snapshot artifact: `9842390335`
- snapshot coverage: `65/65`

The immutable machine-readable record is `src/citizenai/uk-rc4-approval.mjs`.
