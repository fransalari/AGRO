import { useEffect, useRef } from 'react';
import {
  Map as MapLibreMap,
  NavigationControl,
  setWorkerUrl,
  type GeoJSONSource,
  type StyleSpecification,
} from 'maplibre-gl';
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import { bbox, centroid } from '@turf/turf';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useAppStore, type LayerKey } from '../store';
import type { Feature, FeatureCollection, Geometry } from 'geojson';

// MapLibre v6 + Vite: worker must go through Vite's worker pipeline (?worker&url).
setWorkerUrl(maplibreWorkerUrl);

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
  // Explicit mercator: globe projection can hide flat fills unexpectedly.
  projection: { type: 'mercator' },
  sources: {
    esri: {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 256,
      attribution: 'Esri, Maxar, Earthstar Geographics',
      maxzoom: 19,
    },
    labels: {
      type: 'raster',
      tiles: [
        'https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 256,
      attribution: 'Esri',
      maxzoom: 19,
    },
  },
  layers: [
    {
      id: 'background',
      type: 'background',
      paint: { 'background-color': '#0b1a12' },
    },
    { id: 'esri', type: 'raster', source: 'esri' },
    { id: 'labels', type: 'raster', source: 'labels' },
  ],
};

function cloneGeometry(geometry: Geometry): Geometry {
  return JSON.parse(JSON.stringify(geometry)) as Geometry;
}

function lotCollection(feature: Feature): FeatureCollection {
  // Strip exotic properties / feature.id that can break MapLibre parsing.
  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: { role: 'lot' },
        geometry: cloneGeometry(feature.geometry as Geometry),
      },
    ],
  };
}

function ensureSource(map: MapLibreMap, id: string, data: FeatureCollection) {
  const src = map.getSource(id) as GeoJSONSource | undefined;
  if (src) src.setData(data);
  else map.addSource(id, { type: 'geojson', data, tolerance: 0 });
}

function setVis(map: MapLibreMap, layerId: string, visible: boolean) {
  if (!map.getLayer(layerId)) return;
  map.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none');
}

function bringToFront(map: MapLibreMap, layerId: string) {
  if (map.getLayer(layerId)) map.moveLayer(layerId);
}

function whenStyleReady(map: MapLibreMap, fn: () => void) {
  let done = false;
  const run = () => {
    if (done) return;
    if (!map.isStyleLoaded()) return;
    done = true;
    fn();
  };
  if (map.isStyleLoaded()) {
    run();
    return;
  }
  map.once('load', run);
}

function boundsFromFeature(feature: Feature): [[number, number], [number, number]] | null {
  try {
    const [minX, minY, maxX, maxY] = bbox(feature);
    if (![minX, minY, maxX, maxY].every(Number.isFinite)) return null;
    if (minX === maxX || minY === maxY) {
      const pad = 0.01;
      return [
        [minX - pad, minY - pad],
        [maxX + pad, maxY + pad],
      ];
    }
    return [
      [minX, minY],
      [maxX, maxY],
    ];
  } catch {
    return null;
  }
}

function ensureLotLayers(map: MapLibreMap) {
  if (!map.getLayer('lot-fill')) {
    map.addLayer({
      id: 'lot-fill',
      type: 'fill',
      source: 'lot',
      paint: {
        'fill-color': '#ffea00',
        'fill-opacity': 0.45,
        'fill-outline-color': '#ff3d00',
      },
    });
  }
  if (!map.getLayer('lot-outline')) {
    map.addLayer({
      id: 'lot-outline',
      type: 'line',
      source: 'lot',
      paint: {
        'line-color': '#ff3d00',
        'line-width': 4,
        'line-opacity': 1,
      },
      layout: {
        'line-join': 'round',
        'line-cap': 'round',
      },
    });
  }
  if (!map.getLayer('lot-centroid')) {
    map.addLayer({
      id: 'lot-centroid',
      type: 'circle',
      source: 'lot-center',
      paint: {
        'circle-radius': 7,
        'circle-color': '#ff3d00',
        'circle-stroke-width': 2,
        'circle-stroke-color': '#ffffff',
      },
    });
  }
  bringToFront(map, 'lot-fill');
  bringToFront(map, 'lot-outline');
  bringToFront(map, 'lot-centroid');
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
    const map = new MapLibreMap({
      container: containerRef.current,
      style: STYLE,
      center: [-62.3, -33.1],
      zoom: 7,
      attributionControl: {},
      // Keep 2D mercator for reliable polygon fills over imagery.
    });
    map.addControl(new NavigationControl({ visualizePitch: false }), 'top-right');
    mapRef.current = map;

    const onResize = () => map.resize();
    window.addEventListener('resize', onResize);
    requestAnimationFrame(() => map.resize());

    return () => {
      window.removeEventListener('resize', onResize);
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !lotFeature?.geometry) return;

    const applyLot = () => {
      map.resize();
      const fc = lotCollection(lotFeature);
      ensureSource(map, 'lot', fc);

      const centerFt = centroid(lotFeature);
      ensureSource(map, 'lot-center', {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: {},
            geometry: centerFt.geometry,
          },
        ],
      });

      ensureLotLayers(map);

      const show = layers.lot !== false;
      setVis(map, 'lot-fill', show);
      setVis(map, 'lot-outline', show);
      setVis(map, 'lot-centroid', show);

      const fromGeom = boundsFromFeature(lotFeature);
      const b = selectedLot?.bbox;
      const bounds =
        fromGeom ??
        (b && b.length === 4
          ? ([[b[0], b[1]], [b[2], b[3]]] as [[number, number], [number, number]])
          : null);

      if (bounds) {
        map.fitBounds(bounds, { padding: 64, duration: 700, maxZoom: 16 });
      }
      map.triggerRepaint();
    };

    whenStyleReady(map, applyLot);
  }, [lotFeature, selectedLot, layers.lot]);

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

      // Keep lot vector layers above any overlays that may have been re-added.
      bringToFront(map, 'lot-fill');
      bringToFront(map, 'lot-outline');
      bringToFront(map, 'lot-centroid');
    };
    whenStyleReady(map, apply);
  }, [geojson, idwOverlay, zonesOverlay]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    whenStyleReady(map, () => {
      const vis: Record<string, LayerKey | 'lot'> = {
        'lot-fill': 'lot',
        'lot-outline': 'lot',
        'lot-centroid': 'lot',
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
        setVis(map, layerId, !!layers[key as LayerKey]);
      });
    });
  }, [layers, geojson, idwOverlay, zonesOverlay, lotFeature]);

  return (
    <div ref={containerRef} className="h-full w-full min-h-[360px] rounded-xl overflow-hidden shadow-2xl" />
  );
}
