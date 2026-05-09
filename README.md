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

## What I'd add with more time

- TypeScript
- Full test coverage
- CSV export
- Password reset flow
- Better UI polish

