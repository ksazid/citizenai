# CitizenAI production runtime

## Goal

Move learner evidence out of the mobile process while preserving the already-certified CitizenAI engines and active UK knowledge pack.

The mobile client must not invent readiness or study-plan logic. In API mode, server-generated dashboard/readiness/study-plan state is the displayed source of truth. The existing local engine remains only as an offline fallback and for deterministic visual-capture tests.

## Runtime topology

Mobile (Expo / React Native)
→ CitizenAI Node API
→ certified domain engines
→ PostgreSQL
→ active UK pack `GB-2026.09.02.1`

No microservices and no agent framework are introduced.

## PostgreSQL schema

Migration: `db/migrations/001_citizenai_runtime.sql`

Persisted entities:
- learner profile / test setup
- attempts (diagnostic, practice, mock)
- per-concept mastery state
- mock sessions/results
- exam outcomes and calibration consent
- optional runtime snapshot for UI/session recovery

## API contracts

- `POST /v1/learners`
- `PATCH /v1/learners/:id`
- `GET /v1/dashboard?learnerId=...`
- `GET /v1/diagnostic/next?learnerId=...`
- `POST /v1/attempts`
- `GET /v1/study-plan/today?learnerId=...`
- `GET /v1/readiness?learnerId=...`
- `GET /v1/learning/next?learnerId=...`
- `POST /v1/mocks`
- `POST /v1/mocks/:id/answer`
- `POST /v1/mocks/:id/complete`
- `POST /v1/exam-outcomes`
- `GET|PUT /v1/learners/:id/snapshot`

Correct answers are never returned by diagnostic/learning question-selection endpoints.

## Mobile activation

Set:

`EXPO_PUBLIC_CITIZENAI_API_URL=https://<runtime-api-host>`

The mobile app stores the learner UUID in AsyncStorage and reconnects to persisted evidence after restart. If no API URL is configured, the app uses the deterministic local fallback.

## Server activation

Required:

- `DATABASE_URL=postgresql://...`
- optional `PGSSL=disable` for local PostgreSQL only
- optional `CITIZENAI_ALLOWED_ORIGIN=...`
- optional `PORT=8787`

Run:

`npm install`
`npm run start:api`

The server applies the runtime migration on startup unless explicitly disabled by its programmatic API.

## Release gates

Every PR must pass:
- PES-v2 preflight
- CitizenAI runtime unit/integration tests
- real PostgreSQL migration/persistence test
- active UK source snapshot gate
- mobile TypeScript
- Expo web build
- five frozen visual-anchor captures

## Deliberate boundary

Authentication/identity-provider integration is not part of this slice. The learner UUID is device-persisted and must be bound to authenticated identity before public multi-user launch.
