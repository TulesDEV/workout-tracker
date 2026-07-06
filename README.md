# Workout Tracker

Personal workout tracker: build programs, each with its own recurrence
schedule (specific weekdays or every N days), activate any number of them at
once, and log sets/reps/weight from an iPhone-installable PWA.

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
- **Program** — a single recurring workout (e.g. "Push Day"), with its own
  recurrence (specific weekdays or every N days from an anchor date) and
  `is_active` flag. Any number of programs can be active at once, each on its
  own schedule.
- **ProgramExercise** — target sets/reps/weight for an exercise within a
  program.
- **WorkoutSession** — a tracked instance of a program on a given date; set
  entries are auto-populated from the program's exercise targets when
  created.
- **SetEntry** — actual logged reps/weight/completion for one set.

## Tests

```bash
cd backend
uv run pytest
```

## Deploying to Railway

Both `backend/Dockerfile.production` and `frontend/Dockerfile.production` are
set up for production builds (migrations run on boot, Next.js standalone
output, gunicorn bound to Railway's `$PORT`). Create three Railway services
in one project — Postgres (plugin), backend, frontend — and set:

**Postgres**: just add the plugin; Railway provisions `DATABASE_URL`
automatically.

**Backend** (point at `backend/`, using `Dockerfile.production`):

| Variable | Value |
| --- | --- |
| `DATABASE_URL` | Reference the Postgres plugin's `DATABASE_URL` (Railway → Variables → "Add Reference") |
| `SECRET_KEY` | A real random secret — e.g. `python -c "import secrets; print(secrets.token_urlsafe(50))"`. Without this, one is regenerated on every restart and invalidates admin sessions. |
| `ALLOWED_HOSTS` | Your backend's Railway domain, e.g. `workout-tracker-backend.up.railway.app` |
| `CSRF_TRUSTED_ORIGINS` | `https://workout-tracker-backend.up.railway.app` (needed for the Django admin login form) |
| `CORS_ALLOWED_ORIGINS` | Your frontend's Railway URL, e.g. `https://workout-tracker.up.railway.app` (so the PWA can call the API) |

Leave `DEBUG` unset (defaults to off). `PORT` is injected by Railway
automatically — don't set it yourself.

**Frontend** (point at `frontend/`, using `Dockerfile.production`):

| Variable | Value |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | Your backend's Railway URL, e.g. `https://workout-tracker-backend.up.railway.app`. This is inlined at build time, so it must be set *before* the first build. |

Since there's no login, both the Django admin and the API are protected only
by not being publicly guessable — don't link the backend URL anywhere
public.
