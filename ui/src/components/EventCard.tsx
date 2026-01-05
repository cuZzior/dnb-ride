'use client';

import { Event } from '@/types';
import Image from 'next/image';
import { MapPin, Clock, User, Play, Calendar } from 'lucide-react';

interface EventCardProps {
    event: Event;
    onClick?: (e: React.MouseEvent) => void;
    isSelected?: boolean;
    compact?: boolean;
}

export default function EventCard({ event, onClick, isSelected, compact = false }: EventCardProps) {
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

    if (compact) {
        return (
            <article
                className={`
                    flex-shrink-0 w-64 rounded-3xl overflow-hidden cursor-pointer card-aurora
                    glass-aurora-light
                    ${isSelected ? 'ring-2 ring-[var(--color-primary)]' : ''}
                `}
                onClick={onClick}
            >
                <div className="flex h-20">
                    <div className="relative w-20 h-full flex-shrink-0 bg-white/5">
                        {event.image_url ? (
                            <Image
                                src={event.image_url}
                                alt={event.title}
                                fill
                                className="object-cover"
                                sizes="80px"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[var(--color-primary)]/20 to-[var(--aurora-purple)]/20">
                                <Calendar className="w-5 h-5 text-[var(--color-text-muted)]" />
                            </div>
                        )}
                        {event.video_url && (
                            <div className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
                                <Play className="w-2.5 h-2.5 text-white fill-white" />
                            </div>
                        )}
                    </div>
                    <div className="flex-1 p-2.5 flex flex-col justify-center min-w-0">
                        <h3 className="text-xs font-semibold text-[var(--color-text)] line-clamp-1 mb-1">
                            {event.title}
                        </h3>
                        <div className="flex items-center gap-1 text-[10px] text-[var(--color-text-muted)] mb-0.5">
                            <Calendar className="w-3 h-3 flex-shrink-0" />
                            <span>{formattedDate}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-[var(--color-text-muted)]">
                            <MapPin className="w-3 h-3 flex-shrink-0" />
                            <span className="line-clamp-1">{event.location_name}</span>
                        </div>
                    </div>
                </div>
            </article>
        );
    }

    return (
        <article
            className={`
                rounded-2xl overflow-hidden cursor-pointer card-aurora p-3
                glass-aurora-light
                ${isSelected ? 'ring-2 ring-[var(--color-primary)]' : ''}
            `}
            onClick={onClick}
        >
            <div className="flex gap-3">
                <div className="relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-white/5">
                    {event.image_url ? (
                        <Image
                            src={event.image_url}
                            alt={event.title}
                            fill
                            className="object-cover"
                            sizes="56px"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[var(--color-primary)]/20 to-[var(--aurora-purple)]/20">
                            <Calendar className="w-5 h-5 text-[var(--color-text-muted)]" />
                        </div>
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="text-sm font-semibold text-[var(--color-text)] line-clamp-1">
                            {event.title}
                        </h3>
                        <div className="flex items-center gap-1 flex-shrink-0">
                            {event.video_url && (
                                <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
                                    <Play className="w-2.5 h-2.5 text-white fill-white" />
                                </div>
                            )}
                            {isPast && (
                                <span className="px-2 py-0.5 rounded-full bg-white/10 text-[10px] text-[var(--color-text-muted)]">
                                    Past
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-[var(--color-text-muted)] mb-1">
                        <div className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                            <span>{formattedDate}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-[var(--aurora-emerald)]" />
                            <span>{formattedTime}</span>
                        </div>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1 text-[var(--color-text-muted)] min-w-0">
                            <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-[var(--color-primary)]" />
                            <span className="line-clamp-1">{event.location_name}</span>
                        </div>

                        {event.distance !== undefined && (
                            <span className="text-[var(--aurora-emerald)] font-medium flex-shrink-0 ml-2">
                                {event.distance.toFixed(1)} km
                            </span>
                        )}
                    </div>

                    {event.organizer && (
                        <div className="flex items-center gap-1 text-xs text-[var(--color-text-muted)] mt-1.5 pt-1.5 border-t border-white/5">
                            <User className="w-3 h-3 flex-shrink-0" />
                            <span className="line-clamp-1">{event.organizer}</span>
                        </div>
                    )}
                </div>
            </div>
        </article>
    );
}
