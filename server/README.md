# DNB On Bike - Backend

Rust API server using Axum 0.7 with SQLite.

## Setup

1. Create `.env` file:

```env
DATABASE_URL=sqlite:dnb_events.db?mode=rwc
ADMIN_API_KEY=your-secure-secret-key
PORT=3001
ALLOWED_ORIGIN=http://localhost:3000
```

2. Run:

```bash
cargo run
```

**Note:** The server will not start without `ADMIN_API_KEY` set.

## Scripts

- `cargo run` - Development server (port 3001)
- `cargo build --release` - Production build
- `cargo check` - Check for errors
- `cargo clippy` - Run linter
- `cargo fmt` - Format code
- `cargo test` - Run tests

See main [README.md](../README.md) for full documentation.
