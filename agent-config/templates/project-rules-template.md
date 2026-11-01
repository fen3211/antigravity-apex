# Project Specific Operational Guidelines

This file extends the global Antigravity Director rules with domain-specific standards for this project.

## 1. Architecture & Tech Stack Standards
- **Language / Runtime**: [e.g. Node.js 22 LTS / Python 3.12 / TypeScript 5.7]
- **Framework & Libraries**: [e.g. Express, React, Tailwind CSS, SQLite WAL]
- **Code Style**: Strict typing, no implicit `any`, Zod/Pydantic validation for all boundaries.

## 2. Directory Layout & Boundaries
- `/src` (or `/server`, `/client`): [Purpose and module boundaries]
- `/tests`: Unit and integration test suites.
- Do NOT edit generated files in `/dist`, `/.system_generated`, or lockfiles manually.

## 3. Security & Environment Rules
- All secret tokens, keys, and credentials MUST be loaded strictly via `.env`.
- Check `.env.example` when adding new configuration options.
- Run security linter or audit before making pull requests.

## 4. Testing & Verification Requirements
- Pre-commit check: `npm test` or `npm run typecheck` MUST pass 100%.
- UI changes require responsive testing (mobile 375px, desktop 1440px) with zero console errors.
