# VS-02 — CitizenAI Design System

## Direction
Sophisticated, calm and clean. Readiness is the visual anchor. The system intentionally avoids playful education-app tropes.

## Foundations
- Light canvas with white surfaces
- Blue/indigo primary accent with restrained teal support
- High-contrast navy text
- Large whitespace and rounded geometry
- Minimal shadows and gradients
- Motion only for state transitions and progress feedback

## Core screen archetypes
1. Welcome
2. Diagnostic Result
3. Home / Readiness
4. Learning / Compare / Recall / Question
5. Pass Ready

## Component families
- AppHeader
- ReadinessRing
- ReadinessStatus
- DomainProgress
- StudyPlanCard
- LearningCard
- CompareCard
- AnswerOption
- PrimaryButton / SecondaryButton
- MetricCard
- BottomNavigation

## Accessibility rules
- Do not encode readiness/status using color alone.
- Primary controls target at least 44×44 CSS points.
- Maintain readable contrast for body and secondary text.
- Respect reduced-motion preferences.
- Dynamic text must not break the primary action hierarchy.

`src/citizenai/design-system.mjs` is the machine-readable v1 token source.
