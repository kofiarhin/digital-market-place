# Digital Market Place
Launch-ready MERN marketplace for selling and delivering digital downloads with secure checkout and expiring download links.

## Quick Start
1. **Prerequisites**
   - Node.js 18+
   - MongoDB Atlas cluster (or local Mongo instance)
   - Stripe account (test keys) and AWS-compatible object storage for assets
2. **Install dependencies**
   ```bash
   npm install
   npm --prefix server install
   npm --prefix client install
   ```
3. **Environment variables**
   - Copy `.env.example` to `.env` and fill in the required keys before running the apps.
4. **Run the stack in development**
   ```bash
   npm run dev
   ```
   The command runs the Express API on **http://localhost:5000** and the Vite dev server on **http://localhost:5173**.

## Project Structure
```
.
├── AGENTS.md                # Agent playbook and conventions
├── client/
│   ├── src/
│   │   ├── api/             # Fetch wrappers and API helpers
│   │   ├── context/         # Auth provider and hooks
│   │   ├── data/content.json# Centralized marketing copy
│   │   ├── hooks/           # React Query hooks
│   │   ├── pages/           # Route-level React components
│   │   └── styles/          # SCSS Modules (camelCase names)
│   └── vite.config.js       # Vite + SCSS module configuration
├── server/
│   ├── controllers/         # Express controllers (CommonJS)
│   ├── middleware/          # Auth middleware
│   ├── models/              # Mongoose models (User, Product, Order)
│   ├── routes/              # Route definitions mounted in index.js
│   ├── utils/               # Download token + S3 helpers
│   └── __tests__/           # Jest + Supertest suites
├── .env.example             # Documented env vars for server & client
└── package.json             # Root scripts orchestrating workspaces
```

## Environment Variables
| Key | Location | Description | Required |
| --- | --- | --- | --- |
| `MONGO_URI` | Server | MongoDB connection string used on boot. | Yes |
| `PORT` | Server | Port for Express (defaults to 5000). | Optional |
| `JWT_SECRET` | Server | Secret for user auth tokens and auth middleware. | Yes |
| `CLIENT_URL` | Server | Base URL used for Stripe success/cancel redirects. | Yes |
| `STRIPE_SECRET_KEY` | Server | Stripe secret key for Checkout sessions and webhooks. | Yes |
| `STRIPE_WEBHOOK_SECRET` | Server | Validates Stripe webhook signatures. | Yes |
| `DOWNLOAD_TOKEN_SECRET` | Server | Signs short-lived download JWTs. | Yes |
| `AWS_REGION` | Server | Region for S3-compatible storage client. | Yes |
| `AWS_BUCKET` | Server | Bucket containing protected digital assets. | Yes |
| `AWS_ACCESS_KEY_ID` | Server | Access key for storage client. | Yes |
| `AWS_SECRET_ACCESS_KEY` | Server | Secret key for storage client. | Yes |
| `VITE_API_URL` | Client | Overrides the default API base (`http://localhost:5000`). | Optional |

> Keep secrets in `.env`; never commit `.env` files. Update `.env.example` whenever a new variable is introduced.

## Scripts
### Root (`package.json`)
| Script | Description |
| --- | --- |
| `npm run dev` | Runs server and client concurrently via `concurrently`. |
| `npm run dev:server` | Delegates to `npm --prefix server run dev`. |
| `npm run dev:client` | Delegates to `npm --prefix client run dev`. |
| `npm start` | Starts the Express API (`node server/index.js`). |
| `npm test` | Placeholder (prints "(optional) add tests later"). |

### Server (`server/package.json`)
| Script | Description |
| --- | --- |
| `npm run dev` | Watches `index.js` with nodemon. |
| `npm start` | Launches the API (`node index.js`). |
| `npm test` | Runs Jest + Supertest suites. |

### Client (`client/package.json`)
| Script | Description |
| --- | --- |
| `npm run dev` | Starts Vite dev server on port 5173. |
| `npm run build` | Builds production assets to `client/dist`. |
| `npm run preview` | Serves the production build locally. |
| `npm test` | Runs Vitest. |

## API Overview
| Method | Path | Description | Auth |
| --- | --- | --- | --- |
| GET | `/health` | Liveness probe for the API. | None |
| POST | `/api/auth/register` | Register buyer or seller accounts. | Public |
| POST | `/api/auth/login` | Authenticate and receive JWT. | Public |
| GET | `/api/auth/me` | Fetch current user profile. | Bearer JWT |
| GET | `/api/products` | List all products (newest first). | Public |
| GET | `/api/products/:slug` | Retrieve a product by slug. | Public |
| POST | `/api/products` | Create a product listing (sellers only). | Bearer JWT (role `seller`) |
| POST | `/api/checkout/session` | Create Stripe Checkout session for a product. | Bearer JWT |
| GET | `/api/downloads/:orderId` | Request a short-lived download token for an order. | Bearer JWT |
| GET | `/api/downloads/file/:token` | Exchange token for signed asset URL. | Bearer JWT + token |
| POST | `/api/webhooks/stripe` | Stripe webhook (expects `express.raw` body + signature). | Stripe |

## Frontend Notes
- Built with React 18, React Router, and React Query. Custom hooks in `client/src/hooks` encapsulate data fetching.
- All styling lives in SCSS Modules (`*.styles.scss`) with camelCase class exports and local scoping configured in `vite.config.js`.
- Marketing and UI copy is centralized in `client/src/data/content.json`; components read from that JSON instead of hardcoding text.
- Global base styles are applied through `client/src/styles/app.styles.scss` and imported once in `main.jsx`.

## Deployment
### Client (Vercel)
- **Root directory:** `client`
- **Install command:** `npm install`
- **Build command:** `npm run build`
- **Output directory:** `dist`
- **Environment variables:** Set `VITE_API_URL` to your deployed API origin.

### Server (Render)
- **Service root:** `server`
- **Build command:** `npm install`
- **Start command:** `npm start`
- **Health check path:** `/health`
- **Environment variables:** Provide all server keys from `.env.example`.

### Server (Heroku)
- Create a `web` dyno pointing at `node index.js` inside `/server` (e.g., `Procfile` entry `web: node index.js`).
- Set config vars for every server environment variable plus `NODE_ENV=production`.
- Ensure MongoDB Atlas network rules allow Heroku/Render outbound IPs.

## Testing
- **Server:** `npm --prefix server run test` (Jest + Supertest).
- **Client:** `npm --prefix client run test` (Vitest).
- Add new specs alongside existing folders (`server/__tests__` or `client/src/**`) following the patterns already in place.

## Security & Ops Checklist
- ✅ CORS is enabled globally with a wildcard origin (tighten for production).
- ☐ Add rate limiting (e.g., `express-rate-limit`) for auth and checkout routes.
- ☐ Add security headers (Helmet) once production-ready.
- ☐ Enforce request validation (e.g., Joi/Zod) for external inputs.
- ✅ Download tokens are short-lived JWTs; ensure secret rotation policy.
- ✅ Stripe webhooks verify signatures using `STRIPE_WEBHOOK_SECRET`.
- ✅ Store secrets in environment variables and keep Mongo Atlas IP allowlist updated.
- ☐ Configure production logging/monitoring (e.g., structured logs to CloudWatch).

## License & Contribution
- License: MIT (placeholder — update if different licensing is required).
- Contributions: open pull requests with focused diffs, follow the conventions in `AGENTS.md`, and document any new environment variables or scripts.
