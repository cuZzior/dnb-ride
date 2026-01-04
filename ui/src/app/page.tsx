'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Event, Filters } from '@/types';
import { fetchEvents, calculateDistance } from '@/lib/api';
import { Header, Sidebar, EventDetailPanel, SuggestVideoModal, Footer, AddEventModal } from '@/components';
import { Bike, Loader2, AlertCircle, RefreshCw, Plus } from 'lucide-react';

// Dynamic import for Map to avoid SSR issues with Mapbox
const Map = dynamic(() => import('@/components/Map'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-[var(--color-surface)]">
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-[var(--color-accent)] animate-spin mx-auto mb-4" />
        <p className="text-[var(--color-text-muted)]">Loading map...</p>
      </div>
    </div>
  ),
});

export default function HomePage() {
  // Data state
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI state
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [showVideoModal, setShowVideoModal] = useState<number | null>(null);
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  // Filters - default to upcoming events
  const [filters, setFilters] = useState<Filters>({
    country: '',
    organizer: '',
    timeFilter: 'upcoming',
    sortByDistance: false,
    userLocation: null,
  });

  // Fetch initial data
  useEffect(() => {
    async function loadData() {
      try {
        const eventsData = await fetchEvents();
        setEvents(eventsData);
      } catch (err) {
        setError('Failed to load events. Please try again.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // Filter and sort events
  const filteredEvents = useMemo(() => {
    let result = [...events];
    const now = new Date();

    // Filter by time
    if (filters.timeFilter === 'upcoming') {
      result = result.filter(e => new Date(e.event_date) >= now);
    } else if (filters.timeFilter === 'past') {
      result = result.filter(e => new Date(e.event_date) < now);
    }

    // Filter by country
    if (filters.country) {
      result = result.filter(e => e.country === filters.country);
    }

    // Filter by organizer
    if (filters.organizer) {
      result = result.filter(e => e.organizer === filters.organizer);
    }

    // Add distance if user location is available
    if (filters.userLocation) {
      result = result.map(event => ({
        ...event,
        distance: calculateDistance(
          filters.userLocation!.lat,
          filters.userLocation!.lng,
          event.latitude,
          event.longitude
        ),
      }));
    }

    // Sort by distance or date
    if (filters.sortByDistance && filters.userLocation) {
      result.sort((a, b) => (a.distance || 0) - (b.distance || 0));
    } else {
      // Sort by date
      if (filters.timeFilter === 'past') {
        // Past: most recent first
        result.sort((a, b) =>
          new Date(b.event_date).getTime() - new Date(a.event_date).getTime()
        );
      } else {
        // Upcoming: soonest first
        result.sort((a, b) =>
          new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
        );
      }
    }

    return result;
  }, [events, filters]);

  // Handle filter changes
  const handleFilterChange = useCallback((newFilters: Partial<Filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  // Handle "Near Me" button
  const handleNearMe = useCallback(() => {
    if (filters.sortByDistance) {
      handleFilterChange({ sortByDistance: false });
      return;
    }

    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setIsLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        handleFilterChange({
          userLocation: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          },
          sortByDistance: true,
        });
        setIsLoadingLocation(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        alert('Unable to get your location. Please check your permissions.');
        setIsLoadingLocation(false);
      }
    );
  }, [filters.sortByDistance, handleFilterChange]);

  // Handle event selection
  const handleEventSelect = useCallback((event: Event) => {
    setSelectedEventId(event.id);
  }, []);

  // Handle video suggestion success
  const handleVideoSuggestionSuccess = useCallback(() => {
    alert('Video suggestion submitted! An admin will review it.');
  }, []);

  // Get selected event
  const selectedEvent = useMemo(() =>
    filteredEvents.find(e => e.id === selectedEventId),
    [filteredEvents, selectedEventId]
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)]">
        <div className="text-center">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] flex items-center justify-center mx-auto mb-6">
            <Bike className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--color-text)] mb-2">DNB On The Bike</h1>
          <div className="flex items-center justify-center gap-2 text-[var(--color-text-muted)]">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Loading events...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)]">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--color-text)] mb-2">Oops!</h1>
          <p className="text-[var(--color-text-muted)] mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg btn-gradient"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Header onAddEventClick={() => setShowAddEventModal(true)} />

      <main
        className="flex-1 flex flex-col md:flex-row overflow-hidden relative"
        style={{ marginTop: 'var(--header-height)' }}
      >
        {/* Desktop: Sidebar on left */}
        <div className="hidden md:block md:w-[var(--sidebar-width)] flex-shrink-0 md:h-full overflow-hidden">
          <Sidebar
            events={filteredEvents}
            allEvents={events}
            filters={filters}
            onFilterChange={handleFilterChange}
            selectedEventId={selectedEventId}
            onEventSelect={handleEventSelect}
            onNearMeClick={handleNearMe}
            isLoadingLocation={isLoadingLocation}
          />
        </div>

        {/* Map - full height on mobile, flex-1 on desktop */}
        <div className="flex-1 relative h-full">
          <Map
            events={filteredEvents}
            selectedEventId={selectedEventId}
            onEventSelect={handleEventSelect}
            userLocation={filters.userLocation}
          />
          <Footer />
        </div>

        {/* Mobile: Bottom sheet with events */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-30">
          <Sidebar
            events={filteredEvents}
            allEvents={events}
            filters={filters}
            onFilterChange={handleFilterChange}
            selectedEventId={selectedEventId}
            onEventSelect={handleEventSelect}
            onNearMeClick={handleNearMe}
            isLoadingLocation={isLoadingLocation}
            isMobile={true}
          />
        </div>
      </main>

      {/* FAB - Add Ride (Mobile) */}
      <button
        onClick={() => setShowAddEventModal(true)}
        className="md:hidden fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full btn-gradient shadow-xl shadow-[var(--color-primary)]/30 flex items-center justify-center text-white animate-scale-in"
        aria-label="Add New Ride"
      >
        <Plus className="w-8 h-8" />
      </button>

      {/* Event Detail Modal */}
      {selectedEvent && (
        <EventDetailPanel
          event={selectedEvent}
          onClose={() => setSelectedEventId(null)}
          onSuggestVideo={(eventId) => setShowVideoModal(eventId)}
        />
      )}

      {/* Suggest Video Modal */}
      {showVideoModal !== null && (
        <SuggestVideoModal
          eventId={showVideoModal}
          onClose={() => setShowVideoModal(null)}
          onSuccess={handleVideoSuggestionSuccess}
        />
      )}

      {/* Add AddEventModal */}
      {showAddEventModal && (
        <AddEventModal
          onClose={() => setShowAddEventModal(false)}
          onSuccess={() => {
            setShowAddEventModal(false);
            // In a real app we might refetch, but here we can rely on manual refresh or add an onRefresh callback to page
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}
