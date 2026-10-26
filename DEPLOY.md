# Deploying the empty shell

Order: **database → API → frontend → update API CORS**.

## 1. MySQL 8 (online)

Render has no managed MySQL, so host it on one of:

- **Railway** — New → Database → MySQL. Copy the `MYSQL_PUBLIC_URL` (or private URL if the API also runs on Railway).
- **Aiven for MySQL** (free tier) or **TiDB Cloud Serverless** (MySQL-compatible).

Use the connection string as `DATABASE_URL`, e.g.
`mysql://USER:PASS@HOST:PORT/sfsh?charset=utf8mb4` (append `&sslaccept=strict` if the provider requires TLS).

Seed demo data once from your machine:

```bash
cd api
DATABASE_URL="<production url>" npx prisma migrate deploy
DATABASE_URL="<production url>" npm run db:seed
```

## 2. API — Render (root `api`)

Option A — Blueprint: Render → New → Blueprint → pick this repo. `render.yaml` creates `sfsh-api` with:

- Root directory `api`, build `npm ci && npx prisma generate && npx prisma migrate deploy`, start `npm start`
- Health check `/api/health`, `JWT_SECRET` auto-generated

Then set in the dashboard: `DATABASE_URL`, `CORS_ORIGINS` (your Vercel URL).

Option B — Railway: New → GitHub repo → set **Root Directory** = `api`. `api/railway.json` configures build, `prisma migrate deploy` (pre-deploy) and start. Add variables `DATABASE_URL` (reference the MySQL service), `JWT_SECRET`, `CORS_ORIGINS`, `NODE_ENV=production`.

Check: `curl https://<api-host>/api/health` → `{"success":true,"data":{"status":"ok"},...}`.

Public API docs (Swagger UI): `https://<api-host>/api-docs` — log in via `POST /api/auth/login`, then paste `data.token` into **Authorize**.

## 3. Frontend — Vercel (root `client`)

Vercel → Add New Project → import repo → **Root Directory** = `client` (framework Vite is auto-detected; `client/vercel.json` adds the SPA rewrite).

Environment variable: `VITE_API_URL=https://<api-host>` (no trailing slash). Redeploy after changing it — Vite inlines it at build time.

## 4. Finish

Set the API's `CORS_ORIGINS` to the Vercel URL(s), comma-separated (e.g. `https://sfsh.vercel.app,https://sfsh-git-main-team.vercel.app`), and redeploy the API.

Smoke test: open the Vercel URL → register → you land on the empty dashboard shell → reload keeps you logged in.

| Variable | Where | Value |
|---|---|---|
| `DATABASE_URL` | API | MySQL connection string |
| `JWT_SECRET` | API | long random string |
| `CORS_ORIGINS` | API | Vercel URL(s) |
| `NODE_ENV` | API | `production` |
| `VITE_API_URL` | Client | API base URL |
