# CitizenAI — PES-v2 Product Intake

## Product
CitizenAI is a UK Life in the UK test preparation product focused on three user questions:

1. Am I ready?
2. What should I study now?
3. Why did I get this wrong?

The product is not a generic question bank. Its core value is a verified knowledge layer plus adaptive mastery, Pass Intelligence, and next-best-study guidance.

## Approved MVP scope

- UK Life in the UK only
- Independently authored, source-grounded knowledge pack
- Verified source provenance and versioning
- Adaptive diagnostic
- Concept mastery model
- Retention/forgetting model
- Pass Intelligence readiness estimation
- Next-best-study planning
- Learn / Compare / Recall / Question interventions
- 24-question mock test experience
- Pass Ready state and maintenance reviews
- Admin/content review workflow
- 28-screen functional inventory

## Explicitly out of MVP

- Immigration application filing
- Legal advice
- Community/social features
- Agency portal
- Multi-country support
- Generic chatbot surface
- Autonomous LLM publishing of canonical facts
- Multi-agent runtime by default

## Product principles

- Verified before generated
- Concepts before question memorisation
- Readiness over raw completion counts
- Minimal cognitive load
- Calm, premium, trustworthy UX
- Human authority over content publication and release

## Approved UI direction

CitizenAI UI DNA is sophisticated, clean, light-mode-first, high-whitespace, and confidence-led. The design language uses restrained blue/indigo accents with limited teal support, strong typography, subtle depth, and minimal gamification.

Core visual journey:

Welcome → Diagnostic Result → Home → Learning → Pass Ready

## Core architecture decisions

- PostgreSQL
- Versioned knowledge graph/data model
- Beta-distribution concept mastery model
- Exponential retention decay for MVP
- Monte Carlo readiness simulation
- Rule-based next-best-study optimizer
- Grounded LLM assistance only for bounded explanation, translation, and candidate question generation
- Modular monolith first
- React Native / Expo mobile client
- Multi-agent execution disabled by default

## Content strategy

CitizenAI will not reproduce the official handbook wholesale. MVP content will be independently authored and grounded in legally usable official/public sources with explicit provenance, versioning, and human approval.

## Success hypothesis

A learner who uses CitizenAI should reach defensible Pass Ready status with less unnecessary study than a conventional large question-bank workflow.

## Initial validation target

The MVP must prove that the engine can identify weak concepts, prioritize the next best study action, and produce a readiness estimate that calibrates meaningfully against mock performance and eventually self-reported real exam outcomes.
