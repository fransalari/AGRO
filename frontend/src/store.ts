import { create } from 'zustand';
import type { Feature, FeatureCollection } from 'geojson';
import type { CompareResult, LotSummary, SessionState } from './lib/api';

export type AppMode = 'learning' | 'production';

export type LayerKey = 'lot' | 'grid' | 'clusters' | 'centroids' | 'samples' | 'idw' | 'zones';

export type WizardStep = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

type Overlay = {
  url: string;
  bounds: [number, number, number, number];
} | null;

type AppState = {
  mode: AppMode;
  step: WizardStep;
  lots: LotSummary[];
  selectedLot: LotSummary | null;
  lotFeature: Feature | null;
  session: SessionState | null;
  loading: boolean;
  error: string | null;
  layers: Record<LayerKey, boolean>;
  geojson: Partial<Record<LayerKey, FeatureCollection | null>>;
  idwOverlay: Overlay;
  zonesOverlay: Overlay;
  stepData: Record<string, unknown>;
  compare: CompareResult | null;
  idwParams: { power: number; scale_mode: 'fixed' | 'adaptive'; symbology: 'continuous' | 'discrete' };
  zoneParams: { scale_mode: 'fixed' | 'adaptive'; symbology: 'continuous' | 'discrete' };
  gridResM: number;
  setMode: (m: AppMode) => void;
  setStep: (s: WizardStep) => void;
  setLots: (lots: LotSummary[]) => void;
  setSelectedLot: (lot: LotSummary | null, feature?: Feature | null) => void;
  setSession: (s: SessionState | null) => void;
  setLoading: (v: boolean) => void;
  setError: (e: string | null) => void;
  toggleLayer: (k: LayerKey) => void;
  setLayers: (partial: Partial<Record<LayerKey, boolean>>) => void;
  setGeojson: (k: LayerKey, fc: FeatureCollection | null) => void;
  setIdwOverlay: (o: Overlay) => void;
  setZonesOverlay: (o: Overlay) => void;
  setStepData: (key: string, data: unknown) => void;
  setCompare: (c: CompareResult | null) => void;
  setIdwParams: (p: Partial<AppState['idwParams']>) => void;
  setZoneParams: (p: Partial<AppState['zoneParams']>) => void;
  setGridResM: (n: number) => void;
};

const defaultLayers: Record<LayerKey, boolean> = {
  lot: true,
  grid: false,
  clusters: false,
  centroids: false,
  samples: false,
  idw: false,
  zones: false,
};

export const useAppStore = create<AppState>((set) => ({
  mode: 'learning',
  step: 1,
  lots: [],
  selectedLot: null,
  lotFeature: null,
  session: null,
  loading: false,
  error: null,
  layers: { ...defaultLayers },
  geojson: {},
  idwOverlay: null,
  zonesOverlay: null,
  stepData: {},
  compare: null,
  idwParams: { power: 2, scale_mode: 'fixed', symbology: 'continuous' },
  zoneParams: { scale_mode: 'fixed', symbology: 'discrete' },
  gridResM: 10,
  setMode: (mode) => set({ mode }),
  setStep: (step) => set({ step }),
  setLots: (lots) => set({ lots }),
  setSelectedLot: (selectedLot, feature = null) =>
    set({ selectedLot, lotFeature: feature ?? null }),
  setSession: (session) => set({ session }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  toggleLayer: (k) => set((s) => ({ layers: { ...s.layers, [k]: !s.layers[k] } })),
  setLayers: (partial) => set((s) => ({ layers: { ...s.layers, ...partial } })),
  setGeojson: (k, fc) => set((s) => ({ geojson: { ...s.geojson, [k]: fc } })),
  setIdwOverlay: (idwOverlay) => set({ idwOverlay }),
  setZonesOverlay: (zonesOverlay) => set({ zonesOverlay }),
  setStepData: (key, data) => set((s) => ({ stepData: { ...s.stepData, [key]: data } })),
  setCompare: (compare) => set({ compare }),
  setIdwParams: (p) => set((s) => ({ idwParams: { ...s.idwParams, ...p } })),
  setZoneParams: (p) => set((s) => ({ zoneParams: { ...s.zoneParams, ...p } })),
  setGridResM: (gridResM) => set({ gridResM }),
}));
