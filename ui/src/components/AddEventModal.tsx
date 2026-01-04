'use client';

import { useState, useRef, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { X, Calendar, MapPin, Loader2, Navigation, Search } from 'lucide-react';

interface AddEventModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

export default function AddEventModal({ onClose, onSuccess }: AddEventModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Geocoding state
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        title: '',
        organizer: '',
        location_name: '',
        country: '',
        latitude: 0,
        longitude: 0,
        event_date: '',
        event_time: '',
        description: '',
        event_link: '',
        image_url: ''
    });

    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<mapboxgl.Map | null>(null);
    const marker = useRef<mapboxgl.Marker | null>(null);

    // Initialize map
    useEffect(() => {
        if (!mapContainer.current || map.current) return;

        const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
        if (!mapboxToken) return;

        mapboxgl.accessToken = mapboxToken;

        map.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: 'mapbox://styles/mapbox/dark-v11',
            center: [10.4515, 51.1657], // Default to Germany/Europe
            zoom: 4,
        });

        // Add navigation controls
        map.current.addControl(new mapboxgl.NavigationControl(), 'bottom-right');

        // Click handler to pick location
        map.current.on('click', (e) => {
            const { lng, lat } = e.lngLat;
            updateLocation(lng, lat);
        });

        // Resize map on mount to ensure full rendering
        setTimeout(() => map.current?.resize(), 200);

    }, []);

    const updateLocation = async (lng: number, lat: number) => {
        // Update marker
        if (marker.current) {
            marker.current.setLngLat([lng, lat]);
        } else {
            marker.current = new mapboxgl.Marker({ color: '#ff3b5c' })
                .setLngLat([lng, lat])
                .addTo(map.current!);
        }

        // Optimistically update coords first
        setFormData(prev => ({
            ...prev,
            latitude: Number(lat.toFixed(6)),
            longitude: Number(lng.toFixed(6))
        }));

        // Reverse Geocoding to get City/Country
        try {
            const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
            const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxToken}&types=place,country,locality`);
            const data = await res.json();

            if (data.features && data.features.length > 0) {
                let city = '';
                let country = '';

                for (const feature of data.features) {
                    if (feature.place_type.includes('place') || feature.place_type.includes('locality')) {
                        city = feature.text;
                    } else if (feature.place_type.includes('country')) {
                        country = feature.text;
                    }
                }

                setFormData(prev => ({
                    ...prev,
                    location_name: city || prev.location_name, // Only overwrite if found
                    country: country || prev.country
                }));
            }
        } catch (err) {
            console.error("Reverse geocoding failed", err);
            // Non-critical error, just don't autofill
        }
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;

        setIsSearching(true);
        try {
            const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
            const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json?access_token=${mapboxToken}&limit=1`);
            const data = await res.json();

            if (data.features && data.features.length > 0) {
                const [lng, lat] = data.features[0].center;

                // Fly to location
                map.current?.flyTo({
                    center: [lng, lat],
                    zoom: 14,
                    essential: true
                });

                // Update marker
                updateLocation(lng, lat);

                // Auto-fill address bits if possible
                const placeName = data.features[0].text;
                setFormData(prev => ({
                    ...prev,
                    location_name: prev.location_name || placeName
                }));

            } else {
                setError('Location not found');
            }
        } catch (err) {
            console.error(err);
            setError('Failed to search location');
        } finally {
            setIsSearching(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            // Validation
            if (!formData.latitude || !formData.longitude) {
                throw new Error('Please select a location on the map');
            }

            // Combine date and time
            const dateTime = new Date(`${formData.event_date}T${formData.event_time}:00`);

            const payload = {
                title: formData.title,
                description: formData.description || null,
                organizer: formData.organizer,
                location_name: formData.location_name,
                country: formData.country || null,
                latitude: formData.latitude,
                longitude: formData.longitude,
                event_date: dateTime.toISOString(),
                event_link: formData.event_link || null,
                image_url: formData.image_url || null,
                video_url: null // New rides rarely have video immediately
            };

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/events`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error('Failed to create event. Please check your inputs.');
            }

            setSuccessMessage('Ride submitted successfully! Waiting for admin approval.');

            // Wait a moment then close/refresh
            setTimeout(() => {
                onSuccess();
            }, 2000);

        } catch (err: any) {
            setError(err.message || 'Something went wrong');
            setIsSubmitting(false);
        }
    };

    if (successMessage) {
        return (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
                <div className="bg-[var(--color-surface)] p-8 rounded-2xl max-w-md w-full text-center border border-green-500/20">
                    <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Calendar className="w-8 h-8 text-green-500" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Submitted!</h3>
                    <p className="text-[var(--color-text-muted)]">{successMessage}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in safe-area-padding">
            <div
                className="bg-[var(--color-surface)] w-full max-w-5xl h-[85vh] md:max-h-[800px] rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row animate-slide-up border border-white/10"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close button (Mobile) */}
                <button
                    onClick={onClose}
                    className="md:hidden absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white"
                >
                    <X className="w-4 h-4" />
                </button>

                {/* Left Side - Form */}
                <div className="flex-1 p-6 overflow-y-auto w-full md:w-1/2 border-r border-white/5 order-2 md:order-1">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-[var(--color-text)]">Add New Ride</h2>
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-lg text-sm mb-4">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-[var(--color-text-muted)] uppercase mb-1">
                                Event Title *
                            </label>
                            <input
                                type="text"
                                name="title"
                                required
                                minLength={3}
                                value={formData.title}
                                onChange={handleChange}
                                placeholder="e.g. London DnB Ride"
                                className="w-full px-3 py-2 bg-[var(--color-background)] rounded-lg border border-white/10 text-[var(--color-text)] focus:border-[var(--color-primary)] outline-none transition-colors"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-[var(--color-text-muted)] uppercase mb-1">
                                    Organizer *
                                </label>
                                <input
                                    type="text"
                                    name="organizer"
                                    required
                                    value={formData.organizer}
                                    onChange={handleChange}
                                    placeholder="e.g. Dom Whiting"
                                    className="w-full px-3 py-2 bg-[var(--color-background)] rounded-lg border border-white/10 text-[var(--color-text)] focus:border-[var(--color-primary)] outline-none transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-[var(--color-text-muted)] uppercase mb-1">
                                    Date *
                                </label>
                                <input
                                    type="date"
                                    name="event_date"
                                    required
                                    value={formData.event_date}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 bg-[var(--color-background)] rounded-lg border border-white/10 text-[var(--color-text)] focus:border-[var(--color-primary)] outline-none transition-colors"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-[var(--color-text-muted)] uppercase mb-1">
                                    Start Time *
                                </label>
                                <input
                                    type="time"
                                    name="event_time"
                                    required
                                    value={formData.event_time}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 bg-[var(--color-background)] rounded-lg border border-white/10 text-[var(--color-text)] focus:border-[var(--color-primary)] outline-none transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-[var(--color-text-muted)] uppercase mb-1">
                                    City/Location *
                                </label>
                                <input
                                    type="text"
                                    name="location_name"
                                    required
                                    value={formData.location_name}
                                    onChange={handleChange}
                                    placeholder="e.g. Hyde Park"
                                    className="w-full px-3 py-2 bg-[var(--color-background)] rounded-lg border border-white/10 text-[var(--color-text)] focus:border-[var(--color-primary)] outline-none transition-colors"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-[var(--color-text-muted)] uppercase mb-1">
                                Country
                            </label>
                            <input
                                type="text"
                                name="country"
                                value={formData.country}
                                onChange={handleChange}
                                placeholder="e.g. UK"
                                className="w-full px-3 py-2 bg-[var(--color-background)] rounded-lg border border-white/10 text-[var(--color-text)] focus:border-[var(--color-primary)] outline-none transition-colors"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-[var(--color-text-muted)] uppercase mb-1">
                                    Latitude *
                                </label>
                                <input
                                    type="number"
                                    step="any"
                                    name="latitude"
                                    required
                                    readOnly
                                    value={formData.latitude || ''}
                                    className="w-full px-3 py-2 bg-[var(--color-surface-light)] rounded-lg border border-white/5 text-[var(--color-text-muted)] cursor-not-allowed"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-[var(--color-text-muted)] uppercase mb-1">
                                    Longitude *
                                </label>
                                <input
                                    type="number"
                                    step="any"
                                    name="longitude"
                                    required
                                    readOnly
                                    value={formData.longitude || ''}
                                    className="w-full px-3 py-2 bg-[var(--color-surface-light)] rounded-lg border border-white/5 text-[var(--color-text-muted)] cursor-not-allowed"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-[var(--color-text-muted)] uppercase mb-1">
                                Event Link (FB/RA)
                            </label>
                            <input
                                type="url"
                                name="event_link"
                                value={formData.event_link}
                                onChange={handleChange}
                                placeholder="https://facebook.com/events/..."
                                className="w-full px-3 py-2 bg-[var(--color-background)] rounded-lg border border-white/10 text-[var(--color-text)] focus:border-[var(--color-primary)] outline-none transition-colors"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-[var(--color-text-muted)] uppercase mb-1">
                                Image URL (Optional)
                            </label>
                            <input
                                type="url"
                                name="image_url"
                                value={formData.image_url}
                                onChange={handleChange}
                                placeholder="https://..."
                                className="w-full px-3 py-2 bg-[var(--color-background)] rounded-lg border border-white/10 text-[var(--color-text)] focus:border-[var(--color-primary)] outline-none transition-colors"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-[var(--color-text-muted)] uppercase mb-1">
                                Description
                            </label>
                            <textarea
                                name="description"
                                rows={3}
                                value={formData.description}
                                onChange={handleChange}
                                className="w-full px-3 py-2 bg-[var(--color-background)] rounded-lg border border-white/10 text-[var(--color-text)] focus:border-[var(--color-primary)] outline-none transition-colors resize-none"
                            />
                        </div>

                        <div className="pt-2 flex gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 py-3 bg-[var(--color-surface-light)] hover:bg-white/10 text-[var(--color-text)] rounded-lg font-medium transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex-1 py-3 btn-gradient text-white rounded-lg font-medium shadow-lg shadow-[var(--color-primary)]/25 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span>Submitting...</span>
                                    </>
                                ) : (
                                    <span>Submit Ride</span>
                                )}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Right Side - Map Picker */}
                <div className="w-full md:w-1/2 bg-[var(--color-background)] relative h-[250px] md:h-auto order-1 md:order-2">
                    <div
                        ref={mapContainer}
                        className="absolute inset-0 w-full h-full"
                    />

                    {/* Geocoding Search */}
                    <div className="absolute top-4 left-4 right-14 md:right-4 z-10 flex gap-2">
                        <form onSubmit={handleSearch} className="flex-1 relative shadow-lg">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search location (e.g. Berlin)"
                                className="w-full pl-9 pr-3 py-2 rounded-lg bg-black/70 backdrop-blur text-white border border-white/20 text-sm focus:border-[var(--color-primary)] outline-none"
                            />
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
                        </form>
                        <button
                            onClick={handleSearch}
                            disabled={isSearching}
                            className="px-3 py-2 bg-[var(--color-primary)] rounded-lg text-white font-medium text-sm disabled:opacity-50"
                        >
                            {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Go'}
                        </button>
                    </div>

                    <div className="absolute bottom-6 left-4 right-14 md:right-4 z-0 pointer-events-none">
                        <div className="bg-black/70 backdrop-blur rounded-lg p-2 text-xs text-white border border-white/10 inline-flex items-center gap-2">
                            <MapPin className="w-3 h-3 text-[var(--color-accent)]" /> <span>Tap map to pinpoint</span>
                        </div>
                    </div>

                    {/* Close button (Desktop) */}
                    <button
                        onClick={onClose}
                        className="hidden md:flex absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 items-center justify-center text-white transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
