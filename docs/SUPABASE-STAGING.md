# CitizenAI Supabase Staging

CitizenAI staging uses Supabase Free PostgreSQL as the persistent database and Render Free as the Node API host.

## Architecture

Supabase PostgreSQL -> CitizenAI Runtime API on Render -> Expo mobile app

The API remains the only application layer that writes learner runtime data. The mobile app does not talk directly to Supabase.

## Required secret

`DATABASE_URL` must be the Supabase PostgreSQL connection string. Do not commit it to GitHub.

The API already uses TLS for hosted PostgreSQL unless `PGSSL=disable` is set, so no Supabase-specific database adapter is required.

## Verification

From the repository root with `DATABASE_URL` configured:

```bash
npm install
npm run staging:verify-db
```

This applies the idempotent CitizenAI runtime migration and then verifies all six required runtime tables are present.

## Render staging service

Use:

- Runtime: Node
- Branch: `main`
- Build command: `npm install --no-audit --no-fund`
- Start command: `npm run start:api`
- Environment: `DATABASE_URL=<Supabase Postgres connection string>`
- Environment: `CITIZENAI_ALLOWED_ORIGIN=*` for staging only

After deploy, `/healthz` must return `ok: true` before the mobile app is pointed at the service.

## Mobile

Set `EXPO_PUBLIC_CITIZENAI_API_URL` to the Render staging service base URL. The app persists a learner UUID locally and synchronizes diagnostic, practice, mock and outcome evidence through the runtime API.

## Staging E2E gate

The staging flow is accepted only after all of the following succeed against the deployed API and Supabase database:

1. Create learner.
2. Reload learner state from a second API request.
3. Complete diagnostic attempts.
4. Confirm mastery/readiness changed and persisted.
5. Fetch today's study plan.
6. Record a practice attempt and re-fetch readiness.
7. Start, answer and complete a mock.
8. Reload the learner and confirm mock/result persistence.
9. Record an exam outcome test fixture and confirm persistence.
10. Confirm approved UI anchor captures remain unchanged.

## Production boundary

This staging path remains device-scoped and auth-less. Public launch is blocked until authentication binds the persisted learner record to a verified user identity.
