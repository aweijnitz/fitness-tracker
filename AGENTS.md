# Repository Guidelines

Always refer to the file ImplementationPlan.md for architectural approach, tech stack and other important details.

## Project Structure & Module Organization
- `client/` — React + TypeScript PWA (Vite). Source in `client/src`, tests in `client/src/__tests__`, assets in `client/src/assets`.
- `server/` — Express API + static hosting for built client. Entry: `server/src/index.js`. SQLite DB via `better-sqlite3` (default file `fitness.db`).
- Root `package.json` orchestrates both packages; `README.md` lists common tasks.

## Build, Test, and Development Commands
- Install all deps: `npm run setup`
- Run both test suites: `npm test`
- Build client then server: `npm run build`
- Start backend (serves `client/dist`): `npm start` (build first)
- Client dev server: `npm run dev --prefix client`
- Lint/format client: `npm run lint --prefix client`, `npm run format --prefix client`
- Package-specific tests: `npm test --prefix client`, `npm test --prefix server`
- Pre-commit: Husky runs `npm test`.

## Coding Style & Naming Conventions
- Indentation: 2 spaces. Use ES modules.
- Client: TypeScript, React 19, Vite. ESLint config in `client/eslint.config.js` (JS, TS, React Hooks, React Refresh). Format with Prettier.
- Naming: React components `PascalCase` (`MyWidget.tsx`), hooks `useCamelCase` in `client/src/hooks`, utilities `camelCase.ts`. Tests `*.test.ts`/`*.test.tsx` in `client/src/__tests__`.
- Server: keep route files and helpers in `server/src`. Prefer small, pure functions; sanitize inputs (see `sanitizeId`, `sanitizeText`).

## Testing Guidelines
- Framework: Vitest for both packages; client uses jsdom and RTL (`client/src/setupTests.ts`).
- Place UI tests under `client/src/__tests__`; mock IndexedDB with provided setup.
- Add API tests with Vitest + Supertest in `server/` when adding endpoints.
- Aim to cover reducers, hooks, and utility functions. Keep tests fast and deterministic.
- Unit tests for new features should have at least 60% code coverage 

## Commit & Pull Request Guidelines
- Prefer Conventional Commits (e.g., `feat:`, `fix:`). Keep subjects concise; include scope when helpful.
- PRs: describe intent, link issues, list notable changes; add screenshots for UI changes.
- Requirements: tests pass (`npm test`), client lint/format clean, update docs when behavior changes.

## Security & Configuration Tips
- Server reads `PORT`; default DB file is `fitness.db`. Do not commit secrets; use environment variables when adding config.
- Validate and sanitize all request data; do not remove existing sanitization.
