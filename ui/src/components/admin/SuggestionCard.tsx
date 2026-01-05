'use client';

import { VideoSuggestion } from '@/types';
import { Video, Check, X, ExternalLink } from 'lucide-react';

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
        <article className="glass-aurora rounded-3xl p-5 animate-fade-in">
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[var(--aurora-purple)]/20 flex items-center justify-center">
                        <Video className="w-5 h-5 text-[var(--aurora-purple)]" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-[var(--color-text)]">
                            {suggestion.event_title || `Event #${suggestion.event_id}`}
                        </h3>
                        <p className="text-sm text-[var(--color-text-muted)]">
                            Submitted: {createdDate}
                        </p>
                    </div>
                </div>
                <span className="px-3 py-1.5 rounded-full text-xs font-semibold uppercase bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                    Pending
                </span>
            </div>

            <div className="mb-4">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={suggestion.video_url}
                        readOnly
                        onClick={(e) => (e.target as HTMLInputElement).select()}
                        className="flex-1 px-4 py-3 input-aurora cursor-pointer text-sm"
                    />
                    <a
                        href={suggestion.video_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl border border-white/20 hover:bg-white/5 text-[var(--color-text-muted)] text-sm transition-colors"
                    >
                        <ExternalLink className="w-4 h-4" />
                        Test
                    </a>
                </div>
            </div>

            <div className="flex gap-2 justify-end">
                <button
                    onClick={onApprove}
                    disabled={isLoading}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[var(--aurora-emerald)] hover:brightness-110 text-white text-sm font-medium transition-all disabled:opacity-50"
                >
                    <Check className="w-4 h-4" />
                    Approve & Update Event
                </button>
                <button
                    onClick={onReject}
                    disabled={isLoading}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-red-500 hover:brightness-110 text-white text-sm font-medium transition-all disabled:opacity-50"
                >
                    <X className="w-4 h-4" />
                    Reject
                </button>
            </div>
        </article>
    );
}
