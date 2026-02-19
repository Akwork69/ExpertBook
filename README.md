# ExpertBook

Expert booking application built with React, TypeScript, Tailwind CSS, and Supabase.

## Features

- Expert listing with search, category filter, pagination, loading/error states
- Expert detail with date-grouped slots and realtime slot updates
- Booking flow with validation and booking success state
- My Bookings by email with status tracking (Pending, Confirmed, Completed)
- Optional backend API layer (`backend/`) using Express

## Tech Stack

- Vite
- React + TypeScript
- Tailwind CSS + shadcn/ui
- Supabase
- TanStack Query

## Environment Variables

Copy `.env.example` to `.env` and fill values:

```sh
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
VITE_API_BASE_URL=http://localhost:4000
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
PORT=4000
```

`VITE_API_BASE_URL` is optional:
- If set, frontend uses backend API first.
- If omitted, frontend reads/writes directly via Supabase client.

## Run Locally

```sh
npm install
npm run dev
```

Optional backend:

```sh
npm run server
```
