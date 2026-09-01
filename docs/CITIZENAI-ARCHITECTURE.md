# CitizenAI Architecture v1

## Product boundary
CitizenAI UK answers three user questions: **Am I ready?**, **What should I study now?**, and **Why did I get this wrong?**

## Runtime shape
Start as a modular monolith. PES-v2 remains the governance/control layer; CitizenAI product code is isolated under `src/citizenai`.

```text
Mobile/Web UI
   ↓
CitizenAI application modules
   ├── design-system
   ├── knowledge
   ├── diagnostic
   ├── mastery
   ├── readiness (VS-06)
   ├── study-plan (VS-07)
   ├── learning (VS-08)
   ├── mock (VS-09)
   └── content-admin (VS-11)
   ↓
PostgreSQL persistence (implementation adapter later)
```

## Architectural rules
1. Canonical facts are never established by an LLM.
2. Every production question must resolve to concept → fact → approved evidence.
3. Country knowledge packs are versioned and immutable after publication.
4. Learner mastery is concept-based, not question-count based.
5. Readiness and study selection are deterministic/explainable in MVP.
6. Multi-agent execution stays disabled until explicitly benchmark-qualified.
7. Human approval is mandatory for content publication, certification and release.

## Content strategy
MVP uses independently authored content grounded in legally usable official/public-authority sources. Do not reproduce or translate protected handbook text without a license.

## Initial stack
- Node.js 24+ / TypeScript-compatible ES modules
- PostgreSQL planned persistence
- React Native / Expo target client
- LLM use restricted to bounded explanation, translation and proposal workflows
