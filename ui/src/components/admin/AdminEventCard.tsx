'use client';

import { Event } from '@/types';

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

    // Get status from event (handle both status and status_str from backend)
    const status = (event as any).status_str || event.status || 'pending';

    const statusColors: Record<string, string> = {
        pending: 'bg-yellow-500/20 text-yellow-400',
        approved: 'bg-green-500/20 text-green-400',
        rejected: 'bg-red-500/20 text-red-400',
    };

    return (
        <article className="glass rounded-xl p-5 animate-fade-in">
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-semibold text-[var(--color-text)] line-clamp-1">
                    {event.title}
                </h3>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${statusColors[status]}`}>
                    {status}
                </span>
            </div>

            {/* Meta */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-[var(--color-text-muted)] mb-3">
                <span className="text-[var(--color-accent)]">👤 {event.organizer}</span>
                <span>📍 {event.location_name}</span>
                <span>📅 {formatDate}</span>
                {event.video_url && <span>🎬 Has video</span>}
            </div>

            {/* Description */}
            {event.description && (
                <p className="text-sm text-[var(--color-text-muted)] mb-4 line-clamp-2">
                    {event.description}
                </p>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-2 justify-end">
                <button
                    onClick={onEdit}
                    disabled={isLoading}
                    className="px-4 py-2 rounded-lg bg-[var(--color-accent)] hover:bg-[var(--color-accent-dark)] text-white text-sm font-medium transition-colors disabled:opacity-50"
                >
                    Edit
                </button>

                {status === 'pending' && (
                    <>
                        <button
                            onClick={onApprove}
                            disabled={isLoading}
                            className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-medium transition-colors disabled:opacity-50"
                        >
                            Approve
                        </button>
                        <button
                            onClick={onReject}
                            disabled={isLoading}
                            className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors disabled:opacity-50"
                        >
                            Reject
                        </button>
                    </>
                )}

                <button
                    onClick={onDelete}
                    disabled={isLoading}
                    className="px-4 py-2 rounded-lg border border-white/20 hover:bg-white/5 text-[var(--color-text-muted)] text-sm font-medium transition-colors disabled:opacity-50"
                >
                    Delete
                </button>
            </div>
        </article>
    );
}
