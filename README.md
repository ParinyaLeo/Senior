# Senior Event Stock Manager

Next.js application for managing events, equipment, stock, and notifications.

## PostgreSQL Setup

The app now persists notifications and events in PostgreSQL.

1. Start PostgreSQL (example via Docker):

```bash
docker run --name senior-postgres \
	-e POSTGRES_USER=postgres \
	-e POSTGRES_PASSWORD=postgres \
	-e POSTGRES_DB=senior_events \
	-p 5432:5432 \
	-d postgres:16
```

2. Create environment file:

```bash
cp .env.example .env
```

3. Run the app:

```bash
npm install
npm run dev
```

## Environment Variables

Set these in `.env`:

```env
DATABASE_URL=postgres://postgres:postgres@localhost:5432/senior_events
PGSSLMODE=disable
```

## Event Sync (PostgreSQL)

`components/pages/Events.tsx` now syncs with the database through API routes:

- `GET /api/events` loads events
- `POST /api/events` creates events
- `PATCH /api/events/:id` saves equipment decision/status updates
- `DELETE /api/events/:id` deletes events

Tables are auto-created by `lib/db.ts` on first access:

- `notifications`
- `events`
