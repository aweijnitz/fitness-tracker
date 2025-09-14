# FitTrack Server

Express API that also serves the built client app.

## Configuration

The server reads configuration from environment variables and an optional `.env` file located in `server/.env`.

- PORT: Port to listen on (default: `3000`).
- HOST: IP/hostname to bind (default: `0.0.0.0`). You may also use `IP`.
- DB_PATH: Path to the SQLite database file (default: `fitness.db`). Use `:memory:` only for tests.

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

