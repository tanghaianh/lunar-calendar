# Project Structure

This repository uses Next.js App Router with a scalable folder layout.

## Core application

- `app/`: Next.js routes, layouts, pages, and route handlers.
- `app/api/`: HTTP API route handlers (`route.ts`).
- `components/`: shared UI and presentation components.
- `features/`: domain-focused feature modules (UI + logic grouped by feature).

## Shared code

- `lib/`: utilities and framework helpers (server/client safe helpers).
- `services/`: API clients and external integration logic.
- `hooks/`: reusable React hooks.
- `store/`: global state management setup.
- `types/`: shared TypeScript types and interfaces.
- `config/`: app-level constants and typed configuration.
- `styles/`: shared style assets (if not colocated in components).

## Quality and tooling

- `tests/unit/`: isolated unit tests.
- `tests/integration/`: integration-level tests.
- `tests/e2e/`: end-to-end tests.
- `docs/`: architecture notes and project documentation.
- `scripts/`: automation scripts for CI/CD and local workflows.
