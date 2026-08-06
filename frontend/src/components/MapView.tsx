import { useEffect, useRef } from 'react';
import * as maplibregl from 'maplibre-gl';
import type { GeoJSONSource, Map as MapLibreMap, StyleSpecification } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useAppStore, type LayerKey } from '../store';
import type { Feature, FeatureCollection } from 'geojson';

const CLUSTER_COLORS = [
  '#4caf50',
  '#2196f3',
  '#ff9800',
  '#e91e63',
  '#9c27b0',
  '#00bcd4',
  '#8bc34a',
  '#ff5722',
  '#3f51b5',
  '#cddc39',
  '#795548',
  '#009688',
  '#f44336',
  '#607d8b',
  '#ffc107',
  '#673ab7',
  '#03a9f4',
  '#c2185b',
  '#558b2f',
  '#6d4c41',
];

const STYLE: StyleSpecification = {
  version: 8,
  sources: {
    esri: {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 256,
      attribution: 'Esri, Maxar, Earthstar Geographics',
    },
    labels: {
      type: 'raster',
      tiles: [
        'https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 256,
      attribution: 'Esri',
    },
  },
  layers: [
    { id: 'esri', type: 'raster', source: 'esri' },
    { id: 'labels', type: 'raster', source: 'labels' },
  ],
};

function ensureSource(map: MapLibreMap, id: string, data: FeatureCollection) {
  const src = map.getSource(id) as GeoJSONSource | undefined;
  if (src) src.setData(data);
  else map.addSource(id, { type: 'geojson', data });
}

function setVis(map: MapLibreMap, layerId: string, visible: boolean) {
  if (!map.getLayer(layerId)) return;
  map.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none');
}

export function MapView() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const lotFeature = useAppStore((s) => s.lotFeature);
  const geojson = useAppStore((s) => s.geojson);
  const layers = useAppStore((s) => s.layers);
  const idwOverlay = useAppStore((s) => s.idwOverlay);
  const zonesOverlay = useAppStore((s) => s.zonesOverlay);
  const selectedLot = useAppStore((s) => s.selectedLot);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: STYLE,
      center: [-62.3, -33.1],
      zoom: 7,
      attributionControl: {},
    });
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: false }), 'top-right');
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !lotFeature) return;
    const fc: FeatureCollection = { type: 'FeatureCollection', features: [lotFeature as Feature] };
    const apply = () => {
      ensureSource(map, 'lot', fc);
      if (!map.getLayer('lot-fill')) {
        map.addLayer({
          id: 'lot-fill',
          type: 'fill',
          source: 'lot',
          paint: { 'fill-color': '#76ff03', 'fill-opacity': 0.15 },
        });
        map.addLayer({
          id: 'lot-line',
          type: 'line',
          source: 'lot',
          paint: { 'line-color': '#c6ff00', 'line-width': 2.5 },
        });
      }
      const b = selectedLot?.bbox;
      if (b && b.length === 4) {
        map.fitBounds(
          [
            [b[0], b[1]],
            [b[2], b[3]],
          ],
          { padding: 48, duration: 800 },
        );
      }
    };
    if (map.isStyleLoaded()) apply();
    else map.once('load', apply);
  }, [lotFeature, selectedLot]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const apply = () => {
      const grid = geojson.grid;
      if (grid) {
        ensureSource(map, 'grid', grid as FeatureCollection);
        const g0 = grid.features[0]?.geometry.type;
        if (!map.getLayer('grid-line') && g0 === 'LineString') {
          map.addLayer({
            id: 'grid-line',
            type: 'line',
            source: 'grid',
            paint: { 'line-color': '#ffffff', 'line-opacity': 0.35, 'line-width': 0.8 },
          });
        } else if (!map.getLayer('grid-pts') && g0 === 'Point') {
          map.addLayer({
            id: 'grid-pts',
            type: 'circle',
            source: 'grid',
            paint: {
              'circle-radius': 1.6,
              'circle-color': '#ffffff',
              'circle-opacity': 0.45,
            },
          });
        }
      }

      if (geojson.clusters) {
        ensureSource(map, 'clusters', geojson.clusters as FeatureCollection);
        if (!map.getLayer('clusters-fill')) {
          const matchExpr: unknown[] = ['match', ['%', ['get', 'cluster'], 20]];
          CLUSTER_COLORS.forEach((c, i) => {
            matchExpr.push(i, c);
          });
          matchExpr.push('#888888');
          map.addLayer({
            id: 'clusters-fill',
            type: 'fill',
            source: 'clusters',
            paint: {
              'fill-color': matchExpr as never,
              'fill-opacity': 0.35,
            },
          });
          map.addLayer({
            id: 'clusters-line',
            type: 'line',
            source: 'clusters',
            paint: { 'line-color': '#ffffff', 'line-width': 1 },
          });
        }
      }

      if (geojson.centroids) {
        ensureSource(map, 'centroids', geojson.centroids as FeatureCollection);
        if (!map.getLayer('centroids-circle')) {
          map.addLayer({
            id: 'centroids-circle',
            type: 'circle',
            source: 'centroids',
            paint: {
              'circle-radius': 8,
              'circle-color': [
                'case',
                ['has', 'damage'],
                [
                  'interpolate',
                  ['linear'],
                  ['get', 'damage'],
                  0,
                  '#228B22',
                  50,
                  '#FFD700',
                  100,
                  '#B22222',
                ],
                '#00e5ff',
              ],
              'circle-stroke-width': 2,
              'circle-stroke-color': '#ffffff',
            },
          });
          map.addLayer({
            id: 'centroids-label',
            type: 'symbol',
            source: 'centroids',
            layout: {
              'text-field': ['coalesce', ['get', 'label'], ['to-string', ['+', ['get', 'id'], 1]]],
              'text-size': 11,
              'text-offset': [0, 1.4],
            },
            paint: { 'text-color': '#ffffff', 'text-halo-color': '#000', 'text-halo-width': 1 },
          });
        }
      }

      if (geojson.samples) {
        ensureSource(map, 'samples', geojson.samples as FeatureCollection);
        if (!map.getLayer('samples-circle')) {
          map.addLayer({
            id: 'samples-circle',
            type: 'circle',
            source: 'samples',
            paint: {
              'circle-radius': 6,
              'circle-color': [
                'interpolate',
                ['linear'],
                ['get', 'damage'],
                0,
                '#228B22',
                50,
                '#FFD700',
                100,
                '#B22222',
              ],
              'circle-stroke-width': 1.5,
              'circle-stroke-color': '#111',
            },
          });
        }
      }

      const setRaster = (
        id: string,
        overlay: { url: string; bounds: [number, number, number, number] } | null,
      ) => {
        if (!overlay) return;
        const [west, south, east, north] = overlay.bounds;
        if (map.getLayer(`${id}-layer`)) map.removeLayer(`${id}-layer`);
        if (map.getSource(id)) map.removeSource(id);
        map.addSource(id, {
          type: 'image',
          url: overlay.url,
          coordinates: [
            [west, north],
            [east, north],
            [east, south],
            [west, south],
          ],
        });
        map.addLayer({
          id: `${id}-layer`,
          type: 'raster',
          source: id,
          paint: { 'raster-opacity': 0.75 },
        });
      };
      if (idwOverlay) setRaster('idw', idwOverlay);
      if (zonesOverlay) setRaster('zones', zonesOverlay);
    };
    if (map.isStyleLoaded()) apply();
    else map.once('load', apply);
  }, [geojson, idwOverlay, zonesOverlay]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    const vis: Record<string, LayerKey> = {
      'lot-fill': 'lot',
      'lot-line': 'lot',
      'grid-line': 'grid',
      'grid-pts': 'grid',
      'clusters-fill': 'clusters',
      'clusters-line': 'clusters',
      'centroids-circle': 'centroids',
      'centroids-label': 'centroids',
      'samples-circle': 'samples',
      'idw-layer': 'idw',
      'zones-layer': 'zones',
    };
    Object.entries(vis).forEach(([layerId, key]) => {
      setVis(map, layerId, !!layers[key]);
    });
  }, [layers, geojson, idwOverlay, zonesOverlay]);

  return <div ref={containerRef} className="h-full w-full rounded-xl overflow-hidden shadow-2xl" />;
}
