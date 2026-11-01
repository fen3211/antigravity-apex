# Contributing to AI Command Center

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
- Backend Health: `http://127.0.0.1:3001/health`

---

## Engineering & Architecture Standards

### 1. TypeScript & Type Safety
- **Strict Mode**: `strict: true` is enabled across both server and client.
- **Zero `any` Policy**: Avoid using `any`. If dynamic data is parsed, define an interface in `shared/types.ts` and validate it with a **Zod** schema.
- **Shared Contracts**: Common types used across backend and frontend live in `shared/types.ts`. Do not duplicate definitions.

### 2. Runtime Schema Validation
- All inbound HTTP request bodies, route parameters, and WebSocket messages must be validated using `zod`.
- Return clear HTTP 400 responses with descriptive validation error messages when schemas fail.

### 3. Frontend UI/UX Guidelines
- **Aesthetic**: Follow the **Liquid Dark Glass** / Developer Tools design language (Apple dark glass, Refero/Vercel minimalism, subtle border glows, high contrast).
- **Console Integrity**: The frontend must produce **zero console errors** or uncaught warnings.
- **Accessibility**: Ensure keyboard navigation (`focus-visible`), readable contrast ratios (WCAG AA), and proper ARIA semantics.

### 4. Database & Concurrency
- Database operations use `better-sqlite3` in **WAL** mode with `busy_timeout = 5000`.
- All multi-step write operations must be wrapped in atomic transactions (`db.transaction(...)`).
- Event IDs must be generated deterministically using SHA-256 hashes of the stable event attributes to prevent duplicate ingestion.

---

## Testing Protocol

Before submitting a Pull Request, you must verify that all automated test suites pass cleanly.

### Running Test Suites
```bash
# Run the entire test suite (API, Ingestion, Analytics, WS, Supervisor, Legal)
npm test

# Run individual targeted suites:
npm run test:ingestion     # JSONL reader, chunking, UTF-8 boundaries, deduplication
npm run test:analytics     # Model metrics, session token aggregation
npm run test:ws            # WebSocket resilience, payload limits, timing-safe auth
npm run test:supervisor    # Process tree lifecycle, timeouts, concurrency limits
npm run test:legal         # Legal & Compliance 16 scenarios (152-FZ, 243-FZ, GDPR)
```

### Writing New Tests
- When adding an endpoint, include corresponding test assertions in `tests/api.test.ts`.
- When modifying stream or file ingestion, add edge-case checks to `tests/ingestion.test.ts`.
- When touching legal rules or triggers, add test cases to `tests/legal-compliance.test.ts`.

---

## Pull Request Workflow

1. **Create a Topic Branch**:
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bugfix-name
   ```
2. **Commit Conventions**:
   Follow [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat: add model token cache breakdown to analytics`
   - `fix: resolve race condition in websocket reconnection`
   - `docs: update installation instructions for Linux`
   - `perf: optimize sqlite event index lookup`
   - `test: add unit tests for process tree termination`

3. **Subagent 9-Point PR Report Template**:
   When opening a Pull Request, include the standard 9-point report in the description:
   ```markdown
   ### 1. Task Name & Summary
   [Brief title and 2-sentence summary of the problem and solution]

   ### 2. Status
   [SUCCESS / NEEDS REVIEW]

   ### 3. Key Changes
   [Bullet points detailing what was implemented or fixed]

   ### 4. Modified Files
   - `server/src/...`
   - `client/src/...`

   ### 5. Executed Checks
   - [x] `npm test` passed (20 system tests, 9 supervisor tests, 16 legal tests)
   - [x] Client build verification (`npm --prefix client run build`)
   - [x] Lint verification (`npm --prefix client run lint`)

   ### 6. Test & Build Results
   [Paste concise output summary or screenshot]

   ### 7. Known Risks & Edge Cases
   [Detail any potential side-effects or platform limitations]

   ### 8. Pending Items
   [None or list follow-up items for future PRs]

   ### 9. Recommended Next Steps
   [Actionable rollout or verification steps]
   ```

4. **Review & Merge**:
   PRs undergo review against Quality Gate 1 (tests & lint) and Quality Gate 2 (code review). Once approved, changes are merged into `main`.
