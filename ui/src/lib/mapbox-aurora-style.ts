import type mapboxgl from 'mapbox-gl';

export const AURORA_COLORS = {
  background: '#0A1929',
  water: '#071422',
  land: '#0d1f35',
  park: '#0f2a1f',
  building: '#0d1f35',
  road: '#152d4a',
  text: '#6b8ab0',
  coral: '#FF6B6B',
  emerald: '#50C878',
  purple: '#9D4EDD',
};

export const AURORA_MAP_STYLE = 'mapbox://styles/mapbox/dark-v11';

export function applyAuroraStyle(map: mapboxgl.Map): void {
  if (!map.isStyleLoaded()) {
    map.once('style.load', () => applyAuroraStyle(map));
    return;
  }

  if (map.getLayer('background')) {
    map.setPaintProperty('background', 'background-color', AURORA_COLORS.background);
  }

  if (map.getLayer('water')) {
    map.setPaintProperty('water', 'fill-color', AURORA_COLORS.water);
  }

  if (map.getLayer('land')) {
    map.setPaintProperty('land', 'background-color', AURORA_COLORS.land);
  }
}
