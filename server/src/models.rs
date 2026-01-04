use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use validator::Validate;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum EventStatus {
    Pending,
    Approved,
    Rejected,
}

impl Default for EventStatus {
    fn default() -> Self {
        Self::Pending
    }
}

impl From<String> for EventStatus {
    fn from(s: String) -> Self {
        match s.to_lowercase().as_str() {
            "approved" => Self::Approved,
            "rejected" => Self::Rejected,
            _ => Self::Pending,
        }
    }
}

impl ToString for EventStatus {
    fn to_string(&self) -> String {
        match self {
            Self::Pending => "pending".to_string(),
            Self::Approved => "approved".to_string(),
            Self::Rejected => "rejected".to_string(),
        }
    }
}

/// Event model representing a DNB On Bike ride
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Event {
    pub id: i64,
    pub title: String,
    pub description: Option<String>,
    pub organizer: String,
    pub organizer_id: Option<i64>,
    pub location_name: String,
    pub country: Option<String>,
    pub latitude: f64,
    pub longitude: f64,
    #[sqlx(rename = "event_date")]
    pub event_date: DateTime<Utc>,
    pub image_url: Option<String>,
    pub video_url: Option<String>,  // YouTube URL for past events
    pub event_link: Option<String>, // External link to event (FB, RA, etc.)
    #[sqlx(skip)]
    pub status: EventStatus,
    #[sqlx(rename = "status")]
    pub status_str: String,
    #[sqlx(rename = "created_at")]
    pub created_at: DateTime<Utc>,
}

impl Event {
    /// Convert status_str to proper EventStatus after loading from DB
    pub fn with_parsed_status(mut self) -> Self {
        self.status = EventStatus::from(self.status_str.clone());
        self
    }
}

/// Organizer model representing a DNB On Bike event organizer
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Organizer {
    pub id: i64,
    pub name: String,
    pub slug: String,
    pub description: Option<String>,
    pub website: Option<String>,
    #[sqlx(rename = "created_at")]
    pub created_at: DateTime<Utc>,
}

/// Response for organizers list
#[derive(Debug, Serialize)]
pub struct OrganizersResponse {
    pub organizers: Vec<Organizer>,
    pub total: usize,
}

/// Request body for creating a new event
#[derive(Debug, Deserialize, Validate)]
pub struct CreateEventRequest {
    #[validate(length(min = 3))]
    pub title: String,
    pub description: Option<String>,
    #[validate(length(min = 1))]
    pub organizer: String,
    #[validate(length(min = 1))]
    pub location_name: String,
    pub country: Option<String>,
    #[validate(range(min = -90.0, max = 90.0))]
    pub latitude: f64,
    #[validate(range(min = -180.0, max = 180.0))]
    pub longitude: f64,
    pub event_date: DateTime<Utc>,
    #[validate(url)]
    pub image_url: Option<String>,
    #[validate(url)]
    pub video_url: Option<String>,
    #[validate(url)]
    pub event_link: Option<String>,
}

/// Response for event list with metadata
#[derive(Debug, Serialize)]
pub struct EventsResponse {
    pub events: Vec<Event>,
    pub total: usize,
}

/// Request body for updating an event (admin)
#[derive(Debug, Deserialize, Validate)]
pub struct UpdateEventRequest {
    #[validate(length(min = 3))]
    pub title: Option<String>,
    pub description: Option<String>,
    #[validate(length(min = 1))]
    pub organizer: Option<String>,
    #[validate(length(min = 1))]
    pub location_name: Option<String>,
    pub country: Option<String>,
    #[validate(range(min = -90.0, max = 90.0))]
    pub latitude: Option<f64>,
    #[validate(range(min = -180.0, max = 180.0))]
    pub longitude: Option<f64>,
    pub event_date: Option<DateTime<Utc>>,
    #[validate(url)]
    pub image_url: Option<String>,
    #[validate(url)]
    pub video_url: Option<String>,
    #[validate(url)]
    pub event_link: Option<String>,
    pub status: Option<String>,
}

/// Video suggestion model
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct VideoSuggestion {
    pub id: i64,
    pub event_id: i64,
    pub video_url: String,
    pub status: String,
    #[sqlx(rename = "created_at")]
    pub created_at: DateTime<Utc>,
    #[sqlx(default)]
    pub event_title: String, // Populated via JOIN
}

/// Request to create a suggestion
#[derive(Debug, Deserialize, Validate)]
pub struct CreateSuggestionRequest {
    pub event_id: i64,
    #[validate(url)]
    pub video_url: String,
}

/// Response for suggestions list
#[derive(Debug, Serialize)]
pub struct SuggestionsResponse {
    pub suggestions: Vec<VideoSuggestion>,
    pub total: usize,
}
