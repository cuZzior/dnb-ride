# AGENTS.md - AI Agent Guidelines

This document provides conventions and commands for AI agents working in this codebase.

## Project Structure

```
/server     - Rust API (Axum + SQLite)
/ui         - Next.js 16 frontend (React 19 + TypeScript)
```

## Build & Run Commands

### Server (Rust)
Working directory: `/server`

```bash
cargo check                  # Quick type check
cargo build                  # Build debug binary
cargo clippy                 # Linting (fix all warnings)
cargo fmt                    # Format code

# Testing
cargo test                   # Run all unit tests
cargo test <test_name>       # Run a specific test (e.g., cargo test validation)
cargo test -- --nocapture    # Run tests with stdout visible
```

### UI (Next.js)
Working directory: `/ui`

```bash
npm install                  # Install dependencies
npm run dev                  # Start dev server (port 3000)
npm run lint                 # Run ESLint
npm run build                # Production build
```

### Full Stack Development
Run both services in separate terminals:
```bash
# Terminal 1: Server
cd server && cargo run

# Terminal 2: UI
cd ui && npm run dev
```

---

## Code Style - Rust (Server)

### 1. Architecture & Patterns
- **Framework**: Axum 0.7 + Tokio
- **Database**: SQLite via SQLx (raw SQL queries preferred over ORM)
- **Error Handling**: Return `Result<Json<T>, StatusCode>`. Use `?` for propagation.
  - Map errors: `.map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?`
  - 404s: `.ok_or(StatusCode::NOT_FOUND)?`
- **Nullable Fields**: Use `Option<String>` for nullable columns.
  - **IMPORTANT**: For `UpdateEventRequest`, optional URL fields (`image_url`, etc.) accept empty strings `""` to clear the value (convert to `NULL` in DB). Do NOT use `#[validate(url)]` on these updatable fields to allow clearing.

### 2. Validation
Use `validator` crate.
```rust
#[derive(Debug, Deserialize, Validate)]
pub struct CreateEventRequest {
    #[validate(length(min = 3))]
    pub title: String,
    #[validate(url)] // Only for creation, not update if clearing is needed
    pub image_url: Option<String>,
}
```

### 3. Route Handler Pattern
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

### 4. Admin Auth
Admin routes require `X-Admin-Key` header matching `ADMIN_API_KEY` env var.
Use `check_admin_auth(&headers)` helper.

### 5. Testing Strategy
- **Unit Tests**: Located in `src/models.rs` (mod tests). Cover validation logic and status parsing.
- **Integration Tests**: Currently none. Focus on unit tests for logic.

---

## Code Style - TypeScript (UI)

### 1. Stack & Architecture
- **Framework**: Next.js 16 (App Router), React 19
- **Styling**: Tailwind CSS + **Aurora Flow Design System**
  - Colors: Deep Ocean (`#0A1929`), Hot Coral (`#FF6B6B`), Aurora Emerald (`#50C878`)
  - Glassmorphism: `glass-aurora` utility class
- **State**: React hooks (`useState`, `useCallback`) only. No Redux/Zustand.

### 2. Imports Ordering
1. React / Next.js (`import { useState } from 'react'`)
2. External libraries (`import { MapPin } from 'lucide-react'`)
3. Local components (`import { Header } from '@/components'`)
4. Local utils/api (`import { fetchEvents } from '@/lib/api'`)
5. Types (`import { Event } from '@/types'`)

### 3. Component Pattern
```typescript
interface Props { event: Event; }
export default function EventCard({ event }: Props) {
    // 1. Hooks
    const [isOpen, setIsOpen] = useState(false);
    
    // 2. Callbacks
    const toggle = useCallback(() => setIsOpen(v => !v), []);

    // 3. Effects
    useEffect(() => { /* ... */ }, []);

    // 4. Render
    return <div className="card-aurora">{event.title}</div>;
}
```

### 4. Data Fetching
- Fetch from `process.env.NEXT_PUBLIC_API_URL`
- Handle `image_url` and `video_url` logic:
  - If both exist: Show Image in header, Video embed in content.
  - If Image only: Show Image.
  - If Video only: Show Video (or placeholder with icon).

---

## Do NOT
1. **Never commit .env files**.
2. **Never** use `unwrap()` in server code (except tests).
3. **Never** use `as any` in TypeScript.
4. **Never** hardcode API keys. Use environment variables.
5. **Never** leave empty catch blocks. Log the error.
