'use client';

import { useState, useCallback } from 'react';
import { Event } from '@/types';
import { updateEvent } from '@/lib/admin-api';
import { X, Loader2 } from 'lucide-react';

interface EditEventModalProps {
    event: Event;
    adminKey: string;
    onClose: () => void;
    onSuccess: () => void;
}

export default function EditEventModal({ event, adminKey, onClose, onSuccess }: EditEventModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
            <div
                className="glass-aurora w-full max-w-2xl max-h-[90vh] rounded-3xl overflow-hidden animate-slide-up"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between p-5 border-b border-white/5">
                    <h3 className="text-lg font-semibold text-[var(--color-text)]">
                        Edit Event
                    </h3>
                    <button
                        onClick={onClose}
                        className="w-9 h-9 rounded-full hover:bg-white/10 flex items-center justify-center text-[var(--color-text-muted)]"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4" style={{ maxHeight: 'calc(90vh - 80px)' }}>
                    <div>
                        <label className="block text-xs font-medium text-[var(--color-text-muted)] uppercase mb-2">Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                            className="w-full px-4 py-3 input-aurora"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-[var(--color-text-muted)] uppercase mb-2">Organizer</label>
                        <input
                            type="text"
                            value={organizer}
                            onChange={(e) => setOrganizer(e.target.value)}
                            required
                            className="w-full px-4 py-3 input-aurora"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-[var(--color-text-muted)] uppercase mb-2">Date</label>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                required
                                className="w-full px-4 py-3 input-aurora"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-[var(--color-text-muted)] uppercase mb-2">Time</label>
                            <input
                                type="time"
                                value={time}
                                onChange={(e) => setTime(e.target.value)}
                                required
                                className="w-full px-4 py-3 input-aurora"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-[var(--color-text-muted)] uppercase mb-2">Location Name</label>
                        <input
                            type="text"
                            value={locationName}
                            onChange={(e) => setLocationName(e.target.value)}
                            required
                            className="w-full px-4 py-3 input-aurora"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-[var(--color-text-muted)] uppercase mb-2">Country</label>
                        <input
                            type="text"
                            value={country}
                            onChange={(e) => setCountry(e.target.value)}
                            placeholder="e.g. United Kingdom"
                            className="w-full px-4 py-3 input-aurora"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-[var(--color-text-muted)] uppercase mb-2">Latitude</label>
                            <input
                                type="number"
                                step="any"
                                value={latitude}
                                onChange={(e) => setLatitude(e.target.value)}
                                required
                                className="w-full px-4 py-3 input-aurora"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-[var(--color-text-muted)] uppercase mb-2">Longitude</label>
                            <input
                                type="number"
                                step="any"
                                value={longitude}
                                onChange={(e) => setLongitude(e.target.value)}
                                required
                                className="w-full px-4 py-3 input-aurora"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-[var(--color-text-muted)] uppercase mb-2">Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            className="w-full px-4 py-3 input-aurora resize-none"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-[var(--color-text-muted)] uppercase mb-2">YouTube URL</label>
                        <input
                            type="url"
                            value={videoUrl}
                            onChange={(e) => setVideoUrl(e.target.value)}
                            placeholder="https://youtube.com/watch?v=..."
                            className="w-full px-4 py-3 input-aurora"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-[var(--color-text-muted)] uppercase mb-2">Event Link</label>
                        <input
                            type="url"
                            value={eventLink}
                            onChange={(e) => setEventLink(e.target.value)}
                            placeholder="https://facebook.com/events/..."
                            className="w-full px-4 py-3 input-aurora"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-[var(--color-text-muted)] uppercase mb-2">Status</label>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value as Event['status'])}
                            className="w-full px-4 py-3 input-aurora"
                        >
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                        </select>
                    </div>

                    {error && (
                        <p className="text-sm text-red-400">{error}</p>
                    )}

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-3.5 btn-coral disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            'Save Changes'
                        )}
                    </button>
                </form>
            </div>

            <div className="absolute inset-0 -z-10" onClick={onClose} />
        </div>
    );
}
