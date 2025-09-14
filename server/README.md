# FitTrack Server

Express API that also serves the built client app.

## Configuration

The server reads configuration from environment variables and an optional `.env` file located in `server/.env`.

- PORT: Port to listen on (default: `3000`).
- HOST: IP/hostname to bind (default: `0.0.0.0`). You may also use `IP`.
- DB_PATH: Path to the SQLite database file (default: `fitness.db`). Use `:memory:` only for tests.
- NODE_ENV: Set to `production` to disable dev-only endpoints; otherwise `development`.

Copy `.env.example` to `.env` and modify as needed:

```
cp server/.env.example server/.env
```

## Scripts

- `npm start` — start the server (reads config as above)
- `npm test` — run API tests
- `npm run build` — no-op placeholder

The monorepo root also provides `npm start` which runs this package.

## Notes

- Tests use an in-memory DB stub when `DB_PATH=':memory:'` to avoid native module requirements.
- Production and development (with file DB paths) use `better-sqlite3` for performance.

## Architecture

- Entry: `src/index.js`
  - Loads `.env`, initializes DB schema, configures Express, serves static client.
  - Registers route modules and returns `{ app, db }` via `createServer()`.
- Routes: `src/routes/`
  - `meals.js` — `/v1/meals`
  - `activities.js` — `/v1/activities`
  - `workouts.js` — `/v1/workouts`
  - `weights.js` — `/v1/weights`
  - `dev.js` — `/v1/_dev/populate`, `/v1/_dev/clear` (disabled when `NODE_ENV=production`)
- Utilities
  - `src/sanitize.js` — `sanitizeId`, `sanitizeText`, `sanitizeNumber`
  - In tests or when `DB_PATH=':memory:'`, a lightweight in-memory DB is used inside `index.js` to mimic the SQL used by the routes.

## Endpoints

All endpoints return JSON. Timestamps are numbers (ms since epoch).

- Meals
  - POST `/v1/meals` — body: `{ id, userId?, type?, name, calories, items?[], occurredAt, updatedAt, clientTag? }`
  - PUT `/v1/meals/:id` — body: same as POST (fields updated)
  - GET `/v1/meals?since=<ms>` — returns `{ items: Meal[], syncStamp }`
  - DELETE `/v1/meals/:id` — returns `{ deleted: boolean }`

- Activities
  - POST `/v1/activities` — body: `{ id, userId?, kind, distanceKm?, durationSec, steps?, samples?[], startedAt?, endedAt?, updatedAt, clientTag? }`
  - PUT `/v1/activities/:id` — body: same as POST (fields updated)
  - GET `/v1/activities?since=<ms>` — returns `{ items: Activity[], syncStamp }`
  - DELETE `/v1/activities/:id` — returns `{ deleted: boolean }`

- Workouts
  - POST `/v1/workouts` — body: `{ id, userId?, name, reps?[], updatedAt, clientTag? }`
  - PUT `/v1/workouts/:id` — body: same as POST (fields updated)
  - GET `/v1/workouts?since=<ms>` — returns `{ items: Workout[], syncStamp }`
  - DELETE `/v1/workouts/:id` — returns `{ deleted: boolean }`

- Weights
  - POST `/v1/weights` — body: `{ id, userId?, kg, occurredAt, updatedAt, clientTag? }`
  - PUT `/v1/weights/:id` — body: same as POST (fields updated)
  - GET `/v1/weights?since=<ms>` — returns `{ items: WeightEntry[], syncStamp }`
  - DELETE `/v1/weights/:id` — returns `{ deleted: boolean }`

- Static client
  - GET `*` — serves `client/dist/index.html` and static assets

- Dev utilities (disabled when `NODE_ENV=production`)
  - POST `/v1/_dev/populate` — clears DB and inserts realistic sample data
  - POST `/v1/_dev/clear` — deletes all rows in `meals`, `activities`, `workouts`, `weights`

## Data Model

- Meal
  - id, userId, type, name, calories, items[], occurredAt, updatedAt, clientTag
- Activity
  - id, userId, kind, distanceKm, durationSec, steps, samples[], startedAt, endedAt, updatedAt, clientTag
- Workout
  - id, userId, name, reps[], updatedAt, clientTag
- WeightEntry
  - id, userId, kg, occurredAt, updatedAt, clientTag

Notes
- Arrays (`items`, `samples`, `reps`) are stored as JSON in SQLite but the API accepts/returns arrays.
  - Weights persist as `valueKg` in the DB; the API uses `kg` in payloads and responses.
    This mapping is transparent to clients.

### Sanitization

- IDs: sanitized to alphanumeric and dash via `sanitizeId`.
- Text: stripped of non-word/space/dash via `sanitizeText`.
- Numbers: clamped/coerced via `sanitizeNumber`.
