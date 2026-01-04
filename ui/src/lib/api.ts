import { Event, Organizer, EventsResponse, OrganizersResponse, VideoSuggestion } from '@/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

// Fetch all approved events
export async function fetchEvents(): Promise<Event[]> {
    const res = await fetch(`${API_BASE}/events`);
    if (!res.ok) throw new Error('Failed to fetch events');
    const data: EventsResponse = await res.json();
    return data.events;
}

// Fetch all organizers
export async function fetchOrganizers(): Promise<Organizer[]> {
    const res = await fetch(`${API_BASE}/organizers`);
    if (!res.ok) throw new Error('Failed to fetch organizers');
    const data: OrganizersResponse = await res.json();
    return data.organizers;
}

// Fetch events by organizer
export async function fetchEventsByOrganizer(organizerId: number): Promise<Event[]> {
    const res = await fetch(`${API_BASE}/events/organizer/${organizerId}`);
    if (!res.ok) throw new Error('Failed to fetch organizer events');
    const data: EventsResponse = await res.json();
    return data.events;
}

// Create a new event (public submission)
export async function createEvent(eventData: Partial<Event>): Promise<Event> {
    const res = await fetch(`${API_BASE}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData),
    });
    if (!res.ok) throw new Error('Failed to create event');
    return res.json();
}

// Submit video suggestion
export async function submitVideoSuggestion(
    eventId: number,
    videoUrl: string
): Promise<void> {
    const res = await fetch(`${API_BASE}/suggestions/video`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_id: eventId, video_url: videoUrl }),
    });
    if (!res.ok) throw new Error('Failed to submit video suggestion');
}

// Calculate distance between two coordinates (Haversine formula)
export function calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
): number {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}
