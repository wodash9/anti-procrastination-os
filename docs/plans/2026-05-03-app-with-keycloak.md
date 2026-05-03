# Anti-Procrastination OS Web App + Keycloak Implementation Plan

> **For Hermes:** Implement directly with TDD and pre-commit review. Use subagents for review/research when useful.

**Goal:** Convert the static landing into a React/Vite web app with protected app shell, Keycloak-ready auth, mock local auth, and operational anti-procrastination features.

**Architecture:** Single-page React app with pure domain logic in `src/domain`, local persistence in `src/storage`, auth abstraction in `src/auth`, and UI in `src/App.tsx`. Production auth is Keycloak OIDC public-client/PKCE via `keycloak-js`; local development can use `VITE_AUTH_MODE=mock` only on localhost. Coolify deployment uses Docker multi-stage build and Nginx SPA serving.

**Tech Stack:** React, Vite, TypeScript, Vitest, Testing Library, keycloak-js, Docker/Nginx.

---

## Boundary / assumptions

- No real Keycloak admin credentials are available, so implementation is config-ready but real login cannot be end-to-end verified yet.
- No backend/database in this slice. Data persists in browser `localStorage` per authenticated user id.
- Frontend auth guard improves UX but is not a security boundary for server data. Future backend must validate Keycloak JWTs.
- Existing landing content becomes the public/intro area; `/app`-style protected functionality is implemented in the app shell.

## Tasks

### Task 1: Scaffold React/Vite app

**Objective:** Replace static-only repo with a buildable/testable Vite SPA while preserving visual direction.

**Files:**
- Create: `package.json`, `tsconfig.json`, `tsconfig.node.json`, `vite.config.ts`, `src/`, `index.html`
- Keep: previous landing concepts copied into app UI.

**Verification:**
- `npm install`
- `npm test` should run Vitest.
- `npm run build` should produce `dist`.

### Task 2: Domain logic TDD

**Objective:** Implement scoring, WIP limit rules, daily focus validation, weekly review checks, zombie detection, emergency action generation, and metrics.

**Files:**
- Create: `src/domain/types.ts`
- Create: `src/domain/planning.ts`
- Create: `src/domain/planning.test.ts`

**Test cases:**
- Score decision bands: build now / wait / park / kill.
- WIP limit warning when `now` exceeds max.
- Next action validation rejects vague tasks.
- Zombie detector flags inactive/no-next-action projects.
- Weekly review flags inbox and active projects without next action.
- Emergency protocol returns one immediate 15-minute action.

### Task 3: Auth abstraction + Keycloak config

**Objective:** Provide secure frontend auth boundary with mock mode for local development and Keycloak mode for production.

**Files:**
- Create: `src/auth/auth.tsx`
- Create: `src/auth/auth.test.ts`
- Create: `.env.example`

**Rules:**
- No client secrets.
- `VITE_AUTH_MODE=mock` only works on localhost/dev.
- Missing Keycloak config yields explicit error in keycloak mode.
- UI consumes auth abstraction, not Keycloak directly.

### Task 4: Local persistence

**Objective:** Store projects/focus/reviews/events per user in localStorage and seed sample projects.

**Files:**
- Create: `src/storage/useWorkspace.ts`
- Create: `src/storage/workspace.ts`
- Create: `src/storage/workspace.test.ts`

**Rules:**
- Storage key includes user id.
- No data shared across users.
- All mutations append a simple event.

### Task 5: App UI

**Objective:** Implement functional dashboard: project inventory, matrix, WIP board, daily focus, weekly ritual, emergency mode, metrics, zombie detector, export.

**Files:**
- Create/modify: `src/App.tsx`, `src/styles.css`, `src/main.tsx`

**Features:**
- Login screen / authenticated dashboard.
- Add/update projects.
- Project scoring and recommendation.
- WIP board by status.
- Daily focus with next-action validation.
- Weekly ritual checklist and blockers.
- Emergency mode selecting one immediate action.
- Metrics cards and zombie warnings.
- JSON export.

### Task 6: Coolify packaging

**Objective:** Add deploy-ready Docker/Nginx config and docs.

**Files:**
- Create: `Dockerfile`, `.dockerignore`, `ops/nginx/app.conf`, `.nvmrc`
- Modify: `README.md`

**Verification:**
- `npm run build`
- If Docker accessible: `docker build` smoke. If not, report limitation.

### Task 7: QA and commit

**Objective:** Verify and commit a production-grade slice.

**Commands:**
- `npm test`
- `npm run typecheck`
- `npm run build`
- headless Chrome smoke for desktop/mobile overflow and UI text
- static secret scan
- independent reviewer subagent
- `graphify update .`
- git commit
