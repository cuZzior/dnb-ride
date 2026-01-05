'use client';

import { Event } from '@/types';
import { Calendar, MapPin, User, Video, Pencil, Check, X, Trash2 } from 'lucide-react';

interface AdminEventCardProps {
    event: Event;
    onEdit: () => void;
    onApprove: () => void;
    onReject: () => void;
    onDelete: () => void;
    isLoading?: boolean;
}

export default function AdminEventCard({
    event,
    onEdit,
    onApprove,
    onReject,
    onDelete,
    isLoading
}: AdminEventCardProps) {
    const eventDate = new Date(event.event_date);
    const formatDate = eventDate.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });

    const status = (event as any).status_str || event.status || 'pending';

    const statusStyles: Record<string, string> = {
        pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
        approved: 'bg-[var(--aurora-emerald)]/20 text-[var(--aurora-emerald)] border-[var(--aurora-emerald)]/30',
        rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
    };

    return (
        <article className="glass-aurora rounded-3xl p-5 animate-fade-in">
            <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0 mr-4">
                    <h3 className="text-lg font-semibold text-[var(--color-text)] line-clamp-1 mb-2">
                        {event.title}
                    </h3>
                    <div className="flex flex-wrap gap-3 text-sm text-[var(--color-text-muted)]">
                        <span className="inline-flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-[var(--aurora-purple)]" />
                            {event.organizer}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                            {event.location_name}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-[var(--aurora-emerald)]" />
                            {formatDate}
                        </span>
                        {event.video_url && (
                            <span className="inline-flex items-center gap-1.5">
                                <Video className="w-3.5 h-3.5 text-red-400" />
                                Has video
                            </span>
                        )}
                    </div>
                </div>
                <span className={`px-3 py-1.5 rounded-full text-xs font-semibold uppercase border ${statusStyles[status]}`}>
                    {status}
                </span>
            </div>

            {event.description && (
                <p className="text-sm text-[var(--color-text-muted)] mb-4 line-clamp-2">
                    {event.description}
                </p>
            )}

            <div className="flex flex-wrap gap-2 justify-end">
                <button
                    onClick={onEdit}
                    disabled={isLoading}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[var(--aurora-blue)] hover:brightness-110 text-white text-sm font-medium transition-all disabled:opacity-50"
                >
                    <Pencil className="w-3.5 h-3.5" />
                    Edit
                </button>

                {status === 'pending' && (
                    <>
                        <button
                            onClick={onApprove}
                            disabled={isLoading}
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[var(--aurora-emerald)] hover:brightness-110 text-white text-sm font-medium transition-all disabled:opacity-50"
                        >
                            <Check className="w-3.5 h-3.5" />
                            Approve
                        </button>
                        <button
                            onClick={onReject}
                            disabled={isLoading}
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-red-500 hover:brightness-110 text-white text-sm font-medium transition-all disabled:opacity-50"
                        >
                            <X className="w-3.5 h-3.5" />
                            Reject
                        </button>
                    </>
                )}

                <button
                    onClick={onDelete}
                    disabled={isLoading}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-white/20 hover:bg-white/5 text-[var(--color-text-muted)] text-sm font-medium transition-all disabled:opacity-50"
                >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                </button>
            </div>
        </article>
    );
}
