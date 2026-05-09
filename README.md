# Oli — Attendance App

A monthly attendance tracking app built as a take-home assignment.

## Quick Start

```bash
docker compose up --build
```

Then open: `http://localhost:5173`

## Seeded Users (all password: `password123`)

| Email | Seeded data |
|-------|-------------|
| bruncla@oli.dev | April 2026 fully seeded |
| jarekparek@oli.dev | April 2026 fully seeded |
| dolakskolak@oli.dev | No data |

## Tech Stack

- **Backend:** Node.js + Express + Prisma + PostgreSQL + JWT
- **Frontend:** React + Vite + Tailwind CSS
- **Infrastructure:** Docker Compose

## Reset Database

```bash
docker compose down -v
docker compose up --build
```

## Validation Rules

- No future dates
- Max 1440 minutes per day
- Date must match attendance month/year
- Users can only see/edit their own data

## Security notes

- **Login rate limit:** `POST /auth/login` allows **10 requests per 15 minutes per IP** (via `express-rate-limit`). Set `TRUST_PROXY=1` behind a reverse proxy so the client IP is correct.
- **JWT lifetime:** Default **24 hours** (`JWT_EXPIRES_IN`, e.g. `24h` or `7d`). Shorter access tokens reduce damage if stolen; users sign in again more often. A **refresh-token** flow would improve UX without keeping long-lived bearer tokens in `localStorage`.
- **CORS:** Allowed origins come from `CORS_ORIGIN` (comma-separated). If unset, defaults to `http://localhost:5173` and `http://127.0.0.1:5173`.
- **HTTP headers:** `helmet` sets standard security headers (e.g. `X-Content-Type-Options`, `X-Frame-Options` via frameguard).
- **Assignments:** Only `GET /assignments` exists; there is **no** API for users to create or modify assignments (seed/admin only).

## What I'd add with more time

- TypeScript
- Full test coverage
- CSV export
- Password reset flow
- Better UI polish

