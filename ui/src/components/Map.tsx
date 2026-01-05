'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Event } from '@/types';
import { AURORA_MAP_STYLE, applyAuroraStyle } from '@/lib/mapbox-aurora-style';

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

    useEffect(() => {
        onEventSelectRef.current = onEventSelect;
    }, [onEventSelect]);

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
            style: AURORA_MAP_STYLE,
            center: [10.4515, 51.1657],
            zoom: 5,
            pitch: 0,
            bearing: 0,
            antialias: true
        });

        map.current.addControl(new mapboxgl.NavigationControl(), 'bottom-right');

        map.current.on('load', () => {
            if (!map.current) return;

            applyAuroraStyle(map.current);

            map.current.addSource('events-source', {
                type: 'geojson',
                data: {
                    type: 'FeatureCollection',
                    features: []
                },
                cluster: true,
                clusterMaxZoom: 14,
                clusterRadius: 50
            });

            map.current.addLayer({
                id: 'clusters',
                type: 'circle',
                source: 'events-source',
                filter: ['has', 'point_count'],
                paint: {
                    'circle-color': [
                        'step',
                        ['get', 'point_count'],
                        '#50C878',
                        5,
                        '#FF6B6B',
                        15,
                        '#9D4EDD'
                    ],
                    'circle-radius': [
                        'step',
                        ['get', 'point_count'],
                        22,
                        5,
                        32,
                        15,
                        42
                    ],
                    'circle-stroke-width': 3,
                    'circle-stroke-color': 'rgba(255, 255, 255, 0.3)',
                    'circle-opacity': 0.9,
                    'circle-blur': 0.15
                }
            });

            map.current.addLayer({
                id: 'cluster-count',
                type: 'symbol',
                source: 'events-source',
                filter: ['has', 'point_count'],
                layout: {
                    'text-field': '{point_count_abbreviated}',
                    'text-font': ['DIN Pro Medium', 'Arial Unicode MS Bold'],
                    'text-size': 13
                },
                paint: {
                    'text-color': '#ffffff'
                }
            });

            map.current.addLayer({
                id: 'unclustered-point',
                type: 'circle',
                source: 'events-source',
                filter: ['!', ['has', 'point_count']],
                paint: {
                    'circle-color': [
                        'case',
                        ['boolean', ['feature-state', 'selected'], false],
                        '#FF6B6B',
                        '#50C878'
                    ],
                    'circle-radius': [
                        'case',
                        ['boolean', ['feature-state', 'selected'], false],
                        12,
                        8
                    ],
                    'circle-stroke-width': 3,
                    'circle-stroke-color': 'rgba(255, 255, 255, 0.8)',
                    'circle-blur': 0.1
                }
            });

            map.current.addLayer({
                id: 'unclustered-point-glow',
                type: 'circle',
                source: 'events-source',
                filter: ['!', ['has', 'point_count']],
                paint: {
                    'circle-color': [
                        'case',
                        ['boolean', ['feature-state', 'selected'], false],
                        '#FF6B6B',
                        '#50C878'
                    ],
                    'circle-radius': [
                        'case',
                        ['boolean', ['feature-state', 'selected'], false],
                        24,
                        14
                    ],
                    'circle-opacity': 0.25,
                    'circle-blur': 1
                }
            }, 'unclustered-point');

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
                            center: (features[0].geometry as GeoJSON.Point).coordinates as [number, number],
                            zoom: zoom ?? undefined
                        });
                    }
                );
            });

            map.current.on('click', 'unclustered-point', (e) => {
                if (!e.features || e.features.length === 0) return;

                const feature = e.features[0];
                const eventData = JSON.parse(feature.properties?.eventData || '{}');

                map.current?.flyTo({
                    center: (feature.geometry as GeoJSON.Point).coordinates as [number, number],
                    zoom: 14,
                    speed: 1.5
                });

                onEventSelectRef.current(eventData);
            });

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

    useEffect(() => {
        if (!map.current || !isLoaded) return;

        const source = map.current.getSource('events-source') as mapboxgl.GeoJSONSource;
        if (!source) return;

        const geojson: GeoJSON.FeatureCollection = {
            type: 'FeatureCollection',
            features: events.map(e => ({
                type: 'Feature',
                id: e.id,
                properties: {
                    id: e.id,
                    eventData: JSON.stringify(e)
                },
                geometry: {
                    type: 'Point',
                    coordinates: [e.longitude, e.latitude]
                }
            }))
        };

        source.setData(geojson);

        if (!initialFitDoneRef.current && events.length > 0) {
            const bounds = new mapboxgl.LngLatBounds();
            events.forEach(event => {
                bounds.extend([event.longitude, event.latitude]);
            });
            map.current.fitBounds(bounds, { padding: 60, maxZoom: 12 });
            initialFitDoneRef.current = true;
        }
    }, [events, isLoaded]);

    useEffect(() => {
        if (!map.current || !isLoaded) return;

        events.forEach(e => {
            map.current?.setFeatureState(
                { source: 'events-source', id: e.id },
                { selected: e.id === selectedEventId }
            );
        });

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

    useEffect(() => {
        if (!map.current || !isLoaded || !userLocation) return;

        if (userMarkerRef.current) {
            userMarkerRef.current.remove();
        }

        const el = document.createElement('div');
        el.className = 'marker-dot';

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
