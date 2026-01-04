# AGENTS.md - AI Agent Guidelines

This document provides conventions and commands for AI agents working in this codebase.

## Project Structure

```
/server     - Rust API (Axum + SQLite)
/ui         - Next.js 16 frontend (React 19 + TypeScript)
```

## Build & Run Commands

### Server (Rust)

```bash
cd server

# Development
cargo run                    # Start dev server (port 3001)
cargo check                  # Type check without building
cargo build                  # Build debug binary
cargo build --release        # Build production binary

# Linting & Formatting
cargo clippy                 # Run linter (fix all warnings)
cargo fmt                    # Format code
cargo fmt -- --check         # Check formatting without changing

# Testing
cargo test                   # Run all tests
cargo test <test_name>       # Run single test by name
cargo test -- --nocapture    # Run tests with stdout visible
```

### UI (Next.js)

```bash
cd ui

# Development
npm install                  # Install dependencies
npm run dev                  # Start dev server (port 3000)
npm run build                # Production build
npm start                    # Start production server

# Linting
npm run lint                 # Run ESLint
```

### Full Stack Development

Run both services (in separate terminals):
```bash
# Terminal 1: Server
cd server && cargo run

# Terminal 2: UI
cd ui && npm run dev
```

## Environment Variables

**Never commit .env files.** They are gitignored.

### Server: `server/.env`
```env
DATABASE_URL=sqlite:dnb_events.db?mode=rwc
ADMIN_API_KEY=your-secure-secret-key    # REQUIRED
PORT=3001
ALLOWED_ORIGIN=http://localhost:3000
```

### UI: `ui/.env.local`
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_MAPBOX_TOKEN=pk.your_token  # REQUIRED
```

---

## Code Style - Rust (Server)

### Imports
Group imports in order: std, external crates, local modules.
```rust
use std::sync::Arc;

use axum::{extract::State, Json, Router};
use sqlx::SqlitePool;

use crate::models::Event;
use crate::AppState;
```

### Naming
- **Types/Structs**: `PascalCase` - `EventsResponse`, `CreateEventRequest`
- **Functions**: `snake_case` - `list_events`, `check_admin_auth`
- **Constants**: `SCREAMING_SNAKE_CASE`
- **Modules**: `snake_case` - `db.rs`, `routes.rs`, `models.rs`

### Error Handling
- Use `anyhow::Result` for application errors in main/init
- Return `Result<T, StatusCode>` from route handlers
- Map errors with `.map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?`
- Use `?` operator for propagation

```rust
async fn get_event(...) -> Result<Json<Event>, StatusCode> {
    let event: Event = sqlx::query_as("SELECT ...")
        .bind(id)
        .fetch_optional(&state.db)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
        .ok_or(StatusCode::NOT_FOUND)?;
    
    Ok(Json(event))
}
```

### Structs & Derives
Standard derive order: `Debug, Clone, Serialize, Deserialize, FromRow`
```rust
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Event {
    pub id: i64,
    pub title: String,
    // ...
}
```

### Validation
Use `validator` crate with derive macros:
```rust
#[derive(Debug, Deserialize, Validate)]
pub struct CreateEventRequest {
    #[validate(length(min = 3))]
    pub title: String,
    #[validate(url)]
    pub image_url: Option<String>,
}
```

### SQL Queries
- Use raw string literals `r#"..."#` for multi-line SQL
- Always bind parameters with `.bind()` - never interpolate
- Use `query_as` for typed results, `query` for writes

---

## Code Style - TypeScript (UI)

### Imports
Order: React, external libs, local components, local utils, types.
```typescript
'use client';

import { useEffect, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { MapPin, Clock } from 'lucide-react';

import { Header, Sidebar, Footer } from '@/components';
import { fetchEvents } from '@/lib/api';
import { Event, Filters } from '@/types';
```

### Naming
- **Components**: `PascalCase` - `EventCard.tsx`, `SuggestVideoModal.tsx`
- **Hooks/Functions**: `camelCase` - `fetchEvents`, `handleFilterChange`
- **Types/Interfaces**: `PascalCase` - `Event`, `Filters`
- **Files**: `PascalCase` for components, `camelCase` for utilities

### Component Structure
```typescript
interface ComponentProps {
    event: Event;
    onClick?: () => void;
    isSelected?: boolean;
}

export default function EventCard({ event, onClick, isSelected }: ComponentProps) {
    // Hooks first
    const [state, setState] = useState<string>('');
    
    // Memoized values
    const computed = useMemo(() => /* ... */, [deps]);
    
    // Callbacks
    const handleClick = useCallback(() => /* ... */, [deps]);
    
    // Effects last before return
    useEffect(() => { /* ... */ }, []);
    
    return (/* JSX */);
}
```

### Types
- Define interfaces in `src/types/index.ts`
- Use `null` for nullable API fields: `description: string | null`
- Use `undefined` for optional props: `onClick?: () => void`
- Export response types: `EventsResponse`, `OrganizersResponse`

### API Functions
```typescript
export async function fetchEvents(): Promise<Event[]> {
    const res = await fetch(`${API_BASE}/events`);
    if (!res.ok) throw new Error('Failed to fetch events');
    const data: EventsResponse = await res.json();
    return data.events;
}
```

### Styling
- Use Tailwind CSS with CSS variables for theming
- CSS variables defined in `globals.css`: `var(--color-primary)`, `var(--color-surface)`
- Glassmorphism pattern: `bg-[var(--color-surface-light)] backdrop-blur`

---

## Key Patterns

### State Management (UI)
- React hooks for local state
- Props drilling for component communication
- No external state library

### Route Handler Pattern (Server)
```rust
pub fn events_router() -> Router<Arc<AppState>> {
    Router::new()
        .route("/", get(list_events).post(create_event))
        .route("/:id", get(get_event))
}

async fn list_events(
    State(state): State<Arc<AppState>>,
) -> Result<Json<EventsResponse>, StatusCode> {
    // implementation
}
```

### Admin Auth (Server)
Admin routes require `X-Admin-Key` header matching `ADMIN_API_KEY` env var.

---

## Do NOT

- Use `as any` or `@ts-ignore` in TypeScript
- Skip error handling with empty catch blocks
- Hardcode API keys or secrets
- Commit `.env` files or database files
- Use `unwrap()` in Rust without explicit justification
