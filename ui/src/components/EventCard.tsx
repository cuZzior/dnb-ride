'use client';

import { Event } from '@/types';
import Image from 'next/image';
import { MapPin, Clock, User, Play, Calendar } from 'lucide-react';

interface EventCardProps {
    event: Event;
    onClick?: () => void;
    isSelected?: boolean;
}

export default function EventCard({ event, onClick, isSelected }: EventCardProps) {
    const eventDate = new Date(event.event_date);
    const isPast = eventDate < new Date();
    const formattedDate = eventDate.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
    });
    const formattedTime = eventDate.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
    });

    return (
        <article
            className={`
        rounded-xl overflow-hidden cursor-pointer card-hover
        bg-[var(--color-surface-light)] border border-white/5
        ${isSelected ? 'ring-2 ring-[var(--color-accent)] border-transparent' : ''}
        ${isPast ? 'opacity-60' : ''}
      `}
            onClick={onClick}
        >
            {/* Event Image */}
            <div className="relative h-28 bg-[var(--color-surface)]">
                {event.image_url ? (
                    <Image
                        src={event.image_url}
                        alt={event.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 400px"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[var(--color-primary)]/20 to-[var(--color-accent)]/20">
                        <div className="w-12 h-12 rounded-full bg-[var(--color-surface)] flex items-center justify-center">
                            <Calendar className="w-6 h-6 text-[var(--color-text-muted)]" />
                        </div>
                    </div>
                )}

                {/* Date badge */}
                <div className="absolute top-2 left-2 px-2 py-1 rounded-md bg-black/60 backdrop-blur text-xs font-medium text-white">
                    {formattedDate}
                </div>

                {/* Past event badge */}
                {isPast && (
                    <div className="absolute top-2 right-2 px-2 py-1 rounded-md bg-[var(--color-surface)]/80 backdrop-blur text-xs text-[var(--color-text-muted)]">
                        Past
                    </div>
                )}

                {/* Video indicator */}
                {event.video_url && (
                    <div className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-red-500 flex items-center justify-center">
                        <Play className="w-4 h-4 text-white fill-white" />
                    </div>
                )}
            </div>

            {/* Event Details */}
            <div className="p-3">
                <h3 className="text-sm font-semibold text-[var(--color-text)] line-clamp-1 mb-2">
                    {event.title}
                </h3>

                <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] mb-1.5">
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="line-clamp-1">{event.location_name}</span>
                </div>

                <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-[var(--color-text-muted)]">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{formattedTime}</span>
                    </div>

                    {event.distance !== undefined && (
                        <span className="text-[var(--color-accent)] font-medium">
                            {event.distance.toFixed(1)} km
                        </span>
                    )}
                </div>

                {event.organizer && (
                    <div className="mt-2 pt-2 border-t border-white/5 flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
                        <User className="w-3.5 h-3.5" />
                        <span className="line-clamp-1">{event.organizer}</span>
                    </div>
                )}
            </div>
        </article>
    );
}
