'use client';

import { useState, useCallback } from 'react';
import { Event } from '@/types';
import { updateEvent } from '@/lib/admin-api';

interface EditEventModalProps {
    event: Event;
    adminKey: string;
    onClose: () => void;
    onSuccess: () => void;
}

export default function EditEventModal({ event, adminKey, onClose, onSuccess }: EditEventModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form state
    const [title, setTitle] = useState(event.title);
    const [organizer, setOrganizer] = useState(event.organizer);
    const [locationName, setLocationName] = useState(event.location_name);
    const [country, setCountry] = useState(event.country || '');
    const [latitude, setLatitude] = useState(event.latitude.toString());
    const [longitude, setLongitude] = useState(event.longitude.toString());
    const [description, setDescription] = useState(event.description || '');
    const [videoUrl, setVideoUrl] = useState(event.video_url || '');
    const [eventLink, setEventLink] = useState(event.event_link || '');
    const [status, setStatus] = useState(event.status);

    // Parse date/time from event
    const eventDate = new Date(event.event_date);
    const [date, setDate] = useState(eventDate.toISOString().split('T')[0]);
    const [time, setTime] = useState(eventDate.toTimeString().slice(0, 5));

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);

        try {
            await updateEvent(adminKey, event.id, {
                title,
                organizer,
                location_name: locationName,
                country: country || null,
                latitude: parseFloat(latitude),
                longitude: parseFloat(longitude),
                description: description || null,
                video_url: videoUrl || null,
                event_link: eventLink || null,
                event_date: new Date(`${date}T${time}:00`).toISOString(),
                status,
            });
            onSuccess();
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update event');
        } finally {
            setIsSubmitting(false);
        }
    }, [adminKey, event.id, title, organizer, locationName, country, latitude, longitude, description, videoUrl, eventLink, date, time, status, onSuccess, onClose]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div
                className="glass w-full max-w-2xl max-h-[90vh] rounded-2xl overflow-hidden animate-slide-up"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/10">
                    <h3 className="text-lg font-semibold text-[var(--color-text)]">
                        Edit Event
                    </h3>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-[var(--color-text-muted)]"
                    >
                        ✕
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-4 overflow-y-auto space-y-4" style={{ maxHeight: 'calc(90vh - 80px)' }}>
                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                            className="w-full px-3 py-2 rounded-lg bg-[var(--color-background)] border border-white/10 text-[var(--color-text)] focus:border-[var(--color-primary)] outline-none"
                        />
                    </div>

                    {/* Organizer */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">Organizer</label>
                        <input
                            type="text"
                            value={organizer}
                            onChange={(e) => setOrganizer(e.target.value)}
                            required
                            className="w-full px-3 py-2 rounded-lg bg-[var(--color-background)] border border-white/10 text-[var(--color-text)] focus:border-[var(--color-primary)] outline-none"
                        />
                    </div>

                    {/* Date & Time */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">Date</label>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                required
                                className="w-full px-3 py-2 rounded-lg bg-[var(--color-background)] border border-white/10 text-[var(--color-text)] focus:border-[var(--color-primary)] outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">Time</label>
                            <input
                                type="time"
                                value={time}
                                onChange={(e) => setTime(e.target.value)}
                                required
                                className="w-full px-3 py-2 rounded-lg bg-[var(--color-background)] border border-white/10 text-[var(--color-text)] focus:border-[var(--color-primary)] outline-none"
                            />
                        </div>
                    </div>

                    {/* Location */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">Location Name</label>
                        <input
                            type="text"
                            value={locationName}
                            onChange={(e) => setLocationName(e.target.value)}
                            required
                            className="w-full px-3 py-2 rounded-lg bg-[var(--color-background)] border border-white/10 text-[var(--color-text)] focus:border-[var(--color-primary)] outline-none"
                        />
                    </div>

                    {/* Country */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">Country</label>
                        <input
                            type="text"
                            value={country}
                            onChange={(e) => setCountry(e.target.value)}
                            placeholder="e.g. United Kingdom"
                            className="w-full px-3 py-2 rounded-lg bg-[var(--color-background)] border border-white/10 text-[var(--color-text)] focus:border-[var(--color-primary)] outline-none"
                        />
                    </div>

                    {/* Coordinates */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">Latitude</label>
                            <input
                                type="number"
                                step="any"
                                value={latitude}
                                onChange={(e) => setLatitude(e.target.value)}
                                required
                                className="w-full px-3 py-2 rounded-lg bg-[var(--color-background)] border border-white/10 text-[var(--color-text)] focus:border-[var(--color-primary)] outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">Longitude</label>
                            <input
                                type="number"
                                step="any"
                                value={longitude}
                                onChange={(e) => setLongitude(e.target.value)}
                                required
                                className="w-full px-3 py-2 rounded-lg bg-[var(--color-background)] border border-white/10 text-[var(--color-text)] focus:border-[var(--color-primary)] outline-none"
                            />
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 rounded-lg bg-[var(--color-background)] border border-white/10 text-[var(--color-text)] focus:border-[var(--color-primary)] outline-none resize-none"
                        />
                    </div>

                    {/* Video URL */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">YouTube URL</label>
                        <input
                            type="url"
                            value={videoUrl}
                            onChange={(e) => setVideoUrl(e.target.value)}
                            placeholder="https://youtube.com/watch?v=..."
                            className="w-full px-3 py-2 rounded-lg bg-[var(--color-background)] border border-white/10 text-[var(--color-text)] focus:border-[var(--color-primary)] outline-none"
                        />
                    </div>

                    {/* Event Link */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">Event Link</label>
                        <input
                            type="url"
                            value={eventLink}
                            onChange={(e) => setEventLink(e.target.value)}
                            placeholder="https://facebook.com/events/..."
                            className="w-full px-3 py-2 rounded-lg bg-[var(--color-background)] border border-white/10 text-[var(--color-text)] focus:border-[var(--color-primary)] outline-none"
                        />
                    </div>

                    {/* Status */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">Status</label>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value as Event['status'])}
                            className="w-full px-3 py-2 rounded-lg bg-[var(--color-background)] border border-white/10 text-[var(--color-text)] focus:border-[var(--color-primary)] outline-none"
                        >
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                        </select>
                    </div>

                    {error && (
                        <p className="text-sm text-[var(--color-error)]">{error}</p>
                    )}

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-3 rounded-lg bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white font-medium transition-colors disabled:opacity-50"
                    >
                        {isSubmitting ? 'Saving...' : 'Save Changes'}
                    </button>
                </form>
            </div>

            {/* Click outside to close */}
            <div className="absolute inset-0 -z-10" onClick={onClose} />
        </div>
    );
}
