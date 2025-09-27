# MultiSeller Digital Store

A monorepo for a multi-seller digital marketplace powered by a React (Vite) frontend and an Express + MongoDB backend.

## Project structure

```
/
├── client   # React + Vite application
├── server   # Express + MongoDB API
└── package.json # Root scripts for orchestration
```

## Getting started

1. Install dependencies:
   ```bash
   npm install
   npm --prefix server install
   npm --prefix client install
   ```
2. Provide environment variables in a `.env` file at the project root (see `server/config/environment.js` for required keys).
3. Start the development environment:
   ```bash
   npm run dev
   ```

## Testing

- Backend tests: `npm run test:server`
- Frontend tests: `npm run test:client`

## Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Runs server and client concurrently |
| `npm run server` | Starts the server in watch mode (delegates to `server/`) |
| `npm run client` | Starts the Vite dev server |
| `npm test` | Runs backend tests |
| `npm run test:client` | Runs frontend tests |

## Additional notes

- All environment secrets must be provided via `.env` and are required at runtime.
- Frontend copy is sourced from a single JSON file to keep site messaging centralized.
- Rate limits and download token defaults follow the product specification and can be tuned via environment variables.
