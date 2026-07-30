# CCC Portal — IIM Amritsar

A full-stack prototype for a unified website bringing together all Committees, Clubs, and Cells (CCC) at IIM Amritsar. Built with Node.js, Express, and SQLite (via Node's built-in `node:sqlite` module — no native compiling required).

Built for Round 5 of the IT Committee Junior Coordinator Selection.

## Stack

- **Backend:** Node.js + Express — REST API
- **Database:** SQLite (file-based, no separate DB server needed) — via Node's built-in `node:sqlite`, so there's nothing to compile on install
- **Frontend:** Plain HTML/CSS/JS (no framework, no build step) — served as static files by Express

## Setup

Requires **Node.js 22.5 or newer** installed (needed for the built-in `node:sqlite` module). Check your version with `node -v`.

```bash
# 1. Install dependencies
npm install

# 2. Create and seed the database (run once, or anytime you want to reset data)
npm run seed

# 3. Start the server
npm start
```

Then open **http://localhost:3000** in your browser.

## What's seeded

15 real IIM Amritsar bodies (Committees, Clubs, Cells) with sample updates, resources, and a POC per body — see `db/seed.js` to edit or add more.

## API Reference

| Method | Route | Purpose |
|---|---|---|
| GET | `/api/bodies` | List all bodies. Supports `?category=`, `?tag=`, `?search=` query params |
| GET | `/api/bodies/:id` | Full detail for one body (updates, resources, tags) |
| POST | `/api/bodies` | Create a new body — `{ name, category, description, poc_name, poc_contact }` |
| POST | `/api/bodies/:id/updates` | Post an update/announcement for a body — `{ title, tag }` (`tag` is `recruiting`/`event`/`deadline`/`none`) |
| POST | `/api/bodies/:id/resources` | Add a resource link — `{ title, url }` |
| GET | `/api/bodies/:id/queries` | List student queries for a body |
| POST | `/api/bodies/:id/queries` | Post a new student query — `{ question }` |
| PATCH | `/api/queries/:id/answer` | Answer a pending query — `{ answer }` |
| GET | `/api/stats` | Dashboard totals: bodies, recruiting count, deadline count |

## Project structure

```
ccc-portal/
├── server.js           # Express app + all API routes
├── db/
│   ├── schema.sql       # Table definitions
│   ├── database.js      # DB connection (creates ccc.db on first run)
│   └── seed.js          # Populates the 15 real bodies with sample data
├── public/
│   └── index.html        # Frontend — fetches live data from the API
└── package.json
```

## Resetting the database

Delete `db/ccc.db` (and `db/ccc.db-wal` / `db/ccc.db-shm` if present) and re-run `npm run seed`.

## Deploying it live

This runs anywhere Node is available. Free options that work well for a student project:

- **Render.com** — connect the repo, set start command to `npm start`, done.
- **Railway.app** — same idea, has a free tier.
- Avoid static-only hosts (Netlify Drop, GitHub Pages) — those can't run the Express backend, only the frontend files.

## Notes for the presentation

- The `admin panel` described in the pitch (a simple form per body to post updates) maps directly to `POST /api/bodies/:id/updates` — for the demo you can show this working via the browser's dev tools/Postman, or build a small `/admin` HTML form on top of it if there's time before Round 5.
- The tag/filter system (Recruiting Now / Event This Week / Deadline in 48h) is driven entirely by the `tag` column on the `updates` table — extending it (e.g. adding a new tag type) only requires a schema + frontend chip change.
