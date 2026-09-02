# UK Knowledge Pack — Foundation 2026.09.02

Status: `review`  
Pack: `GB-2026.09.02-foundation.1`

## Purpose

Replace CitizenAI's temporary integration question seed with independently authored questions grounded in approved official public sources.

## Authority

The foundation uses only approved official/public-authority sources:

- GOV.UK — Life in the UK Test format and result rules
- UK Parliament — Parliament/Government roles, Parliament functions, House of Lords, Magna Carta, Bill of Rights 1689, Acts of Union 1707, Representation of the People Act 1918
- Electoral Commission — Westminster MPs and First Past the Post
- GOV.UK — devolution
- Office for National Statistics — UK constituent countries / Great Britain
- UK Supreme Court — role and jurisdiction
- GOV.UK — bank holidays

Every active foundation question follows:

`question -> approved fact -> evidence -> approved official source`

If the chain breaks, validation fails.

## Current inventory

- 13 approved sources
- 13 evidence records
- 13 concepts
- 13 canonical facts
- 39 approved question variants
- 4 app domains: Government, History, Rights, Culture

This is enough for diagnostic variation and a 24-question mock pool.

## Copyright boundary

No text from the official Guide for New Residents / Life in the UK handbook is copied or translated into this pack. Canonical facts, explanations and question wording are independently authored from the public sources above.

## Coverage gate

GOV.UK states that the real Life in the UK Test is based on the official Guide for New Residents. Therefore this foundation is **fact-verified but not yet certified as exam-complete**.

The manifest deliberately contains:

- `officialGuideAligned: false`
- `examComplete: false`
- `activationAllowed: false`

`publishCertifiedUkPack()` refuses activation until an exact-version human coverage certification is present and the manifest is explicitly advanced after that review.

## Change monitoring

Source versions are hash-tracked. A changed source resolves through evidence to affected facts and then to all affected question IDs. Dynamic sources currently include the official test page and bank-holiday page; static sources still use version-change detection.

## Next expansion

Coverage certification should produce a gap matrix by topic, then add only missing independently authored facts/questions from legally usable authoritative sources. The pack must not be promoted to `active` merely because it has enough questions for a mock test.
