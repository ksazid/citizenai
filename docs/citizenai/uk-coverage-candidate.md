# CitizenAI UK Coverage Candidate 3.1

## Identity

- Pack: `GB-2026.09.02-candidate.3.1`
- Status: `review`
- Concepts: 59
- Canonical facts: 59
- Question variants: 177
- Authoritative sources: 58
- Evidence records: 59
- Activation allowed: **no**
- Exam complete: **no**

This pack is independently authored from authoritative public sources. It does not copy or translate the Guide for New Residents and does not claim access to live or leaked test questions.

## Coverage added in this candidate

The candidate extends the existing government, rights, elections and core-history graph with:

- medieval Parliament and the Reformation Parliament
- Gunpowder Plot, Restoration and Glorious Revolution
- Indian independence/Partition and post-war Commonwealth migration/Windrush
- Shakespeare, Jane Austen, Charles Dickens and Robert Burns
- Isaac Newton, Charles Darwin, Alexander Fleming, Alan Turing and Tim Berners-Lee
- St George's Day, St David's Day, St Andrew's Day and St Patrick's Day

All production questions retain the invariant:

`question -> approved canonical fact -> evidence -> authoritative source`

## Question hardening

Candidate 3.1 supersedes the first V3 generator output for runtime use. New candidate questions enforce:

- exactly four unique option IDs
- exactly one canonical correct answer
- three variants per concept
- correct-answer text equal to the approved canonical fact for newly added concepts
- unique question stems
- provenance validation before installation in mobile

## Source monitoring

`uk-source-snapshots.mjs` implements normalized SHA-256 source-body snapshots and deterministic diffing. This is the required mechanism for future source-change detection.

The historical source-body snapshot backfill is **not complete**. Existing URL/title fingerprints are not represented as source-body hashes.

## Coverage certification

`uk-coverage-certification.mjs` fails closed. An exact pack version is certifiable only when all of the following are true:

1. Pack validation passes.
2. The pack is in review.
3. Lawful official-guide/scope alignment has been certified.
4. Exam coverage is marked complete.
5. Activation is explicitly allowed.
6. There are zero open coverage gaps.
7. Every source has a source-body snapshot.
8. A human coverage reviewer approves the exact pack version.

## Remaining blockers

Candidate 3.1 deliberately remains blocked by:

- sport coverage source-policy decision / approved authoritative sources
- selective rather than exhaustive pre-1066 coverage
- source-body snapshot backfill for every source
- exact-version human coverage certification against a lawful exam-scope map

No code path may describe this pack as exam-complete or active until those gates are satisfied.
