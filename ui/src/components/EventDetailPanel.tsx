'use client';

import { Event } from '@/types';
import Image from 'next/image';
import { X, Calendar, Clock, MapPin, User, Navigation, ExternalLink, Video } from 'lucide-react';

interface EventDetailPanelProps {
    event: Event;
    onClose: () => void;
    onSuggestVideo: (eventId: number) => void;
}

export default function EventDetailPanel({ event, onClose, onSuggestVideo }: EventDetailPanelProps) {
    const eventDate = new Date(event.event_date);
    const isPast = eventDate < new Date();
    const formattedDate = eventDate.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    });
    const formattedTime = eventDate.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
    });

    // Extract YouTube embed URL
    const getYouTubeEmbedUrl = (url: string): string | null => {
        const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
        const match = url.match(regex);
        // Use youtube-nocookie.com for privacy and fewer restrictions
        return match ? `https://www.youtube-nocookie.com/embed/${match[1]}` : null;
    };

    const embedUrl = event.video_url ? getYouTubeEmbedUrl(event.video_url) : null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
            <div
                className="bg-[var(--color-surface)] w-full max-w-2xl max-h-[90vh] rounded-2xl overflow-hidden shadow-2xl animate-slide-up border border-white/10"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header Image / Video */}
                <div className="relative h-48 md:h-64 bg-[var(--color-background)]">
                    {embedUrl ? (
                        <iframe
                            src={embedUrl}
                            className="w-full h-full"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                            referrerPolicy="strict-origin-when-cross-origin"
                            allowFullScreen
                            title={event.title}
                        />
                    ) : event.image_url ? (
                        <Image
                            src={event.image_url}
                            alt={event.title}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, 672px"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[var(--color-primary)]/20 to-[var(--color-accent)]/20">
                            <Calendar className="w-16 h-16 text-[var(--color-text-muted)]" />
                        </div>
                    )}

                    {/* Close button */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/50 backdrop-blur flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    {/* Past event badge */}
                    {isPast && (
                        <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-[var(--color-surface)]/80 backdrop-blur text-sm text-[var(--color-text-muted)]">
                            Past Event
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 16rem)' }}>
                    <h2 className="text-2xl font-bold text-[var(--color-text)] mb-4">
                        {event.title}
                    </h2>

                    {/* Details */}
                    <div className="space-y-3 mb-6">
                        <div className="flex items-center gap-3 text-[var(--color-text-muted)]">
                            <Calendar className="w-5 h-5 text-[var(--color-accent)]" />
                            <span>{formattedDate}</span>
                        </div>
                        <div className="flex items-center gap-3 text-[var(--color-text-muted)]">
                            <Clock className="w-5 h-5 text-[var(--color-accent)]" />
                            <span>{formattedTime}</span>
                        </div>
                        <div className="flex items-center gap-3 text-[var(--color-text-muted)]">
                            <MapPin className="w-5 h-5 text-[var(--color-accent)]" />
                            <span>{event.location_name}</span>
                        </div>
                        {event.organizer && (
                            <div className="flex items-center gap-3 text-[var(--color-text-muted)]">
                                <User className="w-5 h-5 text-[var(--color-accent)]" />
                                <span>{event.organizer}</span>
                            </div>
                        )}
                        {event.distance !== undefined && (
                            <div className="flex items-center gap-3 text-[var(--color-accent)]">
                                <Navigation className="w-5 h-5" />
                                <span>{event.distance.toFixed(1)} km away</span>
                            </div>
                        )}
                    </div>

                    {/* Description */}
                    {event.description && (
                        <div className="mb-6">
                            <h3 className="text-sm font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-2">
                                About
                            </h3>
                            <p className="text-[var(--color-text)] leading-relaxed whitespace-pre-line">
                                {event.description}
                            </p>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-3">
                        {/* Directions Button */}
                        <a
                            href={`https://www.google.com/maps/dir/?api=1&destination=${event.latitude},${event.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--color-accent)] hover:bg-[var(--color-accent-dark)] text-white font-medium transition-colors"
                        >
                            <Navigation className="w-4 h-4" />
                            <span>Get Directions</span>
                        </a>

                        {/* Calendar Button */}
                        <button
                            onClick={() => {
                                const startDate = eventDate.toISOString().replace(/-|:|\.\d+/g, '');
                                const endDate = new Date(eventDate.getTime() + 2 * 60 * 60 * 1000).toISOString().replace(/-|:|\.\d+/g, '');
                                const icsContent = [
                                    'BEGIN:VCALENDAR',
                                    'VERSION:2.0',
                                    'BEGIN:VEVENT',
                                    `DTSTART:${startDate}`,
                                    `DTEND:${endDate}`,
                                    `SUMMARY:DnB On The Bike - ${event.title}`,
                                    `DESCRIPTION:${event.description || ''}`,
                                    `LOCATION:${event.location_name}`,
                                    'END:VEVENT',
                                    'END:VCALENDAR'
                                ].join('\n');
                                const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
                                const url = window.URL.createObjectURL(blob);
                                const link = document.createElement('a');
                                link.href = url;
                                link.setAttribute('download', `${event.title.replace(/\s+/g, '_')}.ics`);
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                            }}
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-white/20 hover:bg-white/5 text-[var(--color-text)] font-medium transition-colors"
                        >
                            <Calendar className="w-4 h-4" />
                            <span>Add to Calendar</span>
                        </button>

                        {/* Event Link Button */}
                        {event.event_link && (
                            <a
                                href={event.event_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg btn-gradient"
                            >
                                <ExternalLink className="w-4 h-4" />
                                <span className="whitespace-nowrap">View Event Page</span>
                            </a>
                        )}

                        {/* Suggest Video Button - only for past events without video */}
                        {isPast && !event.video_url && (
                            <button
                                onClick={() => onSuggestVideo(event.id)}
                                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-white/20 hover:bg-white/5 text-[var(--color-text)] font-medium transition-colors"
                            >
                                <Video className="w-4 h-4" />
                                <span>Suggest Video</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Click outside to close */}
            <div
                className="absolute inset-0 -z-10"
                onClick={onClose}
            />
        </div>
    );
}
