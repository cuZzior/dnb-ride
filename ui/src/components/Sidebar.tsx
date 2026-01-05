'use client';

import { Event, Filters } from '@/types';
import EventCard from './EventCard';
import MobileDrawer from './MobileDrawer';
import { MapPin, Loader2, ChevronDown, SlidersHorizontal } from 'lucide-react';

interface SidebarProps {
    events: Event[];
    allEvents: Event[];
    filters: Filters;
    onFilterChange: (filters: Partial<Filters>) => void;
    selectedEventId: number | null;
    onEventSelect: (event: Event) => void;
    onNearMeClick: () => void;
    isLoadingLocation: boolean;
    isMobile?: boolean;
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
    isMobile = false,
}: SidebarProps) {
    const countries = [...new Set(
        allEvents
            .map(e => e.country)
            .filter((c): c is string => c !== null && c !== undefined && c.trim() !== '')
    )].sort();

    const organizers = [...new Set(
        allEvents
            .map(e => e.organizer)
            .filter((o): o is string => o !== null && o !== undefined && o.trim() !== '')
    )].sort();

    const now = new Date();
    const upcomingCount = allEvents.filter(e => new Date(e.event_date) >= now).length;
    const pastCount = allEvents.filter(e => new Date(e.event_date) < now).length;

    const FilterButtons = () => (
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            <button
                onClick={() => onFilterChange({ timeFilter: 'upcoming' })}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                    filters.timeFilter === 'upcoming'
                        ? 'btn-coral'
                        : 'bg-white/5 text-[var(--color-text-muted)] hover:bg-white/10'
                }`}
            >
                Upcoming ({upcomingCount})
            </button>
            <button
                onClick={() => onFilterChange({ timeFilter: 'past' })}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                    filters.timeFilter === 'past'
                        ? 'bg-white/10 text-white'
                        : 'bg-white/5 text-[var(--color-text-muted)] hover:bg-white/10'
                }`}
            >
                Past ({pastCount})
            </button>
            <button
                onClick={onNearMeClick}
                disabled={isLoadingLocation}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium flex items-center gap-1.5 whitespace-nowrap transition-all ${
                    filters.sortByDistance
                        ? 'bg-[var(--aurora-emerald)] text-white'
                        : 'bg-white/5 text-[var(--color-text-muted)] hover:bg-white/10'
                }`}
            >
                {isLoadingLocation ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MapPin className="w-3.5 h-3.5" />}
                Near Me
            </button>
        </div>
    );

    const EventsList = ({ className = "" }: { className?: string }) => (
        <div className={`space-y-3 ${className}`}>
            {events.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
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
                        onClick={(e) => {
                            e.stopPropagation();
                            onEventSelect(event);
                        }}
                    />
                ))
            )}
        </div>
    );

    if (isMobile) {
        return (
            <MobileDrawer>
                <div className="flex flex-col h-full">
                    <div className="flex items-center justify-between px-4 pb-3 flex-shrink-0">
                        <span className="text-sm font-semibold text-[var(--color-text)]">
                            {events.length} Rides
                        </span>
                    </div>

                    <div className="px-4 pb-3 flex-shrink-0">
                        <FilterButtons />
                    </div>

                    <div className="flex-1 overflow-y-auto px-4 pb-4 min-h-0">
                        <EventsList />
                    </div>
                </div>
            </MobileDrawer>
        );
    }

    return (
        <aside className="flex flex-col h-full glass-aurora rounded-r-3xl">
            <div className="p-5 border-b border-white/5 flex-shrink-0">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <h2 className="text-lg font-bold text-[var(--color-text)]">
                            Rides
                        </h2>
                        <span className="text-sm text-[var(--color-text-muted)] bg-white/5 px-3 py-1 rounded-full">
                            {events.length}
                        </span>
                    </div>
                </div>

                <FilterButtons />

                <div className="mt-4 space-y-3">
                    <div className="relative">
                        <select
                            value={filters.country}
                            onChange={(e) => onFilterChange({ country: e.target.value })}
                            className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-[var(--color-text)] text-sm appearance-none cursor-pointer focus:border-[var(--color-primary)] outline-none pr-10 transition-colors"
                        >
                            <option value="">All Countries</option>
                            {countries.map((country) => (
                                <option key={country} value={country}>
                                    {country}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)] pointer-events-none" />
                    </div>

                    <div className="relative">
                        <select
                            value={filters.organizer}
                            onChange={(e) => onFilterChange({ organizer: e.target.value })}
                            className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-[var(--color-text)] text-sm appearance-none cursor-pointer focus:border-[var(--color-primary)] outline-none pr-10 transition-colors"
                        >
                            <option value="">All Organizers</option>
                            {organizers.map((organizer) => (
                                <option key={organizer} value={organizer}>
                                    {organizer}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)] pointer-events-none" />
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
                <EventsList />
            </div>
        </aside>
    );
}
