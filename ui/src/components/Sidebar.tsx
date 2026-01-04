'use client';

import { useState } from 'react';
import { Event, Filters } from '@/types';
import EventCard from './EventCard';
import { MapPin, Loader2, ChevronDown, SlidersHorizontal, ChevronUp } from 'lucide-react';

interface SidebarProps {
    events: Event[];
    allEvents: Event[];
    filters: Filters;
    onFilterChange: (filters: Partial<Filters>) => void;
    selectedEventId: number | null;
    onEventSelect: (event: Event) => void;
    onNearMeClick: () => void;
    isLoadingLocation: boolean;
}

export default function Sidebar({
    events,
    allEvents,
    filters,
    onFilterChange,
    selectedEventId,
    onEventSelect,
    onNearMeClick,
    isLoadingLocation,
}: SidebarProps) {
    const [showFilters, setShowFilters] = useState(false);

    // Get unique countries from ALL events
    const countries = [...new Set(
        allEvents
            .map(e => e.country)
            .filter((c): c is string => c !== null && c !== undefined && c.trim() !== '')
    )].sort();

    // Get unique organizers from ALL events
    const organizers = [...new Set(
        allEvents
            .map(e => e.organizer)
            .filter((o): o is string => o !== null && o !== undefined && o.trim() !== '')
    )].sort();

    // Count events by time from ALL events
    const now = new Date();
    const upcomingCount = allEvents.filter(e => new Date(e.event_date) >= now).length;
    const pastCount = allEvents.filter(e => new Date(e.event_date) < now).length;

    return (
        <aside className="flex flex-col h-full bg-[var(--color-surface)] border-r border-white/5">
            {/* Header */}
            <div className="p-4 border-b border-white/5 flex-shrink-0">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <h2 className="text-lg font-bold text-[var(--color-text)]">
                            Rides
                        </h2>
                        <span className="text-sm text-[var(--color-text-muted)] bg-[var(--color-surface-light)] px-2 py-1 rounded-full">
                            {events.length}
                        </span>
                    </div>

                    {/* Filter Toggle Mobile */}
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="p-2 rounded-lg bg-[var(--color-surface-light)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
                        aria-label="Toggle Filters"
                    >
                        <SlidersHorizontal className="w-4 h-4" />
                    </button>
                </div>

                {/* Collapsible Filters Section */}
                <div className={`space-y-4 overflow-hidden transition-all duration-300 ${showFilters ? 'max-h-[500px] opacity-100 mb-4' : 'max-h-0 opacity-0'}`}>
                    {/* Time filter tabs */}
                    <div className="flex gap-1 p-1 bg-[var(--color-background)] rounded-lg">
                        <button
                            onClick={() => onFilterChange({ timeFilter: 'upcoming' })}
                            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${filters.timeFilter === 'upcoming'
                                ? 'bg-[var(--color-primary)] text-white'
                                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                                }`}
                        >
                            Upcoming ({upcomingCount})
                        </button>
                        <button
                            onClick={() => onFilterChange({ timeFilter: 'past' })}
                            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${filters.timeFilter === 'past'
                                ? 'bg-[var(--color-surface-light)] text-white'
                                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                                }`}
                        >
                            Past ({pastCount})
                        </button>
                    </div>

                    {/* Filters */}
                    <div className="space-y-3">
                        {/* Country Filter */}
                        <div className="relative">
                            <select
                                value={filters.country}
                                onChange={(e) => onFilterChange({ country: e.target.value })}
                                className="w-full px-3 py-2.5 rounded-lg bg-[var(--color-background)] border border-white/10 text-[var(--color-text)] text-sm appearance-none cursor-pointer focus:border-[var(--color-accent)] outline-none pr-10"
                            >
                                <option value="">All Countries</option>
                                {countries.map((country) => (
                                    <option key={country} value={country}>
                                        {country}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)] pointer-events-none" />
                        </div>

                        {/* Organizer Filter */}
                        <div className="relative">
                            <select
                                value={filters.organizer}
                                onChange={(e) => onFilterChange({ organizer: e.target.value })}
                                className="w-full px-3 py-2.5 rounded-lg bg-[var(--color-background)] border border-white/10 text-[var(--color-text)] text-sm appearance-none cursor-pointer focus:border-[var(--color-accent)] outline-none pr-10"
                            >
                                <option value="">All Organizers</option>
                                {organizers.map((organizer) => (
                                    <option key={organizer} value={organizer}>
                                        {organizer}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)] pointer-events-none" />
                        </div>

                        {/* Near Me Button */}
                        <button
                            onClick={onNearMeClick}
                            disabled={isLoadingLocation}
                            className={`w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg font-medium text-sm transition-all ${filters.sortByDistance
                                ? 'bg-[var(--color-accent)] text-white shadow-lg shadow-[var(--color-accent)]/20'
                                : 'bg-[var(--color-background)] border border-white/10 text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:border-[var(--color-accent)]'
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            {isLoadingLocation ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Locating...</span>
                                </>
                            ) : (
                                <>
                                    <MapPin className="w-4 h-4" />
                                    <span>{filters.sortByDistance ? 'Sorted by Distance' : 'Near Me'}</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Events List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {events.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="w-16 h-16 rounded-full bg-[var(--color-surface-light)] flex items-center justify-center mb-4">
                            <MapPin className="w-8 h-8 text-[var(--color-text-muted)]" />
                        </div>
                        <p className="text-[var(--color-text-muted)] font-medium">No events found</p>
                        <p className="text-sm text-[var(--color-text-muted)]/60 mt-1">Try adjusting your filters</p>
                    </div>
                ) : (
                    events.map((event) => (
                        <EventCard
                            key={event.id}
                            event={event}
                            isSelected={event.id === selectedEventId}
                            onClick={() => onEventSelect(event)}
                        />
                    ))
                )}
            </div>
        </aside>
    );
}
