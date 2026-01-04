'use client';

import { VideoSuggestion } from '@/types';

interface SuggestionCardProps {
    suggestion: VideoSuggestion;
    onApprove: () => void;
    onReject: () => void;
    isLoading?: boolean;
}

export default function SuggestionCard({
    suggestion,
    onApprove,
    onReject,
    isLoading
}: SuggestionCardProps) {
    const createdDate = new Date(suggestion.created_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });

    return (
        <article className="glass rounded-xl p-5 animate-fade-in">
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-semibold text-[var(--color-text)]">
                    Suggestion for: {suggestion.event_title || `Event #${suggestion.event_id}`}
                </h3>
                <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase bg-yellow-500/20 text-yellow-400">
                    Pending
                </span>
            </div>

            {/* Meta */}
            <div className="text-sm text-[var(--color-text-muted)] mb-4">
                Submitted: {createdDate}
            </div>

            {/* Video URL */}
            <div className="mb-4">
                <input
                    type="text"
                    value={suggestion.video_url}
                    readOnly
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--color-background)]/50 border border-white/10 text-[var(--color-text)] text-sm cursor-pointer"
                />
                <a
                    href={suggestion.video_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-2 text-sm text-[var(--color-accent)] hover:underline"
                >
                    Test Link →
                </a>
            </div>

            {/* Actions */}
            <div className="flex gap-2 justify-end">
                <button
                    onClick={onApprove}
                    disabled={isLoading}
                    className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-medium transition-colors disabled:opacity-50"
                >
                    Approve & Update Event
                </button>
                <button
                    onClick={onReject}
                    disabled={isLoading}
                    className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors disabled:opacity-50"
                >
                    Reject
                </button>
            </div>
        </article>
    );
}
