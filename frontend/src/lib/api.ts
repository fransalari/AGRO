import type { Feature, FeatureCollection } from 'geojson';

export const API_BASE = import.meta.env.VITE_API_BASE ?? '';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    ...init,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  return res.json() as Promise<T>;
}

export type LotSummary = {
  lot_id: string;
  name: string;
  farm_name?: string;
  crop_name?: string;
  area_ha: number;
  sample_count: number;
  bbox?: number[];
  campaign?: string;
  min_samples_rule?: number;
};

export type SessionState = {
  session_id: string;
  lot_id: string;
  mode: string;
  grid_res_m: number;
  area_ha: number;
  k: number;
  status: string;
  steps_done: string[];
  meta: Record<string, unknown>;
};

export type CompareResult = {
  traditional_mean: number;
  directed_mean: number;
  abs_diff: number;
  pct_diff: number;
  n_samples: number;
  k: number;
  area_ha: number;
  grid_res_m: number;
  sample_stats?: Record<string, number>;
  idw_stats?: Record<string, number>;
  idw_png_url?: string;
  zones_png_url?: string;
  samples_url?: string;
  centroids_url?: string;
  lot_url?: string;
  bounds?: number[];
};

export const api = {
  health: () => request<{ ok: boolean; index_ready: boolean }>('/api/health'),
  rebuildIndex: () => request<Record<string, unknown>>('/api/index/rebuild', { method: 'POST' }),
  listLots: (q?: string) =>
    request<{ count: number; lots: LotSummary[] }>(`/api/lots${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  getLot: (id: string) =>
    request<{ summary: LotSummary; feature: Feature }>(`/api/lots/${id}`),
  createSession: (body: { lot_id: string; mode: string; grid_res_m: number }) =>
    request<SessionState>('/api/sessions', { method: 'POST', body: JSON.stringify(body) }),
  getSession: (id: string) => request<SessionState>(`/api/sessions/${id}`),
  grid: (id: string) => request<Record<string, unknown>>(`/api/sessions/${id}/grid`, { method: 'POST' }),
  kmeans: (id: string) => request<Record<string, unknown>>(`/api/sessions/${id}/kmeans`, { method: 'POST' }),
  samples: (id: string) => request<Record<string, unknown>>(`/api/sessions/${id}/samples`, { method: 'POST' }),
  assign: (id: string) => request<Record<string, unknown>>(`/api/sessions/${id}/assign`, { method: 'POST' }),
  idw: (id: string, body: { power: number; scale_mode: string; symbology: string }) =>
    request<Record<string, unknown>>(`/api/sessions/${id}/idw`, { method: 'POST', body: JSON.stringify(body) }),
  zones: (id: string, body: { scale_mode: string; symbology: string }) =>
    request<Record<string, unknown>>(`/api/sessions/${id}/zones`, { method: 'POST', body: JSON.stringify(body) }),
  compare: (id: string) => request<CompareResult>(`/api/sessions/${id}/compare`),
  run: (id: string) => request<Record<string, unknown>>(`/api/sessions/${id}/run`, { method: 'POST' }),
  artifactUrl: (sessionId: string, name: string) => `${API_BASE}/api/sessions/${sessionId}/artifacts/${name}`,
};

export type { FeatureCollection };
