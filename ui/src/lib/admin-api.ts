import { Event, VideoSuggestion } from '@/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

// Admin API functions - all require X-Admin-Key header
export async function fetchAllEventsAdmin(adminKey: string): Promise<Event[]> {
    const res = await fetch(`${API_BASE}/admin/events`, {
        headers: { 'X-Admin-Key': adminKey },
    });
    if (res.status === 401) throw new Error('Invalid admin key');
    if (!res.ok) throw new Error('Failed to fetch events');
    const data = await res.json();
    return data.events;
}

export async function updateEvent(
    adminKey: string,
    eventId: number,
    eventData: Partial<Event>
): Promise<Event> {
    const res = await fetch(`${API_BASE}/admin/events/${eventId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'X-Admin-Key': adminKey,
        },
        body: JSON.stringify(eventData),
    });
    if (res.status === 401) throw new Error('Invalid admin key');
    if (!res.ok) throw new Error('Failed to update event');
    return res.json();
}

export async function approveEvent(adminKey: string, eventId: number): Promise<void> {
    const res = await fetch(`${API_BASE}/admin/events/${eventId}/approve`, {
        method: 'PATCH',
        headers: { 'X-Admin-Key': adminKey },
    });
    if (res.status === 401) throw new Error('Invalid admin key');
    if (!res.ok) throw new Error('Failed to approve event');
}

export async function rejectEvent(adminKey: string, eventId: number): Promise<void> {
    const res = await fetch(`${API_BASE}/admin/events/${eventId}/reject`, {
        method: 'PATCH',
        headers: { 'X-Admin-Key': adminKey },
    });
    if (res.status === 401) throw new Error('Invalid admin key');
    if (!res.ok) throw new Error('Failed to reject event');
}

export async function deleteEvent(adminKey: string, eventId: number): Promise<void> {
    const res = await fetch(`${API_BASE}/admin/events/${eventId}`, {
        method: 'DELETE',
        headers: { 'X-Admin-Key': adminKey },
    });
    if (res.status === 401) throw new Error('Invalid admin key');
    if (!res.ok) throw new Error('Failed to delete event');
}

export async function fetchSuggestions(adminKey: string): Promise<VideoSuggestion[]> {
    const res = await fetch(`${API_BASE}/admin/suggestions`, {
        headers: { 'X-Admin-Key': adminKey },
    });
    if (res.status === 401) throw new Error('Invalid admin key');
    if (!res.ok) throw new Error('Failed to fetch suggestions');
    const data = await res.json();
    return data.suggestions;
}

export async function approveSuggestion(adminKey: string, suggestionId: number): Promise<void> {
    const res = await fetch(`${API_BASE}/admin/suggestions/${suggestionId}/approve`, {
        method: 'PATCH',
        headers: { 'X-Admin-Key': adminKey },
    });
    if (res.status === 401) throw new Error('Invalid admin key');
    if (!res.ok) throw new Error('Failed to approve suggestion');
}

export async function rejectSuggestion(adminKey: string, suggestionId: number): Promise<void> {
    const res = await fetch(`${API_BASE}/admin/suggestions/${suggestionId}/reject`, {
        method: 'PATCH',
        headers: { 'X-Admin-Key': adminKey },
    });
    if (res.status === 401) throw new Error('Invalid admin key');
    if (!res.ok) throw new Error('Failed to reject suggestion');
}
