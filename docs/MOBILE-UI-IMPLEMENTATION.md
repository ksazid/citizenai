# CitizenAI Mobile UI Implementation

## Status

The complete frozen 28-screen CitizenAI UK MVP inventory is implemented under `apps/mobile` as an interactive Expo/React Native application shell.

## Runtime

- Expo SDK 57
- React 19.2.3
- React Native 0.86
- TypeScript
- Portrait mobile-first layout
- Light appearance for MVP

## UI DNA

The implementation follows the approved CitizenAI direction:

- calm, premium, readiness-first presentation;
- generous whitespace and restrained card usage;
- blue/indigo primary accent with limited teal/success support;
- clear hierarchy over decoration;
- no childish gamification;
- no generic chatbot surface;
- four primary tabs only: Home, Learn, Progress, Profile;
- readiness and coverage confidence shown separately;
- study plans emphasize the smallest useful next action;
- Pass Ready is evidence-gated and visually calm rather than celebratory.

## Implemented screens

### Onboarding
1. Welcome
2. Test setup
3. Diagnostic
4. Diagnostic result

### Core learning
5. Home
6. Today's plan
7. Learn concept
8. Compare concepts
9. Recall
10. Question
11. Answer explanation
12. Session complete

### Progress
13. Progress overview
14. Domain detail
15. Concept detail

### Mock
16. Mock intro
17. Mock question
18. Mock review
19. Mock result

### Readiness
20. Pass Ready
21. Maintenance review
22. Exam countdown
23. Exam day

### Outcome
24. Exam result
25. Passed
26. Failed / recalibration

### Utility
27. Profile / settings
28. Source / version information

## Navigation

The app uses a deliberately small in-app navigation state for the MVP shell. Every CTA is wired to a valid screen in the frozen inventory. Persistent navigation remains limited to Home, Learn, Progress and Profile.

A production navigation library can replace the local history stack when deep links, persisted navigation state and platform back handling are introduced. The current structure keeps the screen contracts independent from that choice.

## Shared primitives

`src/components.tsx` defines the common primitives used across the product:

- Header
- BrandMark
- Card
- Button
- TextAction
- Pill
- ProgressBar
- ReadinessCard
- Metric
- ListRow
- BottomTabs

`src/theme.ts` is the single mobile token source for color, spacing, type scale, radii and readiness-state tones.

## Integration boundary

The screens currently use deterministic representative UI state so every page and route can be reviewed without a live backend. The next integration step is to bind the existing CitizenAI domain engines and API contracts to these views without changing their visual contracts.

## Verification

`test/citizenai/mobile-ui.test.mjs` verifies:

- all 28 frozen screens exist;
- only the four approved primary tabs exist;
- approved UI DNA tokens remain present;
- navigation is interactive rather than static;
- Expo / React Native runtime versions remain pinned to the selected baseline.
