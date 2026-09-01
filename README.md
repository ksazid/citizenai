# CitizenAI

CitizenAI is a premium UK Life in the UK preparation product built around three questions:

1. **Am I ready?**
2. **What should I study now?**
3. **Why did I get this wrong?**

It combines a verified, source-grounded UK knowledge layer with concept mastery, retention modeling, Pass Intelligence, and next-best-study guidance. The product deliberately avoids becoming another large question bank.

## Product core

```text
Verified UK Sources
        ↓
Versioned Knowledge Pack
        ↓
Concept + Question Model
        ↓
Diagnostic / Attempts
        ↓
Mastery + Retention
        ↓
Pass Intelligence
        ↓
Next-Best-Study Engine
        ↓
Learn / Compare / Recall / Mock
        ↓
Pass Ready
```

## MVP

- UK Life in the UK only
- Verified source provenance and content versioning
- Adaptive diagnostic
- Concept mastery + uncertainty
- Retention / forgetting model
- Pass Intelligence readiness estimate
- Next-best-study planning
- Learn / Compare / Recall / Question interventions
- 24-question mock flow
- Pass Ready maintenance mode
- Admin/content review and immutable knowledge-pack publishing
- 28-screen approved functional inventory

See:

- `docs/CITIZENAI-PRODUCT-INTAKE.md`
- `docs/CITIZENAI-VERTICAL-SLICES.md`

## UI direction

CitizenAI uses a sophisticated, calm, premium light-mode design system with strong typography, high whitespace, restrained blue/indigo accents, limited teal support, subtle depth, and minimal gamification.

Approved core visual journey:

```text
Welcome → Diagnostic Result → Home → Learning → Pass Ready
```

## Engineering governance — PES v2

This repository was created from **Product Engineering Starter v2 (PES v2)** and retains its governance model:

```text
Governance
   ↓
Ranked Bounded Context → Plan → Execute → Evaluate → Keep / Revise / Revert
          ↑                                      ↓
          └──────── Product Graph Memory ← Artifacts / Evidence / Lineage
                                                 ↓
                                      Graph-aware PES Gates
                                                 ↓
                                      Exact-SHA Certification
                                                 ↓
                                           Human Approval
```

PES-v2 remains in Lite / single-worker mode for CitizenAI initially. Multi-agent execution is disabled until a measured workload demonstrates a material benefit.

## Current CitizenAI delivery plan

- **VS-01 Foundation** — in progress
- **VS-02 Design System** — planned
- **VS-03 UK Knowledge Pack** — planned
- **VS-04 Diagnostic** — planned
- **VS-05 Mastery Engine** — planned
- **VS-06 Pass Intelligence** — planned
- **VS-07 Study Engine** — planned
- **VS-08 Learning UX** — planned
- **VS-09 Mock Test** — planned
- **VS-10 Pass Ready** — planned
- **VS-11 Admin / Content Ops** — planned
- **VS-12 End-to-End Certification** — planned

## PES-v2 commands

Requires Node.js 24+.

```bash
npm test
npm run preflight
npm run pes:validate
npm run graph:validate
```

Build ranked bounded context:

```bash
npm run context:build -- <objective-id>
```

Evaluate a PES lifecycle transition:

```bash
npm run gate:evaluate -- certification path/to/gate-input.json
```

Build and verify certification bundles:

```bash
npm run cert -- candidate certification-input.json
npm run cert -- finalize candidate.json approval.json <exact-commit-sha>
npm run cert -- verify certified.json [exact-commit-sha]
npm run cert -- store certified.json
```

## Content boundary

CitizenAI will not reproduce the official handbook wholesale. MVP knowledge content will be independently authored from legally usable official/public sources, with explicit provenance, versioning, change detection, and human publication authority.
