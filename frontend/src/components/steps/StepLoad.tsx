import { useEffect, useState } from 'react';
import { api, type LotSummary } from '../../lib/api';
import { useAppStore } from '../../store';

export function StepLoad() {
  const [q, setQ] = useState('');
  const lots = useAppStore((s) => s.lots);
  const setLots = useAppStore((s) => s.setLots);
  const selectedLot = useAppStore((s) => s.selectedLot);
  const setSelectedLot = useAppStore((s) => s.setSelectedLot);
  const gridResM = useAppStore((s) => s.gridResM);
  const setGridResM = useAppStore((s) => s.setGridResM);
  const mode = useAppStore((s) => s.mode);
  const setSession = useAppStore((s) => s.setSession);
  const setGeojson = useAppStore((s) => s.setGeojson);
  const setLoading = useAppStore((s) => s.setLoading);
  const setError = useAppStore((s) => s.setError);
  const setLayers = useAppStore((s) => s.setLayers);
  const [indexing, setIndexing] = useState(false);
  const [indexMsg, setIndexMsg] = useState<string | null>(null);

  const search = async (query?: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.listLots(query || undefined);
      setLots(res.lots);
      if (!res.lots.length) setError('No hay lotes indexados. Generá el índice primero.');
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void search();
  }, []);

  const rebuild = async () => {
    setIndexing(true);
    setIndexMsg('Construyendo índice espacial (puede demorar varios minutos)...');
    setError(null);
    try {
      const meta = await api.rebuildIndex();
      setIndexMsg(`Índice listo: ${String(meta.lot_count ?? 0)} lotes con muestras.`);
      await search();
    } catch (e) {
      setError(String(e));
      setIndexMsg(null);
    } finally {
      setIndexing(false);
    }
  };

  const select = async (lot: LotSummary) => {
    setLoading(true);
    setError(null);
    try {
      const detail = await api.getLot(lot.lot_id);
      setSelectedLot(detail.summary, detail.feature);
      setGeojson('lot', { type: 'FeatureCollection', features: [detail.feature] });
      setLayers({
        lot: true,
        grid: false,
        clusters: false,
        centroids: false,
        samples: false,
        idw: false,
        zones: false,
      });
      const session = await api.createSession({
        lot_id: lot.lot_id,
        mode,
        grid_res_m: gridResM,
      });
      setSession(session);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3 text-sm">
      <div className="flex flex-wrap gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && void search(q)}
          placeholder="Buscar lote / establecimiento"
          className="flex-1 min-w-[160px] rounded-lg bg-black/30 border border-white/20 px-3 py-2 outline-none focus:border-lime-300"
        />
        <button type="button" onClick={() => void search(q)} className="btn-primary">
          Buscar
        </button>
        <button type="button" onClick={() => void rebuild()} disabled={indexing} className="btn-secondary">
          {indexing ? 'Indexando…' : 'Generar índice'}
        </button>
      </div>
      {indexMsg && <p className="text-lime-200/90 text-xs">{indexMsg}</p>}
      <label className="flex items-center gap-2 text-xs text-emerald-100/80">
        Resolución grilla (m)
        <input
          type="number"
          min={5}
          max={20}
          step={1}
          value={gridResM}
          onChange={(e) => setGridResM(Number(e.target.value))}
          className="w-20 rounded bg-black/30 border border-white/20 px-2 py-1"
        />
      </label>
      <div className="max-h-56 overflow-auto rounded-xl border border-white/10 divide-y divide-white/10">
        {lots.map((lot) => (
          <button
            key={lot.lot_id}
            type="button"
            onClick={() => void select(lot)}
            className={`w-full text-left px-3 py-2 hover:bg-white/10 transition ${
              selectedLot?.lot_id === lot.lot_id ? 'bg-lime-400/15' : ''
            }`}
          >
            <div className="font-medium text-white">{lot.name}</div>
            <div className="text-xs text-emerald-100/70">
              {lot.farm_name ?? '—'} · {lot.area_ha.toFixed(1)} ha · {lot.sample_count} muestras · k≥
              {lot.min_samples_rule ?? '—'}
            </div>
          </button>
        ))}
        {!lots.length && (
          <p className="p-3 text-emerald-100/60">Cargá el índice y buscá lotes con muestras.</p>
        )}
      </div>
      {selectedLot && (
        <p className="text-lime-200 text-xs">
          Seleccionado: {selectedLot.name} ({selectedLot.area_ha.toFixed(1)} ha). Sesión creada — podés
          avanzar.
        </p>
      )}
    </div>
  );
}
