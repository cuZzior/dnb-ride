'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Event, VideoSuggestion } from '@/types';
import {
    fetchAllEventsAdmin,
    approveEvent,
    rejectEvent,
    deleteEvent,
    fetchSuggestions,
    approveSuggestion,
    rejectSuggestion
} from '@/lib/admin-api';
import { AdminEventCard, EditEventModal, SuggestionCard } from '@/components/admin';

type Tab = 'all' | 'pending' | 'approved' | 'rejected' | 'suggestions';

export default function AdminPage() {
    // Auth state
    const [adminKey, setAdminKey] = useState('');
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Data state
    const [events, setEvents] = useState<Event[]>([]);
    const [suggestions, setSuggestions] = useState<VideoSuggestion[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // UI state
    const [currentTab, setCurrentTab] = useState<Tab>('all');
    const [editingEvent, setEditingEvent] = useState<Event | null>(null);
    const [toast, setToast] = useState<string | null>(null);

    // Show toast message
    const showToast = useCallback((message: string) => {
        setToast(message);
        setTimeout(() => setToast(null), 3000);
    }, []);

    // Load events
    const loadEvents = useCallback(async () => {
        if (!adminKey) {
            showToast('Please enter admin key');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const data = await fetchAllEventsAdmin(adminKey);
            setEvents(data);
            setIsAuthenticated(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load events');
            if (err instanceof Error && err.message.includes('Invalid')) {
                setIsAuthenticated(false);
            }
        } finally {
            setIsLoading(false);
        }
    }, [adminKey, showToast]);

    // Load suggestions when switching to suggestions tab
    const loadSuggestionsData = useCallback(async () => {
        if (!adminKey) return;

        setIsLoading(true);
        try {
            const data = await fetchSuggestions(adminKey);
            setSuggestions(data);
        } catch (err) {
            showToast(err instanceof Error ? err.message : 'Failed to load suggestions');
        } finally {
            setIsLoading(false);
        }
    }, [adminKey, showToast]);

    // Handle tab switch
    const handleTabSwitch = useCallback((tab: Tab) => {
        setCurrentTab(tab);
        if (tab === 'suggestions') {
            loadSuggestionsData();
        }
    }, [loadSuggestionsData]);

    // Filter events by tab
    const filteredEvents = useMemo(() => {
        if (currentTab === 'all' || currentTab === 'suggestions') return events;
        return events.filter(e => {
            const status = (e as any).status_str || e.status;
            return status === currentTab;
        });
    }, [events, currentTab]);

    // Event actions
    const handleApproveEvent = useCallback(async (eventId: number) => {
        try {
            await approveEvent(adminKey, eventId);
            showToast('Event approved');
            loadEvents();
        } catch (err) {
            showToast(err instanceof Error ? err.message : 'Failed to approve event');
        }
    }, [adminKey, loadEvents, showToast]);

    const handleRejectEvent = useCallback(async (eventId: number) => {
        try {
            await rejectEvent(adminKey, eventId);
            showToast('Event rejected');
            loadEvents();
        } catch (err) {
            showToast(err instanceof Error ? err.message : 'Failed to reject event');
        }
    }, [adminKey, loadEvents, showToast]);

    const handleDeleteEvent = useCallback(async (eventId: number) => {
        if (!confirm('Are you sure you want to delete this event?')) return;

        try {
            await deleteEvent(adminKey, eventId);
            showToast('Event deleted');
            loadEvents();
        } catch (err) {
            showToast(err instanceof Error ? err.message : 'Failed to delete event');
        }
    }, [adminKey, loadEvents, showToast]);

    // Suggestion actions
    const handleApproveSuggestion = useCallback(async (suggestionId: number) => {
        try {
            await approveSuggestion(adminKey, suggestionId);
            showToast('Suggestion approved and event updated');
            loadSuggestionsData();
        } catch (err) {
            showToast(err instanceof Error ? err.message : 'Failed to approve suggestion');
        }
    }, [adminKey, loadSuggestionsData, showToast]);

    const handleRejectSuggestion = useCallback(async (suggestionId: number) => {
        try {
            await rejectSuggestion(adminKey, suggestionId);
            showToast('Suggestion rejected');
            loadSuggestionsData();
        } catch (err) {
            showToast(err instanceof Error ? err.message : 'Failed to reject suggestion');
        }
    }, [adminKey, loadSuggestionsData, showToast]);

    const tabs: { id: Tab; label: string }[] = [
        { id: 'all', label: 'All Events' },
        { id: 'pending', label: 'Pending' },
        { id: 'approved', label: 'Approved' },
        { id: 'rejected', label: 'Rejected' },
        { id: 'suggestions', label: 'Suggestions' },
    ];

    return (
        <div className="min-h-screen bg-[var(--color-background)] p-4 md:p-6">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <header className="flex flex-wrap items-center justify-between gap-4 pb-6 mb-6 border-b border-white/10">
                    <div>
                        <Link href="/" className="text-sm text-[var(--color-accent)] hover:underline mb-2 block">
                            ← Back to Map
                        </Link>
                        <h1 className="text-2xl font-bold text-[var(--color-primary)]">
                            Admin Panel
                        </h1>
                    </div>

                    <div className="flex gap-3 items-center">
                        <input
                            type="password"
                            value={adminKey}
                            onChange={(e) => setAdminKey(e.target.value)}
                            placeholder="Enter Admin Key"
                            className="px-4 py-2 rounded-lg bg-[var(--color-surface)] border border-white/10 text-[var(--color-text)] focus:border-[var(--color-accent)] outline-none"
                            onKeyDown={(e) => e.key === 'Enter' && loadEvents()}
                        />
                        <button
                            onClick={loadEvents}
                            disabled={isLoading}
                            className="px-5 py-2 rounded-lg bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white font-medium transition-colors disabled:opacity-50"
                        >
                            {isLoading ? 'Loading...' : 'Load Events'}
                        </button>
                    </div>
                </header>

                {/* Tabs */}
                {isAuthenticated && (
                    <div className="flex flex-wrap gap-2 mb-6">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => handleTabSwitch(tab.id)}
                                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${currentTab === tab.id
                                    ? 'bg-[var(--color-accent)] text-white'
                                    : 'border border-white/10 text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="mb-6 p-4 rounded-lg bg-red-500/20 text-red-400">
                        {error}
                    </div>
                )}

                {/* Content */}
                {!isAuthenticated ? (
                    <div className="text-center py-16 text-[var(--color-text-muted)]">
                        <p>Enter admin key and click "Load Events" to manage events.</p>
                    </div>
                ) : currentTab === 'suggestions' ? (
                    <div className="space-y-4">
                        {suggestions.length === 0 ? (
                            <div className="text-center py-16 text-[var(--color-text-muted)]">
                                <p>No pending suggestions.</p>
                            </div>
                        ) : (
                            suggestions.map((suggestion) => (
                                <SuggestionCard
                                    key={suggestion.id}
                                    suggestion={suggestion}
                                    onApprove={() => handleApproveSuggestion(suggestion.id)}
                                    onReject={() => handleRejectSuggestion(suggestion.id)}
                                    isLoading={isLoading}
                                />
                            ))
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredEvents.length === 0 ? (
                            <div className="text-center py-16 text-[var(--color-text-muted)]">
                                <p>No {currentTab === 'all' ? '' : currentTab} events found.</p>
                            </div>
                        ) : (
                            filteredEvents.map((event) => (
                                <AdminEventCard
                                    key={event.id}
                                    event={event}
                                    onEdit={() => setEditingEvent(event)}
                                    onApprove={() => handleApproveEvent(event.id)}
                                    onReject={() => handleRejectEvent(event.id)}
                                    onDelete={() => handleDeleteEvent(event.id)}
                                    isLoading={isLoading}
                                />
                            ))
                        )}
                    </div>
                )}
            </div>

            {/* Edit Modal */}
            {editingEvent && (
                <EditEventModal
                    event={editingEvent}
                    adminKey={adminKey}
                    onClose={() => setEditingEvent(null)}
                    onSuccess={() => {
                        showToast('Event updated successfully');
                        loadEvents();
                    }}
                />
            )}

            {/* Toast */}
            {toast && (
                <div className="fixed bottom-6 right-6 px-6 py-3 rounded-lg bg-[var(--color-primary)] text-white font-medium shadow-lg animate-slide-up">
                    {toast}
                </div>
            )}
        </div>
    );
}
