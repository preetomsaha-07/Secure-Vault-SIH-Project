# SecureVault

SecureVault is a role-based digital evidence management platform. It provides encrypted document storage, case management, controlled downloads, audit visibility, and security headers/rate limiting through an existing React and Express application.

## Stack

- Frontend: React 19, Vite 8
- Backend: Node.js, Express 5
- Database: PostgreSQL
- Security: bcrypt password hashing, JWT authentication, Helmet, rate limiting, AES-256-GCM file encryption

## Structure

```text
backend/       Express API, auth, RBAC, uploads, database schema
frontend/      React/Vite application
package.json   Root development and production commands
```

## Local setup

1. Install dependencies in both applications:

	```powershell
	npm install
	npm --prefix backend install
	npm --prefix frontend install
	```

2. Copy `backend/.env.example` to `backend/.env` and replace every placeholder.
3. Create a PostgreSQL database and apply `backend/db/schema.sql`.
4. Start the API and frontend in separate terminals:

	```powershell
	npm run start
	npm run dev
	```

	The frontend is available at `http://localhost:5173` and proxies `/api` to the API at `http://localhost:5000`.

## Environment variables

`DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `JWT_SECRET`, and `FILE_ENCRYPTION_KEY` are required. `FRONTEND_URL` controls allowed browser origins, and `TRUST_PROXY=true` should only be used behind a trusted reverse proxy.

Never commit `backend/.env` or real credentials.

## Commands

```powershell
npm run build       # production frontend bundle
npm run lint        # frontend lint
npm run start       # backend API
npm --prefix backend test
```

## Production deployment

Use a managed PostgreSQL provider, deploy the backend as a private Node service, and serve the Vite `frontend/dist` output through a CDN or reverse proxy. Route `/api` through the same public origin to avoid exposing database services or adding permissive CORS. Use persistent object storage for encrypted documents before running multiple backend replicas; the current local upload directory is suitable only for a single-instance deployment.

Set `NODE_ENV=production`, a strong random `JWT_SECRET`, a 64-character hexadecimal `FILE_ENCRYPTION_KEY`, production database credentials, the frontend origin, and `TRUST_PROXY=true` only when the platform supplies a trusted proxy.