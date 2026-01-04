'use client';

import { useState } from 'react';
import { submitVideoSuggestion } from '@/lib/api';
import { X, Video, Loader2 } from 'lucide-react';

interface SuggestVideoModalProps {
    eventId: number;
    onClose: () => void;
    onSuccess: () => void;
}

export default function SuggestVideoModal({ eventId, onClose, onSuccess }: SuggestVideoModalProps) {
    const [videoUrl, setVideoUrl] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!videoUrl.trim()) {
            setError('Please enter a YouTube URL');
            return;
        }

        const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
        if (!youtubeRegex.test(videoUrl)) {
            setError('Please enter a valid YouTube URL');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            await submitVideoSuggestion(eventId, videoUrl);
            onSuccess();
            onClose();
        } catch (err) {
            setError('Failed to submit suggestion. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
            <div
                className="bg-[var(--color-surface)] w-full max-w-md rounded-2xl overflow-hidden shadow-2xl animate-slide-up border border-white/10"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/10">
                    <div className="flex items-center gap-2">
                        <Video className="w-5 h-5 text-[var(--color-accent)]" />
                        <h3 className="text-lg font-semibold text-[var(--color-text)]">
                            Suggest a Video
                        </h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-[var(--color-text-muted)]"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div>
                        <label
                            htmlFor="videoUrl"
                            className="block text-sm font-medium text-[var(--color-text-muted)] mb-2"
                        >
                            YouTube Video URL
                        </label>
                        <input
                            type="url"
                            id="videoUrl"
                            value={videoUrl}
                            onChange={(e) => setVideoUrl(e.target.value)}
                            placeholder="https://www.youtube.com/watch?v=..."
                            className="w-full px-4 py-3 rounded-lg bg-[var(--color-background)] border border-white/10 text-[var(--color-text)] placeholder-[var(--color-text-muted)]/50 focus:border-[var(--color-accent)] outline-none"
                            disabled={isSubmitting}
                        />
                    </div>

                    {error && (
                        <p className="text-sm text-red-400">
                            {error}
                        </p>
                    )}

                    <p className="text-xs text-[var(--color-text-muted)]">
                        Have a video from this event? Submit it and an admin will review it.
                    </p>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 rounded-lg border border-white/20 text-[var(--color-text)] font-medium hover:bg-white/5 transition-colors"
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg btn-gradient disabled:opacity-50"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Submitting...</span>
                                </>
                            ) : (
                                <span>Submit</span>
                            )}
                        </button>
                    </div>
                </form>
            </div>

            <div className="absolute inset-0 -z-10" onClick={onClose} />
        </div>
    );
}
