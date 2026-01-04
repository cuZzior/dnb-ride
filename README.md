# DnB On The Bike - Project Documentation

**Current State:** Sprint 4 Completed (January 2026)
**Description:** A global discovery platform for Drum & Bass cycling events ("DnB On The Bike").

## Quick Start

### 1. Server (Rust)

The server runs on port **3001**.

```bash
cd server

# Create .env file with required variables (see Environment Variables below)
cargo run
```

**Required:** The server will not start without `ADMIN_API_KEY` environment variable.

### 2. UI (Next.js)

The UI runs on port **3000** and proxies requests to the server.

```bash
cd ui

# Create .env.local file with required variables (see Environment Variables below)
npm install
npm run dev
```

---

## Architecture

The project is a monorepo-style structure:

- **`/server`**: Rust API server (Axum + SQLite).
- **`/ui`**: Next.js 16 application (React + TypeScript).
- **`dnb_events.db`**: SQLite database file (created automatically in server/).

### Tech Stack

**Frontend:**
- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + Custom Glassmorphism (CSS Variables)
- **Map:** Mapbox GL JS
- **Icons:** Lucide React
- **PWA:** Manifest, Meta tags configured

**Backend:**
- **Language:** Rust (2021 edition)
- **Web Framework:** Axum 0.7
- **Database:** SQLite (via SQLx)
- **Runtime:** Tokio
- **Validation:** Validator crate

---

## Environment Variables

You must create these files manually. They are gitignored for security.

### Server: `server/.env`

```env
# Database configuration
DATABASE_URL=sqlite:dnb_events.db?mode=rwc

# Admin Authentication (REQUIRED - app won't start without this)
ADMIN_API_KEY=your-secure-secret-key

# Server Configuration
PORT=3001
ALLOWED_ORIGIN=http://localhost:3000
```

### UI: `ui/.env.local`

```env
# Server API URL
NEXT_PUBLIC_API_URL=http://localhost:3001/api

# Mapbox Token (REQUIRED - get from https://mapbox.com)
NEXT_PUBLIC_MAPBOX_TOKEN=pk.your_mapbox_token_here
```

---

## Database Schema

**`events` Table**
- `id`: INTEGER PK
- `title`: TEXT
- `description`: TEXT
- `organizer`: TEXT
- `organizer_id`: INTEGER FK -> organizers.id
- `location_name`: TEXT (City, Country)
- `country`: TEXT (Added in Sprint 4 for filtering)
- `latitude`: REAL
- `longitude`: REAL
- `event_date`: DATETIME
- `image_url`: TEXT
- `video_url`: TEXT (YouTube link for past events)
- `event_link`: TEXT (External event page)
- `status`: TEXT (pending, approved, rejected)

**`organizers` Table**
- `id`: INTEGER PK
- `name`: TEXT
- `slug`: TEXT
- `description`: TEXT

**`video_suggestions` Table**
- `id`: INTEGER PK
- `event_id`: INTEGER FK -> events.id
- `video_url`: TEXT
- `status`: TEXT (pending, approved, rejected)

---

## API Endpoints

**Public:**
- `GET /api/events` - List all upcoming/recent events (filterable)
- `GET /api/organizers` - List all organizers
- `POST /api/events` - Submit a new event (pending approval)
- `POST /api/suggestions` - Suggest a video for a past event

**Admin (Requires `X-Admin-Key` header):**
- `GET /api/admin/events` - List all events (including pending/rejected)
- `PUT /api/admin/events/:id` - Update event details
- `PATCH /api/admin/events/:id/approve` - Approve event
- `PATCH /api/admin/events/:id/reject` - Reject event
- `DELETE /api/admin/events/:id` - Delete event
- `GET /api/admin/suggestions` - List pending video suggestions
- `PATCH /api/admin/suggestions/:id/approve` - Approve suggestion (updates event video_url)
- `PATCH /api/admin/suggestions/:id/reject` - Reject suggestion

---

## UI Features

- **Interactive Map:** Displays events with global pins. Pins highlight on selection.
- **Sidebar Filtering:**
  - **Time:** Upcoming / Past events status.
  - **Country:** Filters events based on the `country` column.
  - **Organizer:** Filter by specific organizer.
  - **Near Me:** Sorts events by distance to user's geolocation.
- **Event Details:** Modal with YouTube embed, directions, and external links.
- **Video Suggestions:** Users can suggest videos for past events.
- **Admin Panel:** `/admin` route for managing events and suggestions.
- **PWA:** Installable on mobile, optimized viewport/safe-areas.
- **UI:** Dark mode, glassmorphism aesthetics, vibrant pink/cyan palette.
