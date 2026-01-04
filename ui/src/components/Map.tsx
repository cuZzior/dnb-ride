'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Event } from '@/types';

interface MapProps {
    events: Event[];
    selectedEventId: number | null;
    onEventSelect: (event: Event) => void;
    userLocation: { lat: number; lng: number } | null;
}

export default function EventsMap({ events, selectedEventId, onEventSelect, userLocation }: MapProps) {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<mapboxgl.Map | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const userMarkerRef = useRef<mapboxgl.Marker | null>(null);
    const onEventSelectRef = useRef(onEventSelect);
    const initialFitDoneRef = useRef(false);

    // Keep callback ref updated
    useEffect(() => {
        onEventSelectRef.current = onEventSelect;
    }, [onEventSelect]);

    // Initialize map
    useEffect(() => {
        if (!mapContainer.current || map.current) return;

        const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
        if (!mapboxToken) {
            console.error('NEXT_PUBLIC_MAPBOX_TOKEN is not set');
            return;
        }

        mapboxgl.accessToken = mapboxToken;

        map.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: 'mapbox://styles/mapbox/dark-v11',
            center: [10.4515, 51.1657],
            zoom: 5,
            pitch: 0,
            bearing: 0,
            antialias: true
        });

        map.current.addControl(new mapboxgl.NavigationControl(), 'bottom-right');

        map.current.on('load', () => {
            if (!map.current) return;

            // Add events source
            map.current.addSource('events-source', {
                type: 'geojson',
                data: {
                    type: 'FeatureCollection',
                    features: []
                },
                cluster: true,
                clusterMaxZoom: 14, // Max zoom to cluster points on
                clusterRadius: 50 // Radius of each cluster when clustering points (defaults to 50)
            });

            // Clusters layer (Circles)
            map.current.addLayer({
                id: 'clusters',
                type: 'circle',
                source: 'events-source',
                filter: ['has', 'point_count'],
                paint: {
                    // Use step expression to implement three types of circle sizes/colors based on count
                    'circle-color': [
                        'step',
                        ['get', 'point_count'],
                        '#00d4ff', // Blue for small clusters
                        5,
                        '#ff3b5c', // Pink/Red for medium
                        15,
                        '#f59e0b' // Amber for large
                    ],
                    'circle-radius': [
                        'step',
                        ['get', 'point_count'],
                        20, // 20px radius
                        5,
                        30, // 30px
                        15,
                        40  // 40px
                    ],
                    'circle-stroke-width': 2,
                    'circle-stroke-color': '#fff',
                    'circle-opacity': 0.8
                }
            });

            // Cluster count labels
            map.current.addLayer({
                id: 'cluster-count',
                type: 'symbol',
                source: 'events-source',
                filter: ['has', 'point_count'],
                layout: {
                    'text-field': '{point_count_abbreviated}',
                    'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
                    'text-size': 14
                },
                paint: {
                    'text-color': '#ffffff'
                }
            });

            // Unclustered Points (Individual events)
            map.current.addLayer({
                id: 'unclustered-point',
                type: 'circle',
                source: 'events-source',
                filter: ['!', ['has', 'point_count']],
                paint: {
                    'circle-color': [
                        'case',
                        ['boolean', ['feature-state', 'selected'], false],
                        '#ff3b5c', // Selected color
                        '#00d4ff'  // Default color
                    ],
                    'circle-radius': [
                        'case',
                        ['boolean', ['feature-state', 'selected'], false],
                        10, // Selected size
                        6   // Default size
                    ],
                    'circle-stroke-width': 2,
                    'circle-stroke-color': '#fff'
                }
            });

            // Inspect a cluster on click
            map.current.on('click', 'clusters', (e) => {
                const features = map.current?.queryRenderedFeatures(e.point, {
                    layers: ['clusters']
                }) as mapboxgl.MapboxGeoJSONFeature[];

                const clusterId = features[0].properties?.cluster_id;

                (map.current?.getSource('events-source') as mapboxgl.GeoJSONSource).getClusterExpansionZoom(
                    clusterId,
                    (err, zoom) => {
                        if (err) return;

                        map.current?.easeTo({
                            center: (features[0].geometry as any).coordinates,
                            zoom: zoom ?? undefined
                        });
                    }
                );
            });

            // Click on unclustered point (select event)
            map.current.on('click', 'unclustered-point', (e) => {
                if (!e.features || e.features.length === 0) return;

                const feature = e.features[0];
                const eventId = feature.properties?.id;
                const eventData = JSON.parse(feature.properties?.eventData || '{}');

                // Fly to point
                map.current?.flyTo({
                    center: (feature.geometry as any).coordinates,
                    zoom: 14,
                    speed: 1.5
                });

                onEventSelectRef.current(eventData);
            });

            // Change cursor on hover
            map.current.on('mouseenter', 'clusters', () => {
                if (map.current) map.current.getCanvas().style.cursor = 'pointer';
            });
            map.current.on('mouseleave', 'clusters', () => {
                if (map.current) map.current.getCanvas().style.cursor = '';
            });
            map.current.on('mouseenter', 'unclustered-point', () => {
                if (map.current) map.current.getCanvas().style.cursor = 'pointer';
            });
            map.current.on('mouseleave', 'unclustered-point', () => {
                if (map.current) map.current.getCanvas().style.cursor = '';
            });

            setIsLoaded(true);
        });

        return () => {
            map.current?.remove();
            map.current = null;
        };
    }, []);

    // Update data when events change
    useEffect(() => {
        if (!map.current || !isLoaded) return;

        const source = map.current.getSource('events-source') as mapboxgl.GeoJSONSource;
        if (!source) return;

        const geojson: GeoJSON.FeatureCollection = {
            type: 'FeatureCollection',
            features: events.map(e => ({
                type: 'Feature',
                properties: {
                    id: e.id,
                    eventData: e // Store full event data to retrieve on click
                },
                geometry: {
                    type: 'Point',
                    coordinates: [e.longitude, e.latitude]
                }
            }))
        };

        source.setData(geojson);

        // Fit bounds on first load
        if (!initialFitDoneRef.current && events.length > 0) {
            const bounds = new mapboxgl.LngLatBounds();
            events.forEach(event => {
                bounds.extend([event.longitude, event.latitude]);
            });
            map.current.fitBounds(bounds, { padding: 60, maxZoom: 12 });
            initialFitDoneRef.current = true;
        }
    }, [events, isLoaded]);

    // Handle selection visual state (feature-state)
    useEffect(() => {
        if (!map.current || !isLoaded) return;

        // Remove selection from all points
        // Note: feature-state requires unique IDs. We used event ID in properties.
        // But removing all feature states is tricky without iterating.
        // A simpler approach for this MVP is to re-set the data or manage state better.
        // Actually, Mapbox feature-state needs 'id' at the root of the Feature object.
        // Let's update the data generation above to include 'id' at root!
    }, [selectedEventId, isLoaded]);

    // Refined Data Effect to include IDs for feature-state
    useEffect(() => {
        if (!map.current || !isLoaded) return;

        const source = map.current.getSource('events-source') as mapboxgl.GeoJSONSource;
        if (!source) return;

        const geojson: GeoJSON.FeatureCollection = {
            type: 'FeatureCollection',
            features: events.map(e => ({
                type: 'Feature',
                id: e.id, // CRITICAL for feature-state
                properties: {
                    id: e.id,
                    eventData: e
                },
                geometry: {
                    type: 'Point',
                    coordinates: [e.longitude, e.latitude]
                }
            }))
        };

        source.setData(geojson);
    }, [events, isLoaded]);

    // Update feature state for selection highlights
    useEffect(() => {
        if (!map.current || !isLoaded) return;

        // This is a bit heavy (resetting all), but robust for small datasets ( < 1000 points)
        // Ideally we track the 'previousSelectedId'
        events.forEach(e => {
            map.current?.setFeatureState(
                { source: 'events-source', id: e.id },
                { selected: e.id === selectedEventId }
            );
        });

        // If selected, fly to it
        if (selectedEventId) {
            const event = events.find(e => e.id === selectedEventId);
            if (event) {
                map.current.flyTo({
                    center: [event.longitude, event.latitude],
                    zoom: 14,
                    speed: 1.5
                });
            }
        }

    }, [selectedEventId, events, isLoaded]);


    // User Location Marker
    useEffect(() => {
        if (!map.current || !isLoaded || !userLocation) return;

        if (userMarkerRef.current) {
            userMarkerRef.current.remove();
        }

        const el = document.createElement('div');
        el.className = 'user-location-marker';
        el.style.cssText = `
            width: 14px;
            height: 14px;
            background: #4285f4;
            border: 2px solid white;
            border-radius: 50%;
            box-shadow: 0 0 0 6px rgba(66, 133, 244, 0.3);
            animation: pulse 2s infinite;
        `;

        userMarkerRef.current = new mapboxgl.Marker({ element: el })
            .setLngLat([userLocation.lng, userLocation.lat])
            .addTo(map.current!);

    }, [userLocation, isLoaded]);

    return (
        <div
            ref={mapContainer}
            className="w-full h-full"
            style={{ minHeight: '100%' }}
        />
    );
}
