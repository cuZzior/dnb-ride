use axum::{
    extract::{Path, State},
    http::{HeaderMap, StatusCode},
    routing::{delete, get, patch, post, put},
    Json, Router,
};
use chrono::Utc;
use std::sync::Arc;

use crate::models::{
    CreateEventRequest, CreateSuggestionRequest, Event, EventsResponse, Organizer,
    OrganizersResponse, SuggestionsResponse, UpdateEventRequest, VideoSuggestion,
};
use crate::AppState;
use validator::Validate;

/// Get admin API key from environment (required - panics if not set)
fn get_admin_api_key() -> String {
    std::env::var("ADMIN_API_KEY")
        .expect("ADMIN_API_KEY environment variable must be set")
}

/// Check if request has valid admin API key
fn check_admin_auth(headers: &HeaderMap) -> bool {
    let expected_key = get_admin_api_key();
    headers
        .get("x-admin-key")
        .and_then(|v| v.to_str().ok())
        .map(|key| key == expected_key)
        .unwrap_or(false)
}

pub fn events_router() -> Router<Arc<AppState>> {
    Router::new()
        .route("/", get(list_events).post(create_event))
        .route("/:id", get(get_event))
        .route("/upcoming", get(list_upcoming))
        .route("/past", get(list_past))
        .route("/by-organizer/:slug", get(list_events_by_organizer))
}

/// Organizers router
pub fn organizers_router() -> Router<Arc<AppState>> {
    Router::new()
        .route("/", get(list_organizers))
        .route("/:slug", get(get_organizer))
}

/// Admin router - requires X-Admin-Key header
pub fn admin_router() -> Router<Arc<AppState>> {
    Router::new()
        .route("/events", get(list_all_events))
        .route("/events/pending", get(list_pending_events))
        .nest("/suggestions", admin_suggestions_router())
        .route("/events/:id", put(update_event))
        .route("/events/:id", delete(delete_event))
        .route("/events/:id/approve", patch(approve_event))
        .route("/events/:id/reject", patch(reject_event))
}

/// GET /api/events - List all approved events
async fn list_events(
    State(state): State<Arc<AppState>>,
) -> Result<Json<EventsResponse>, StatusCode> {
    let events: Vec<Event> = sqlx::query_as(
        r#"
        SELECT id, title, description, organizer, organizer_id, location_name, country, event_link, 
               latitude, longitude, event_date, image_url, video_url, status, created_at
        FROM events 
        WHERE status = 'approved'
        ORDER BY event_date ASC
        "#,
    )
    .fetch_all(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
    .into_iter()
    .map(|e: Event| e.with_parsed_status())
    .collect();

    let total = events.len();
    Ok(Json(EventsResponse { events, total }))
}

/// GET /api/events/:id - Get single event by ID
async fn get_event(
    State(state): State<Arc<AppState>>,
    Path(id): Path<i64>,
) -> Result<Json<Event>, StatusCode> {
    let event: Event = sqlx::query_as(
        r#"
        SELECT id, title, description, organizer, organizer_id, location_name, country, event_link,
               latitude, longitude, event_date, image_url, video_url, status, created_at
        FROM events 
        WHERE id = ?
        "#,
    )
    .bind(id)
    .fetch_optional(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
    .ok_or(StatusCode::NOT_FOUND)?;

    Ok(Json(event.with_parsed_status()))
}

/// GET /api/events/upcoming - List upcoming approved events
async fn list_upcoming(
    State(state): State<Arc<AppState>>,
) -> Result<Json<EventsResponse>, StatusCode> {
    let now = Utc::now();

    let events: Vec<Event> = sqlx::query_as(
        r#"
        SELECT id, title, description, organizer, organizer_id, location_name, country, event_link,
               latitude, longitude, event_date, image_url, video_url, status, created_at
        FROM events 
        WHERE status = 'approved' AND event_date > ?
        ORDER BY event_date ASC
        "#,
    )
    .bind(now)
    .fetch_all(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
    .into_iter()
    .map(|e: Event| e.with_parsed_status())
    .collect();

    let total = events.len();
    Ok(Json(EventsResponse { events, total }))
}

/// GET /api/events/past - List past approved events
async fn list_past(State(state): State<Arc<AppState>>) -> Result<Json<EventsResponse>, StatusCode> {
    let now = Utc::now();

    let events: Vec<Event> = sqlx::query_as(
        r#"
        SELECT id, title, description, organizer, organizer_id, location_name, country, event_link,
               latitude, longitude, event_date, image_url, video_url, status, created_at
        FROM events 
        WHERE status = 'approved' AND event_date <= ?
        ORDER BY event_date DESC
        "#,
    )
    .bind(now)
    .fetch_all(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
    .into_iter()
    .map(|e: Event| e.with_parsed_status())
    .collect();

    let total = events.len();
    Ok(Json(EventsResponse { events, total }))
}

/// POST /api/events - Create new event (status: pending)
async fn create_event(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<CreateEventRequest>,
) -> Result<(StatusCode, Json<Event>), StatusCode> {
    if payload.validate().is_err() {
        return Err(StatusCode::BAD_REQUEST);
    }

    let result = sqlx::query(
        r#"
        INSERT INTO events (title, description, organizer, location_name, country, latitude, longitude, event_date, image_url, video_url, event_link, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
        "#,
    )
    .bind(&payload.title)
    .bind(&payload.description)
    .bind(&payload.organizer)
    .bind(&payload.location_name)
    .bind(&payload.country)
    .bind(payload.latitude)
    .bind(payload.longitude)
    .bind(payload.event_date)
    .bind(&payload.image_url)
    .bind(&payload.video_url)
    .bind(&payload.event_link)
    .execute(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let id = result.last_insert_rowid();

    // Fetch the created event
    let event: Event = sqlx::query_as(
        r#"
        SELECT id, title, description, organizer, organizer_id, location_name, country, event_link,
               latitude, longitude, event_date, image_url, video_url, status, created_at
        FROM events WHERE id = ?
        "#,
    )
    .bind(id)
    .fetch_one(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok((StatusCode::CREATED, Json(event.with_parsed_status())))
}

// ===== Admin Endpoints =====

/// GET /api/admin/events/pending - List pending events (admin only)
async fn list_pending_events(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
) -> Result<Json<EventsResponse>, StatusCode> {
    if !check_admin_auth(&headers) {
        return Err(StatusCode::UNAUTHORIZED);
    }

    let events: Vec<Event> = sqlx::query_as(
        r#"
        SELECT id, title, description, organizer, organizer_id, location_name, country, event_link,
               latitude, longitude, event_date, image_url, video_url, status, created_at
        FROM events 
        WHERE status = 'pending'
        ORDER BY created_at DESC
        "#,
    )
    .fetch_all(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
    .into_iter()
    .map(|e: Event| e.with_parsed_status())
    .collect();

    let total = events.len();
    Ok(Json(EventsResponse { events, total }))
}

/// GET /api/admin/events - List ALL events (admin only)
async fn list_all_events(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
) -> Result<Json<EventsResponse>, StatusCode> {
    if !check_admin_auth(&headers) {
        return Err(StatusCode::UNAUTHORIZED);
    }

    let events: Vec<Event> = sqlx::query_as(
        r#"
        SELECT id, title, description, organizer, organizer_id, location_name, country, event_link,
               latitude, longitude, event_date, image_url, video_url, status, created_at
        FROM events 
        ORDER BY event_date DESC
        "#,
    )
    .fetch_all(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
    .into_iter()
    .map(|e: Event| e.with_parsed_status())
    .collect();

    let total = events.len();
    Ok(Json(EventsResponse { events, total }))
}

/// PUT /api/admin/events/:id - Update event (admin only)
async fn update_event(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
    Path(id): Path<i64>,
    Json(payload): Json<UpdateEventRequest>,
) -> Result<Json<Event>, StatusCode> {
    if !check_admin_auth(&headers) {
        return Err(StatusCode::UNAUTHORIZED);
    }

    if payload.validate().is_err() {
        return Err(StatusCode::BAD_REQUEST);
    }

    // Build dynamic update query
    let mut updates = Vec::new();
    if payload.title.is_some() {
        updates.push("title = ?");
    }
    if payload.description.is_some() {
        updates.push("description = ?");
    }
    if payload.organizer.is_some() {
        updates.push("organizer = ?");
    }
    if payload.location_name.is_some() {
        updates.push("location_name = ?");
    }
    if payload.country.is_some() {
        updates.push("country = ?");
    }
    if payload.latitude.is_some() {
        updates.push("latitude = ?");
    }
    if payload.longitude.is_some() {
        updates.push("longitude = ?");
    }
    if payload.event_date.is_some() {
        updates.push("event_date = ?");
    }
    if payload.image_url.is_some() {
        updates.push("image_url = ?");
    }
    if payload.video_url.is_some() {
        updates.push("video_url = ?");
    }
    if payload.event_link.is_some() {
        updates.push("event_link = ?");
    }
    if payload.status.is_some() {
        updates.push("status = ?");
    }

    if updates.is_empty() {
        return Err(StatusCode::BAD_REQUEST);
    }

    let query = format!("UPDATE events SET {} WHERE id = ?", updates.join(", "));
    let mut q = sqlx::query(&query);

    if let Some(ref v) = payload.title {
        q = q.bind(v);
    }
    if let Some(ref v) = payload.description {
        q = q.bind(if v.is_empty() { None::<String> } else { Some(v.clone()) });
    }
    if let Some(ref v) = payload.organizer {
        q = q.bind(v);
    }
    if let Some(ref v) = payload.location_name {
        q = q.bind(v);
    }
    if let Some(ref v) = payload.country {
        q = q.bind(if v.is_empty() { None::<String> } else { Some(v.clone()) });
    }
    if let Some(v) = payload.latitude {
        q = q.bind(v);
    }
    if let Some(v) = payload.longitude {
        q = q.bind(v);
    }
    if let Some(v) = payload.event_date {
        q = q.bind(v);
    }
    if let Some(ref v) = payload.image_url {
        q = q.bind(if v.is_empty() { None::<String> } else { Some(v.clone()) });
    }
    if let Some(ref v) = payload.video_url {
        q = q.bind(if v.is_empty() { None::<String> } else { Some(v.clone()) });
    }
    if let Some(ref v) = payload.event_link {
        q = q.bind(if v.is_empty() { None::<String> } else { Some(v.clone()) });
    }
    if let Some(ref v) = payload.status {
        q = q.bind(v);
    }

    q = q.bind(id);
    q.execute(&state.db)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    // Fetch updated event
    let event: Event = sqlx::query_as(
        r#"
        SELECT id, title, description, organizer, organizer_id, location_name, country, event_link,
               latitude, longitude, event_date, image_url, video_url, status, created_at
        FROM events WHERE id = ?
        "#,
    )
    .bind(id)
    .fetch_optional(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
    .ok_or(StatusCode::NOT_FOUND)?;

    tracing::info!("Event {} updated", id);
    Ok(Json(event.with_parsed_status()))
}

/// PATCH /api/admin/events/:id/approve - Approve event (admin only)
async fn approve_event(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
    Path(id): Path<i64>,
) -> Result<Json<Event>, StatusCode> {
    if !check_admin_auth(&headers) {
        return Err(StatusCode::UNAUTHORIZED);
    }

    sqlx::query("UPDATE events SET status = 'approved' WHERE id = ?")
        .bind(id)
        .execute(&state.db)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let event: Event = sqlx::query_as(
        r#"
        SELECT id, title, description, organizer, organizer_id, location_name, country, event_link,
               latitude, longitude, event_date, image_url, video_url, status, created_at
        FROM events WHERE id = ?
        "#,
    )
    .bind(id)
    .fetch_optional(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
    .ok_or(StatusCode::NOT_FOUND)?;

    tracing::info!("Event {} approved", id);
    Ok(Json(event.with_parsed_status()))
}

/// PATCH /api/admin/events/:id/reject - Reject event (admin only)
async fn reject_event(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
    Path(id): Path<i64>,
) -> Result<Json<Event>, StatusCode> {
    if !check_admin_auth(&headers) {
        return Err(StatusCode::UNAUTHORIZED);
    }

    sqlx::query("UPDATE events SET status = 'rejected' WHERE id = ?")
        .bind(id)
        .execute(&state.db)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let event: Event = sqlx::query_as(
        r#"
        SELECT id, title, description, organizer, organizer_id, location_name, country, event_link,
               latitude, longitude, event_date, image_url, video_url, status, created_at
        FROM events WHERE id = ?
        "#,
    )
    .bind(id)
    .fetch_optional(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
    .ok_or(StatusCode::NOT_FOUND)?;

    tracing::info!("Event {} rejected", id);
    Ok(Json(event.with_parsed_status()))
}

/// DELETE /api/admin/events/:id - Delete event (admin only)
async fn delete_event(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
    Path(id): Path<i64>,
) -> Result<StatusCode, StatusCode> {
    if !check_admin_auth(&headers) {
        return Err(StatusCode::UNAUTHORIZED);
    }

    let result = sqlx::query("DELETE FROM events WHERE id = ?")
        .bind(id)
        .execute(&state.db)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    if result.rows_affected() == 0 {
        return Err(StatusCode::NOT_FOUND);
    }

    tracing::info!("Event {} deleted", id);
    Ok(StatusCode::NO_CONTENT)
}

// ===== Organizer Endpoints =====

/// GET /api/organizers - List all organizers
async fn list_organizers(
    State(state): State<Arc<AppState>>,
) -> Result<Json<OrganizersResponse>, StatusCode> {
    let organizers: Vec<Organizer> = sqlx::query_as(
        r#"
        SELECT id, name, slug, description, website, created_at
        FROM organizers
        ORDER BY name ASC
        "#,
    )
    .fetch_all(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let total = organizers.len();
    Ok(Json(OrganizersResponse { organizers, total }))
}

/// GET /api/organizers/:slug - Get organizer by slug
async fn get_organizer(
    State(state): State<Arc<AppState>>,
    Path(slug): Path<String>,
) -> Result<Json<Organizer>, StatusCode> {
    let organizer: Organizer = sqlx::query_as(
        r#"
        SELECT id, name, slug, description, website, created_at
        FROM organizers
        WHERE slug = ?
        "#,
    )
    .bind(&slug)
    .fetch_optional(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
    .ok_or(StatusCode::NOT_FOUND)?;

    Ok(Json(organizer))
}

/// GET /api/events/by-organizer/:slug - List approved events by organizer slug
async fn list_events_by_organizer(
    State(state): State<Arc<AppState>>,
    Path(slug): Path<String>,
) -> Result<Json<EventsResponse>, StatusCode> {
    // First get organizer ID from slug
    let organizer: Option<(i64,)> = sqlx::query_as("SELECT id FROM organizers WHERE slug = ?")
        .bind(&slug)
        .fetch_optional(&state.db)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let organizer_id = organizer.ok_or(StatusCode::NOT_FOUND)?.0;

    let events: Vec<Event> = sqlx::query_as(
        r#"
        SELECT id, title, description, organizer, organizer_id, location_name, country, event_link,
               latitude, longitude, event_date, image_url, video_url, status, created_at
        FROM events
        WHERE status = 'approved' AND organizer_id = ?
        ORDER BY event_date DESC
        "#,
    )
    .bind(organizer_id)
    .fetch_all(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
    .into_iter()
    .map(|e: Event| e.with_parsed_status())
    .collect();

    let total = events.len();
    Ok(Json(EventsResponse { events, total }))
}

/// POST /api/suggestions/video - Submit a video suggestion
async fn create_suggestion(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<CreateSuggestionRequest>,
) -> Result<StatusCode, StatusCode> {
    if payload.validate().is_err() {
        return Err(StatusCode::BAD_REQUEST);
    }

    sqlx::query("INSERT INTO video_suggestions (event_id, video_url) VALUES (?, ?)")
        .bind(payload.event_id)
        .bind(&payload.video_url)
        .execute(&state.db)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(StatusCode::CREATED)
}

/// GET /api/admin/suggestions - List pending suggestions
async fn list_suggestions(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
) -> Result<Json<SuggestionsResponse>, StatusCode> {
    if !check_admin_auth(&headers) {
        return Err(StatusCode::UNAUTHORIZED);
    }

    let suggestions: Vec<VideoSuggestion> = sqlx::query_as(
        r#"
        SELECT vs.id, vs.event_id, vs.video_url, vs.status, vs.created_at, IFNULL(e.title, 'Unknown Event') as event_title
        FROM video_suggestions vs
        LEFT JOIN events e ON vs.event_id = e.id
        WHERE vs.status = 'pending'
        ORDER BY vs.created_at DESC
        "#
    )
    .fetch_all(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(SuggestionsResponse {
        total: suggestions.len(),
        suggestions,
    }))
}

/// PATCH /api/admin/suggestions/:id/approve - Approve suggestion
async fn approve_suggestion(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
    Path(id): Path<i64>,
) -> Result<StatusCode, StatusCode> {
    if !check_admin_auth(&headers) {
        return Err(StatusCode::UNAUTHORIZED);
    }

    // Begin transaction
    let mut tx = state
        .db
        .begin()
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    // Get suggestion details
    let suggestion: VideoSuggestion = sqlx::query_as(
        "SELECT id, event_id, video_url, status, created_at, '' as event_title FROM video_suggestions WHERE id = ?"
    )
    .bind(id)
    .fetch_optional(&mut *tx)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
    .ok_or(StatusCode::NOT_FOUND)?;

    // Update event video_url
    sqlx::query("UPDATE events SET video_url = ? WHERE id = ?")
        .bind(&suggestion.video_url)
        .bind(suggestion.event_id)
        .execute(&mut *tx)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    // Update suggestion status
    sqlx::query("UPDATE video_suggestions SET status = 'approved' WHERE id = ?")
        .bind(id)
        .execute(&mut *tx)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    tx.commit()
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(StatusCode::OK)
}

/// PATCH /api/admin/suggestions/:id/reject - Reject suggestion
async fn reject_suggestion(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
    Path(id): Path<i64>,
) -> Result<StatusCode, StatusCode> {
    if !check_admin_auth(&headers) {
        return Err(StatusCode::UNAUTHORIZED);
    }

    sqlx::query("UPDATE video_suggestions SET status = 'rejected' WHERE id = ?")
        .bind(id)
        .execute(&state.db)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(StatusCode::OK)
}

/// Public router for suggestions
pub fn suggestions_router() -> Router<Arc<AppState>> {
    Router::new().route("/video", post(create_suggestion))
}

/// Admin router for suggestions
pub fn admin_suggestions_router() -> Router<Arc<AppState>> {
    Router::new()
        .route("/", get(list_suggestions))
        .route("/:id/approve", patch(approve_suggestion))
        .route("/:id/reject", patch(reject_suggestion))
}
