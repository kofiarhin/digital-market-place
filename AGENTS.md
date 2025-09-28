# Preamble
Automate docs, tests, CI, and release chores while preserving the Digital Market Place code conventions.

# House Rules
- JavaScript only; no TypeScript anywhere in the repo.
- Styling stays in SCSS Modules named `ComponentName.styles.scss`; never introduce Tailwind.
- Use arrow functions for components, hooks, services, controllers, and utilities.
- Backend code uses CommonJS (`require`/`module.exports`) and respects the existing MVC split (`controllers/`, `models/`, `routes/`, `middleware/`, `utils/`).
- Frontend components must default export React components and rely on React Query plus custom hooks for server state.
- Avoid touching core business logic unless the task explicitly asks for it.
- Tests live where they belong: Jest + Supertest inside `/server`, Vitest inside `/client`.
- Follow existing naming, linting, and workspace layout.

# Repository Conventions
- Monorepo root (`package.json`) orchestrates workspaces for `/client` and `/server`. Root scripts include `dev` (concurrently runs `npm --prefix server run dev` and `npm --prefix client run dev`), `start` (runs `node server/index.js`), and a placeholder `test` script.
- Server entry: `server/index.js` wires Express, wildcard CORS, JSON body parsing (after Stripe webhook raw body), route mounting, and a `/health` endpoint. `connectToDatabase` expects `MONGO_URI` and starts listening on `PORT` (default `5000`).
- Routes & controllers: `/api/auth` (register, login, me), `/api/products` (list, detail, seller create), `/api/checkout/session` (Stripe Checkout), `/api/downloads/:orderId` + `/api/downloads/file/:token` (secure download flow), `/api/webhooks/stripe` (Stripe webhook using `express.raw`). Auth middleware decodes JWT via `JWT_SECRET`.
- Models: `User`, `Product`, `Order` defined with Mongoose. Utilities include download token helpers (JWT-based) and S3 signed URL generation.
- Environment variables already referenced: `MONGO_URI`, `PORT`, `JWT_SECRET`, `CLIENT_URL`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `DOWNLOAD_TOKEN_SECRET`, `AWS_REGION`, `AWS_BUCKET`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`. `.env.example` documents all of them. Client optionally reads `VITE_API_URL` to override the API base URL.
- Frontend: Vite + React 18, React Router, React Query, and centralized copy in `client/src/data/content.json`. Styles live in `client/src/styles/*.styles.scss` and are imported per component. Global styles applied through `app.styles.scss`.
- Testing: Server uses Jest with tests stored under `server/__tests__` (sample `health` test exists). Client Vitest command is configured but no specs yet.
- No GitHub Actions currently present. Deployment targets assume client on Vercel (build output `client/dist`) and server on Render/Heroku.

# Agent Roster & Responsibilities
- **DocsAgent**: Update README, contribution docs, env references, and API notes. Keeps language concise and uses tables or ordered steps when helpful.
- **CodegenAgent**: Build or extend features following current patterns (Express controllers/routes, React components with SCSS Modules). Always use arrow functions and default exports.
- **TestsAgent**: Author Jest + Supertest specs under `/server` and Vitest specs under `/client`. Maintains clear separation between packages.
- **ReleaseAgent**: Assemble changelogs, tags, and release notes from commit history. Honor any existing conventional commit style if present.
- **CI/CD Agent**: Create or update GitHub Actions to install, build, and test both workspaces without modifying application logic.
- **ContentAgent**: Expand marketing copy, feature highlights, or architecture notes—brief and focused—while keeping source-of-truth copy in `client/src/data/content.json`.

# Interaction Protocol
- **Inputs expected**: task summary, scope (files/directories), constraints (performance, style, dependencies), and any required tests. Always instruct agents to scan the repo (e.g., `rg`, `ls`) before editing.
- **Outputs required**: concise description plus unified diff or explicit file list. Avoid extra commentary.
- **Validation checklist**:
  - Code is JavaScript-only; backend modules use CommonJS.
  - SCSS Module filenames follow `ComponentName.styles.scss` and are imported locally.
  - Tests live in the correct workspace (`server/__tests__` or `client` with Vitest).
  - No secrets or `.env` files committed; update `.env.example` and README when adding env vars.
  - Relevant scripts succeed locally (`npm --prefix server run test`, `npm --prefix client run build`).

# Guardrails
- If a repo convention conflicts with higher-level instructions, follow the repo and mention the deviation in the PR description.
- Do not change files unrelated to the requested scope.
- When adding configuration that relies on env vars, document the keys in `.env.example` and the README immediately.

# Ready-to-Use Prompts
- **Add route + controller**
  ```
  You are CodegenAgent. First, scan the repo structure. Implement a new Express route and controller.
  Scope: server/controllers/<feature>Controller.js, server/routes/<feature>.js, optional server/models updates.
  Requirements: CommonJS modules, arrow functions, MVC separation, add Jest test under server/__tests__ if logic is significant.
  Output: unified diff for all touched files.
  ```
- **Create React component + SCSS module**
  ```
  You are CodegenAgent. Inspect client/src before editing. Build a new React component with matching SCSS Module.
  Scope: client/src/components/<Component>.jsx, client/src/components/<Component>.styles.scss, optional hook usage.
  Requirements: arrow function, default export, import SCSS Module, rely on data hooks where available.
  Output: unified diff for all touched files.
  ```
- **Write Jest+Supertest for route**
  ```
  You are TestsAgent. Review existing server tests. Add coverage for <route>.
  Scope: server/__tests__/<route>.test.js (new or updated), ensure setup uses supertest against server/index.js.
  Requirements: keep tests isolated, mock external services as needed.
  Output: unified diff for test files.
  ```
- **Write Vitest for component**
  ```
  You are TestsAgent. Examine client testing setup, then create a Vitest spec for <Component>.
  Scope: client/src/<path>/<Component>.test.jsx.
  Requirements: use testing-library if installed or add lightweight tests, mock hooks if necessary.
  Output: unified diff for new/changed files.
  ```
- **Update README sections**
  ```
  You are DocsAgent. Read current README and related docs. Update sections: <list>.
  Scope: README.md (and linked docs if needed).
  Requirements: keep tone concise, include tables or steps when helpful.
  Output: unified diff summarizing Markdown updates.
  ```
- **Adjust CI for Node version / matrix**
  ```
  You are CI/CD Agent. Inspect existing GitHub Actions. Update workflow to run Node.js <version/matrix> for client and server jobs.
  Scope: .github/workflows/<file>.yml.
  Requirements: install workspaces, run npm --prefix server run test, npm --prefix client run build.
  Output: unified diff for workflow files.
  ```

# Examples
- **Express controller & route snippet**
  ```js
  // server/controllers/pingController.js
  const ping = async (req, res) => res.json({ pong: true });

  module.exports = { ping };
  ```
  ```js
  // server/routes/ping.js
  const express = require("express");
  const { ping } = require("../controllers/pingController");

  const router = express.Router();

  router.get("/", ping);

  module.exports = router;
  ```
- **React component + SCSS module snippet**
  ```jsx
  // client/src/components/Badge.jsx
  import styles from "./Badge.styles.scss";

  const Badge = ({ label }) => <span className={styles.badge}>{label}</span>;

  export default Badge;
  ```
  ```scss
  /* client/src/components/Badge.styles.scss */
  .badge {
    display: inline-flex;
    align-items: center;
    padding: 0.25rem 0.5rem;
    border-radius: 9999px;
    background: #1d4ed8;
    color: #f8fafc;
    font-size: 0.75rem;
  }
  ```
