'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Event, Filters } from '@/types';
import { fetchEvents, calculateDistance } from '@/lib/api';
import { Header, Sidebar, EventDetailPanel, SuggestVideoModal, Footer, AddEventModal, AuroraBackground } from '@/components';
import { Loader2, AlertCircle, RefreshCw, Plus } from 'lucide-react';
import Image from 'next/image';

const Map = dynamic(() => import('@/components/Map'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-[var(--color-background)]">
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-[var(--color-primary)] animate-spin mx-auto mb-4" />
        <p className="text-[var(--color-text-muted)]">Loading map...</p>
      </div>
    </div>
  ),
});

export default function HomePage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [showVideoModal, setShowVideoModal] = useState<number | null>(null);
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  const [filters, setFilters] = useState<Filters>({
    country: '',
    organizer: '',
    timeFilter: 'upcoming',
    sortByDistance: false,
    userLocation: null,
  });

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

  const filteredEvents = useMemo(() => {
    let result = [...events];
    const now = new Date();

    if (filters.timeFilter === 'upcoming') {
      result = result.filter(e => new Date(e.event_date) >= now);
    } else if (filters.timeFilter === 'past') {
      result = result.filter(e => new Date(e.event_date) < now);
    }

    if (filters.country) {
      result = result.filter(e => e.country === filters.country);
    }

    if (filters.organizer) {
      result = result.filter(e => e.organizer === filters.organizer);
    }

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

    if (filters.sortByDistance && filters.userLocation) {
      result.sort((a, b) => (a.distance || 0) - (b.distance || 0));
    } else {
      if (filters.timeFilter === 'past') {
        result.sort((a, b) =>
          new Date(b.event_date).getTime() - new Date(a.event_date).getTime()
        );
      } else {
        result.sort((a, b) =>
          new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
        );
      }
    }

    return result;
  }, [events, filters]);

  const handleFilterChange = useCallback((newFilters: Partial<Filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

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
        alert('Error getting location: ' + error.message);
        setIsLoadingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, [filters.sortByDistance, handleFilterChange]);

  const handleEventSelect = useCallback((event: Event) => {
    setSelectedEventId(event.id);
  }, []);

  const handleVideoSuggestionSuccess = useCallback(() => {
    alert('Video suggestion submitted! An admin will review it.');
  }, []);

  const selectedEvent = useMemo(() =>
    filteredEvents.find(e => e.id === selectedEventId),
    [filteredEvents, selectedEventId]
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)]">
        <AuroraBackground />
        <div className="text-center relative z-10">
          <div className="w-24 h-24 rounded-3xl overflow-hidden mx-auto mb-6 shadow-2xl">
            <Image src="/logo.png" alt="DNBRIDE" width={96} height={96} className="object-cover" priority />
          </div>
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
        <AuroraBackground />
        <div className="text-center relative z-10">
          <div className="w-20 h-20 rounded-2xl bg-red-500/20 flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--color-text)] mb-2">Oops!</h1>
          <p className="text-[var(--color-text-muted)] mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 px-6 py-3 btn-coral"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[var(--color-background)]">
      <AuroraBackground />
      <Header onAddEventClick={() => setShowAddEventModal(true)} />

      <main
        className="flex-1 flex flex-col md:flex-row overflow-hidden relative"
        style={{ marginTop: 'var(--header-height)' }}
      >
        <div className="hidden md:block md:w-[var(--sidebar-width)] flex-shrink-0 md:h-full overflow-hidden relative z-10">
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

        <div className="flex-1 relative h-full z-[1]">
          <Map
            events={filteredEvents}
            selectedEventId={selectedEventId}
            onEventSelect={handleEventSelect}
            userLocation={filters.userLocation}
          />
          <Footer />
        </div>

        <div className="md:hidden">
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

      <button
        onClick={() => setShowAddEventModal(true)}
        className="md:hidden fixed bottom-36 right-4 z-40 w-14 h-14 btn-coral flex items-center justify-center text-white animate-scale-in shadow-2xl"
        style={{ marginBottom: 'env(safe-area-inset-bottom, 0px)' }}
        aria-label="Add New Ride"
      >
        <Plus className="w-7 h-7" />
      </button>

      {selectedEvent && (
        <EventDetailPanel
          event={selectedEvent}
          onClose={() => setSelectedEventId(null)}
          onSuggestVideo={(eventId) => setShowVideoModal(eventId)}
        />
      )}

      {showVideoModal !== null && (
        <SuggestVideoModal
          eventId={showVideoModal}
          onClose={() => setShowVideoModal(null)}
          onSuccess={handleVideoSuggestionSuccess}
        />
      )}

      {showAddEventModal && (
        <AddEventModal
          onClose={() => setShowAddEventModal(false)}
          onSuccess={() => {
            setShowAddEventModal(false);
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}
