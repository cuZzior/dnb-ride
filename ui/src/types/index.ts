// Event types
export interface Event {
    id: number;
    title: string;
    description: string | null;
    organizer: string;
    organizer_id: number | null;
    location_name: string;
    country: string | null;
    latitude: number;
    longitude: number;
    event_date: string;
    image_url: string | null;
    video_url: string | null;
    event_link: string | null;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
    distance?: number;
}

export interface Organizer {
    id: number;
    name: string;
    description: string | null;
    logo_url: string | null;
    created_at: string;
}

// API Response types
export interface EventsResponse {
    events: Event[];
}

export interface OrganizersResponse {
    organizers: Organizer[];
}

// Filter state
export interface Filters {
    country: string;
    organizer: string;
    timeFilter: 'all' | 'upcoming' | 'past';
    sortByDistance: boolean;
    userLocation: { lat: number; lng: number } | null;
}

// Video suggestion types
export interface VideoSuggestion {
    id: number;
    event_id: number;
    video_url: string;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
    event_title: string | null;
}
