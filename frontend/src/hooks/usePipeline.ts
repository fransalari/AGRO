import { api } from '../lib/api';
import { useAppStore } from '../store';

async function fetchJson(url: string) {
  const res = await fetch(url);
  return res.json();
}

export function usePipelineActions() {
  const session = useAppStore((s) => s.session);
  const setLoading = useAppStore((s) => s.setLoading);
  const setError = useAppStore((s) => s.setError);
  const setStepData = useAppStore((s) => s.setStepData);
  const setGeojson = useAppStore((s) => s.setGeojson);
  const setLayers = useAppStore((s) => s.setLayers);
  const setIdwOverlay = useAppStore((s) => s.setIdwOverlay);
  const setZonesOverlay = useAppStore((s) => s.setZonesOverlay);
  const setCompare = useAppStore((s) => s.setCompare);
  const idwParams = useAppStore((s) => s.idwParams);
  const zoneParams = useAppStore((s) => s.zoneParams);
  const setSession = useAppStore((s) => s.setSession);

  const requireSession = () => {
    if (!session) throw new Error('Seleccioná un lote y creá una sesión primero.');
    return session.session_id;
  };

  const refreshSession = async (id: string) => {
    const st = await api.getSession(id);
    setSession(st);
  };

  return {
    async runGrid() {
      setLoading(true);
      setError(null);
      try {
        const id = requireSession();
        const data = await api.grid(id);
        setStepData('grid', data);
        const outline = await fetchJson(api.artifactUrl(id, 'grid_outline.geojson'));
        setGeojson('grid', outline);
        setLayers({ grid: true, lot: true });
        await refreshSession(id);
        return data;
      } catch (e) {
        setError(String(e));
        throw e;
      } finally {
        setLoading(false);
      }
    },
    async runKmeans() {
      setLoading(true);
      setError(null);
      try {
        const id = requireSession();
        const data = await api.kmeans(id);
        setStepData('kmeans', data);
        const [clusters, centroids] = await Promise.all([
          fetchJson(api.artifactUrl(id, 'clusters.geojson')),
          fetchJson(api.artifactUrl(id, 'centroids.geojson')),
        ]);
        setGeojson('clusters', clusters);
        setGeojson('centroids', centroids);
        setLayers({ lot: true, clusters: true, centroids: true, grid: false });
        await refreshSession(id);
        return data;
      } catch (e) {
        setError(String(e));
        throw e;
      } finally {
        setLoading(false);
      }
    },
    async runSamples() {
      setLoading(true);
      setError(null);
      try {
        const id = requireSession();
        const data = await api.samples(id);
        setStepData('samples', data);
        const samples = await fetchJson(api.artifactUrl(id, 'samples.geojson'));
        setGeojson('samples', samples);
        setLayers({ lot: true, samples: true, centroids: true });
        await refreshSession(id);
        return data;
      } catch (e) {
        setError(String(e));
        throw e;
      } finally {
        setLoading(false);
      }
    },
    async runAssign() {
      setLoading(true);
      setError(null);
      try {
        const id = requireSession();
        const data = await api.assign(id);
        setStepData('assign', data);
        const centroids = await fetchJson(api.artifactUrl(id, 'centroids_damage.geojson'));
        setGeojson('centroids', centroids);
        setLayers({ lot: true, samples: true, centroids: true });
        await refreshSession(id);
        return data;
      } catch (e) {
        setError(String(e));
        throw e;
      } finally {
        setLoading(false);
      }
    },
    async runIdw() {
      setLoading(true);
      setError(null);
      try {
        const id = requireSession();
        const data = (await api.idw(id, idwParams)) as {
          bounds: number[];
          mean_damage: number;
          vmin: number;
          vmax: number;
          png_url: string;
        };
        setStepData('idw', data);
        const url = `${api.artifactUrl(id, 'idw.png')}?t=${Date.now()}`;
        setIdwOverlay({
          url,
          bounds: data.bounds as [number, number, number, number],
        });
        setLayers({ lot: true, idw: true, centroids: true, samples: false });
        await refreshSession(id);
        return data;
      } catch (e) {
        setError(String(e));
        throw e;
      } finally {
        setLoading(false);
      }
    },
    async runZones() {
      setLoading(true);
      setError(null);
      try {
        const id = requireSession();
        const data = (await api.zones(id, zoneParams)) as {
          bounds?: number[];
          zone_stats: { label: string; pct_area: number }[];
          png_url: string;
        };
        setStepData('zones', data);
        const bounds =
          (data.bounds as [number, number, number, number] | undefined) ??
          (useAppStore.getState().idwOverlay?.bounds as [number, number, number, number]);
        if (bounds) {
          setZonesOverlay({
            url: `${api.artifactUrl(id, 'zones.png')}?t=${Date.now()}`,
            bounds,
          });
        }
        setLayers({ lot: true, zones: true, idw: false });
        await refreshSession(id);
        return data;
      } catch (e) {
        setError(String(e));
        throw e;
      } finally {
        setLoading(false);
      }
    },
    async runCompare() {
      setLoading(true);
      setError(null);
      try {
        const id = requireSession();
        const data = await api.compare(id);
        setCompare(data);
        setStepData('compare', data);
        if (data.bounds) {
          setIdwOverlay({
            url: `${api.artifactUrl(id, 'idw.png')}?t=${Date.now()}`,
            bounds: data.bounds as [number, number, number, number],
          });
        }
        setLayers({ lot: true, idw: true, samples: true, centroids: true });
        await refreshSession(id);
        return data;
      } catch (e) {
        setError(String(e));
        throw e;
      } finally {
        setLoading(false);
      }
    },
    async runAll() {
      setLoading(true);
      setError(null);
      try {
        const id = requireSession();
        await api.run(id);
        // hydrate layers from artifacts
        const [outline, clusters, centroids, samples] = await Promise.all([
          fetchJson(api.artifactUrl(id, 'grid_outline.geojson')),
          fetchJson(api.artifactUrl(id, 'clusters.geojson')),
          fetchJson(api.artifactUrl(id, 'centroids_damage.geojson')),
          fetchJson(api.artifactUrl(id, 'samples.geojson')),
        ]);
        setGeojson('grid', outline);
        setGeojson('clusters', clusters);
        setGeojson('centroids', centroids);
        setGeojson('samples', samples);
        const cmp = await api.compare(id);
        setCompare(cmp);
        if (cmp.bounds) {
          setIdwOverlay({
            url: `${api.artifactUrl(id, 'idw.png')}?t=${Date.now()}`,
            bounds: cmp.bounds as [number, number, number, number],
          });
          setZonesOverlay({
            url: `${api.artifactUrl(id, 'zones.png')}?t=${Date.now()}`,
            bounds: cmp.bounds as [number, number, number, number],
          });
        }
        setLayers({ lot: true, idw: true, samples: true, centroids: true, zones: false });
        await refreshSession(id);
        return cmp;
      } catch (e) {
        setError(String(e));
        throw e;
      } finally {
        setLoading(false);
      }
    },
  };
}
