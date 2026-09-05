# CitizenAI Authenticated Account Foundation

## Scope

This slice keeps the existing guest-first learning flow and adds optional account protection without changing the frozen 28-screen MVP.

Flow:

`guest learner -> email/password Supabase Auth -> claim same learner -> account-owned learner`

The claim does not copy attempts, mastery, mocks, snapshots or outcomes. The learner UUID stays the same, so all existing progress remains attached through the existing foreign keys.

## Security invariants

- Guest bearer tokens continue to authorize only unclaimed learners.
- As soon as a learner is claimed, its old guest bearer token is rejected.
- An authenticated account can own only one learner in this v1 slice.
- Cross-account learner access is rejected by the runtime API.
- Supabase account access tokens are validated against the Auth service using the publishable key; no service-role key is used by the mobile app or runtime verifier.
- Supabase Auth sessions use Expo SecureStore on native platforms and AsyncStorage on web.
- RLS remains enabled. On Supabase, ownership SELECT policies are created for the learner and learner-owned runtime tables using `auth.uid()` through `citizenai_learner_account`.
- The runtime API remains the only application write path; this slice does not grant direct client write access to runtime tables.

## Runtime configuration

Render/API:

- `SUPABASE_URL=<project API URL>`
- `SUPABASE_PUBLISHABLE_KEY=<publishable key>`
- existing `DATABASE_URL`, `PGSSLROOTCERT_PEM`, `CITIZENAI_GUEST_TOKEN_SECRET` remain required for staging

Expo mobile:

- `EXPO_PUBLIC_SUPABASE_URL=<project API URL>`
- `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<publishable key>`
- existing `EXPO_PUBLIC_CITIZENAI_API_URL=<Render staging API URL>`

Publishable keys are intentionally client-safe. Never use a Supabase service-role/secret key in Expo.

## Account UX

The existing Profile screen gains an Account & progress card:

- Protect my progress -> email/password sign-up
- I already have an account -> sign-in
- Sign out

When sign-in succeeds, the app first asks the runtime for any learner already owned by that account. If none exists, it claims the currently stored guest learner. The runtime provider then remounts against the correct learner session.

## Deliberately deferred

- Apple Sign In
- Google Sign In
- password reset UX
- account deletion
- merging a second guest learner into an account that already owns a learner
- payments
- production CORS/rate-limit finalization
- production release enablement

Production remains fail-closed until the remaining release gates are completed.
