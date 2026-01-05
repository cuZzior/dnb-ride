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
#[derive(Debug, Deserialize, Validate, Clone)]
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
    // Allow empty string to clear the field (handled in routes.rs)
    pub image_url: Option<String>,
    pub video_url: Option<String>,
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

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::Utc;

    #[test]
    fn test_event_status_parsing() {
        assert_eq!(EventStatus::from("approved".to_string()), EventStatus::Approved);
        assert_eq!(EventStatus::from("Approved".to_string()), EventStatus::Approved);
        assert_eq!(EventStatus::from("APPROVED".to_string()), EventStatus::Approved);
        assert_eq!(EventStatus::from("rejected".to_string()), EventStatus::Rejected);
        assert_eq!(EventStatus::from("pending".to_string()), EventStatus::Pending);
        assert_eq!(EventStatus::from("unknown".to_string()), EventStatus::Pending);
        assert_eq!(EventStatus::from("".to_string()), EventStatus::Pending);
    }

    #[test]
    fn test_event_status_to_string() {
        assert_eq!(EventStatus::Approved.to_string(), "approved");
        assert_eq!(EventStatus::Rejected.to_string(), "rejected");
        assert_eq!(EventStatus::Pending.to_string(), "pending");
    }

    #[test]
    fn test_create_event_request_validation() {
        let valid_request = CreateEventRequest {
            title: "Valid Title".to_string(),
            description: None,
            organizer: "Organizer".to_string(),
            location_name: "Location".to_string(),
            country: Some("Country".to_string()),
            latitude: 50.0,
            longitude: 10.0,
            event_date: Utc::now(),
            image_url: Some("https://example.com/image.jpg".to_string()),
            video_url: None,
            event_link: None,
        };
        assert!(valid_request.validate().is_ok());

        let invalid_title = CreateEventRequest {
            title: "No".to_string(),
            ..valid_request.clone()
        };
        assert!(invalid_title.validate().is_err());

        let invalid_coords = CreateEventRequest {
            latitude: 100.0,
            ..valid_request.clone()
        };
        assert!(invalid_coords.validate().is_err());

        let invalid_url = CreateEventRequest {
            image_url: Some("not-a-url".to_string()),
            ..valid_request.clone()
        };
        assert!(invalid_url.validate().is_err());
    }

    #[test]
    fn test_create_suggestion_request_validation() {
        let valid = CreateSuggestionRequest {
            event_id: 1,
            video_url: "https://youtube.com/watch?v=123".to_string(),
        };
        assert!(valid.validate().is_ok());

        let invalid = CreateSuggestionRequest {
            event_id: 1,
            video_url: "not-a-url".to_string(),
        };
        assert!(invalid.validate().is_err());
    }
}
