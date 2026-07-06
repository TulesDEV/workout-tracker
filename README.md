# Workout Tracker

Personal workout tracker: build programs made of routines (with a recurrence
schedule), track one active program at a time, and log sets/reps/weight from
an iPhone-installable PWA.

- **Backend**: Django + Django REST Framework + PostgreSQL (`backend/`)
- **Frontend**: Next.js App Router + Tailwind (`frontend/`)
- No authentication — this is single-user and meant to run on a private
  deployment.

## Local development

```bash
docker compose up
```

This starts Postgres on `5432`, the Django API on `http://localhost:8000`,
and Next.js on `http://localhost:3000`.

Or run each side natively:

```bash
# backend
cd backend
uv sync
uv run python manage.py migrate
uv run python manage.py runserver

# frontend
cd frontend
npm install
npm run dev
```

The frontend calls the API directly from the browser (CORS-enabled), driven
by `NEXT_PUBLIC_API_URL` — see `.env.frontend` / `.env.backend` for local
defaults.

## Data model

- **Exercise** — reusable exercise library entry (name, category, equipment).
- **Program** — a training program; exactly one can be `is_active` at a time
  (enforced in `Program.save()`).
- **Routine** — a day within a program (e.g. "Push Day"), with a recurrence:
  either specific weekdays or every N days from an anchor date.
- **RoutineExercise** — target sets/reps/weight for an exercise within a
  routine.
- **WorkoutSession** — a tracked instance of a routine on a given date; set
  entries are auto-populated from the routine's targets when created.
- **SetEntry** — actual logged reps/weight/completion for one set.

## Tests

```bash
cd backend
uv run pytest
```

## Deploying to Railway

Both `backend/Dockerfile.production` and `frontend/Dockerfile.production` are
set up for production builds (migrations run on boot, Next.js standalone
output). Point Railway at each directory as a separate service, add a
Postgres plugin, and set:

- Backend: `DATABASE_HOST`, `DATABASE_NAME`, `DATABASE_USER`,
  `DATABASE_PASSWORD`, `ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS` (your Railway
  frontend URL), `SECRET_KEY`.
- Frontend: `NEXT_PUBLIC_API_URL` (your Railway backend URL).
