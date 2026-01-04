mod db;
mod models;
mod routes;

use axum::{http, routing::get, Router};
use sqlx::sqlite::SqlitePoolOptions;
use std::sync::Arc;
use tower_http::cors::{Any, CorsLayer};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

pub struct AppState {
    pub db: sqlx::SqlitePool,
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Load .env file (if it exists)
    dotenvy::dotenv().ok();

    // Validate required environment variables
    if std::env::var("ADMIN_API_KEY").is_err() {
        eprintln!("ERROR: ADMIN_API_KEY environment variable is required");
        eprintln!("Please set it in your .env file or environment");
        std::process::exit(1);
    }

    // Initialize logging
    tracing_subscriber::registry()
        .with(tracing_subscriber::fmt::layer())
        .with(tracing_subscriber::EnvFilter::new("info"))
        .init();

    // Initialize database
    let database_url = std::env::var("DATABASE_URL")
        .unwrap_or_else(|_| "sqlite:dnb_events.db?mode=rwc".to_string());

    let pool = SqlitePoolOptions::new()
        .max_connections(5)
        .connect(&database_url)
        .await?;

    // Run migrations
    db::init_db(&pool).await?;

    let state = Arc::new(AppState { db: pool });

    // CORS - configurable via env var, defaults to localhost for dev
    let allowed_origin =
        std::env::var("ALLOWED_ORIGIN").unwrap_or_else(|_| "http://localhost:3000".to_string());

    let cors = CorsLayer::permissive();

    // Routes
    let app = Router::new()
        .route("/api/health", get(|| async { "OK" }))
        .nest("/api/events", routes::events_router())
        .nest("/api/organizers", routes::organizers_router())
        .nest("/api/admin", routes::admin_router())
        .nest("/api/suggestions", routes::suggestions_router())
        .layer(cors)
        .with_state(state);

    // Port - configurable via env var, defaults to 3001 to avoid conflict with Next.js
    let port = std::env::var("PORT").unwrap_or_else(|_| "3001".to_string());
    let addr = format!("0.0.0.0:{}", port);

    let listener = tokio::net::TcpListener::bind(&addr).await?;
    tracing::info!("DNB On The Bike API running on http://localhost:{}", port);

    axum::serve(listener, app).await?;
    Ok(())
}
