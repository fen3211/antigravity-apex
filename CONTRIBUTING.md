# Contributing to AI Command Center

[English](CONTRIBUTING.md) • [Русский](CONTRIBUTING.ru.md)

Thank you for your interest in contributing to **AI Command Center**! We welcome bug fixes, documentation improvements, architectural optimizations, and new features from the community.

AI Command Center is built around the engineering standards of the **Antigravity AI Development Director**: zero-fabrication, rigorous verification, strict type safety, and multi-tier quality gates.

---

## Code of Conduct

All contributors and participants are expected to adhere to our [Code of Conduct](CODE_OF_CONDUCT.md). Please treat all collaborators with respect and professionalism.

---

## Getting Started & Development Setup

### 1. Prerequisites
- **Node.js**: Version 18.x or higher (tested on Node.js v20 and v24).
- **npm**: Version 9.x or higher.
- **Git**: For version control.
- *(Optional)* **Google Antigravity SDK & CLI**: If you wish to test live integration with `agy.exe`.

### 2. Local Repository Setup
```bash
# 1. Clone your fork
git clone https://github.com/<your-username>/ai-command-center.git
cd ai-command-center

# 2. Install root and client dependencies
npm install
npm --prefix client install

# 3. Create your local environment configuration
cp .env.example .env

# 4. Run the full verification test suite
npm test
```

### 3. Running in Development Mode
```bash
# Start both backend server (port 3001) and Vite frontend (port 5173)
npm run dev
```
Open your browser to:
- Frontend UI: `http://127.0.0.1:5173`
- Backend Health: `http://127.0.0.1:3001/api/status`

---

## Development Standards & Guidelines

### 1. Strict TypeScript Without `any`
- All backend and frontend code must strictly adhere to TypeScript typing.
- Never use the `any` type as a shortcut. Define proper schemas and interfaces.
- Validate all external API inputs using **Zod** schemas.

### 2. Refero & Vercel Design System Compliance
- The UI follows the **Refero / Vercel** design aesthetic with native Light and Dark modes.
- Use the 4px/8px layout grid and verified color tokens from `client/src/index.css`.
- Ensure all interactive elements have visible focus rings (`focus-ring`), accessible contrast ratios (WCAG 2.1 AA), and proper hover/disabled/active states.

### 3. Subagent 9-Point Reporting Protocol
Any modifications touching task completion or subagent execution must maintain compliance with the strict **9-point Subagent Report**:
1. `taskName`
2. `status` (`SUCCESS`, `FAILURE`, `BLOCKED`)
3. `summary`
4. `modifiedFiles`
5. `executedChecks`
6. `checkResults`
7. `issuesAndRisks`
8. `pendingItems`
9. `nextSteps`

Never submit `PASS` without verified test execution logs.

---

## Submitting Pull Requests

1. Fork the repository and create your branch from `main`:
   ```bash
   git checkout -b feat/your-feature-name
   ```
2. Make your changes adhering to project standards.
3. Run the full test suite and diagnostic doctor:
   ```bash
   npm test
   npm run doctor
   ```
4. Commit your changes following [Conventional Commits](https://www.conventionalcommits.org/):
   ```bash
   git commit -m "feat(telemetry): add streaming token throughput counter"
   ```
5. Push to your fork and submit a Pull Request to `main`.
