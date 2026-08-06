import { usePipelineActions } from '../../hooks/usePipeline';
import { useAppStore } from '../../store';

function ResultsBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-black/25 border border-white/10 p-3 text-xs text-emerald-50/90 space-y-1">
      {children}
    </div>
  );
}

export function StepGrid() {
  const { runGrid } = usePipelineActions();
  const data = useAppStore((s) => s.stepData.grid) as Record<string, number> | undefined;
  const session = useAppStore((s) => s.session);

  return (
    <div className="space-y-3 text-sm">
      <button type="button" className="btn-primary" onClick={() => runGrid()}>
        Generar grilla espacial
      </button>
      {session && (
        <ResultsBox>
          <p>Área: {session.area_ha.toFixed(2)} ha</p>
          <p>Resolución: {session.grid_res_m} m</p>
          <p>k mínimo (regla): {session.k}</p>
        </ResultsBox>
      )}
      {data && (
        <ResultsBox>
          <p>Celdas generadas: {String(data.n_cells)}</p>
          <p>La malla visual es representativa; el clustering usa todos los puntos internos.</p>
        </ResultsBox>
      )}
    </div>
  );
}

export function StepKMeans() {
  const { runKmeans } = usePipelineActions();
  const data = useAppStore((s) => s.stepData.kmeans) as { k?: number } | undefined;
  return (
    <div className="space-y-3 text-sm">
      <button type="button" className="btn-primary" onClick={() => runKmeans()}>
        Ejecutar K-Means
      </button>
      {data && (
        <ResultsBox>
          <p>Clusters / centroides: {data.k}</p>
          <p>Cada centroide es un punto sugerido de muestreo.</p>
        </ResultsBox>
      )}
    </div>
  );
}

export function StepSamples() {
  const { runSamples } = usePipelineActions();
  const data = useAppStore((s) => s.stepData.samples) as {
    n_samples?: number;
    damage_stats?: Record<string, number>;
  } | undefined;
  return (
    <div className="space-y-3 text-sm">
      <button type="button" className="btn-primary" onClick={() => runSamples()}>
        Cargar muestras reales
      </button>
      {data && (
        <ResultsBox>
          <p>Muestras: {data.n_samples}</p>
          {data.damage_stats && (
            <>
              <p>Daño medio: {data.damage_stats.mean?.toFixed(2)}%</p>
              <p>
                Rango: {data.damage_stats.min?.toFixed(1)}% – {data.damage_stats.max?.toFixed(1)}%
              </p>
            </>
          )}
        </ResultsBox>
      )}
    </div>
  );
}

export function StepAssign() {
  const { runAssign } = usePipelineActions();
  const data = useAppStore((s) => s.stepData.assign) as {
    damage_mean?: number;
    damage_min?: number;
    damage_max?: number;
  } | undefined;
  return (
    <div className="space-y-3 text-sm">
      <button type="button" className="btn-primary" onClick={() => runAssign()}>
        Asignar daño a centroides
      </button>
      {data && (
        <ResultsBox>
          <p>Daño medio en centroides: {data.damage_mean?.toFixed(2)}%</p>
          <p>
            Min/Max: {data.damage_min?.toFixed(1)}% / {data.damage_max?.toFixed(1)}%
          </p>
        </ResultsBox>
      )}
    </div>
  );
}

export function StepIdw() {
  const { runIdw } = usePipelineActions();
  const params = useAppStore((s) => s.idwParams);
  const setIdwParams = useAppStore((s) => s.setIdwParams);
  const data = useAppStore((s) => s.stepData.idw) as {
    mean_damage?: number;
    vmin?: number;
    vmax?: number;
  } | undefined;

  return (
    <div className="space-y-3 text-sm">
      <div className="grid grid-cols-2 gap-2 text-xs">
        <label className="space-y-1">
          <span>Potencia IDW (p)</span>
          <input
            type="number"
            min={0.5}
            max={5}
            step={0.5}
            value={params.power}
            onChange={(e) => setIdwParams({ power: Number(e.target.value) })}
            className="w-full rounded bg-black/30 border border-white/20 px-2 py-1"
          />
        </label>
        <label className="space-y-1">
          <span>Escala</span>
          <select
            value={params.scale_mode}
            onChange={(e) => setIdwParams({ scale_mode: e.target.value as 'fixed' | 'adaptive' })}
            className="w-full rounded bg-black/30 border border-white/20 px-2 py-1"
          >
            <option value="fixed">Fija 0–100</option>
            <option value="adaptive">Adaptativa p5–p95</option>
          </select>
        </label>
        <label className="space-y-1 col-span-2">
          <span>Simbología</span>
          <select
            value={params.symbology}
            onChange={(e) =>
              setIdwParams({ symbology: e.target.value as 'continuous' | 'discrete' })
            }
            className="w-full rounded bg-black/30 border border-white/20 px-2 py-1"
          >
            <option value="continuous">Continua</option>
            <option value="discrete">Discreta</option>
          </select>
        </label>
      </div>
      <button type="button" className="btn-primary" onClick={() => runIdw()}>
        Ejecutar IDW
      </button>
      {data && (
        <ResultsBox>
          <p>Daño medio interpolado: {data.mean_damage?.toFixed(2)}%</p>
          <p>
            Escala visual: {data.vmin?.toFixed(1)} – {data.vmax?.toFixed(1)}
          </p>
        </ResultsBox>
      )}
      <Legend />
    </div>
  );
}

export function StepZones() {
  const { runZones } = usePipelineActions();
  const params = useAppStore((s) => s.zoneParams);
  const setZoneParams = useAppStore((s) => s.setZoneParams);
  const data = useAppStore((s) => s.stepData.zones) as {
    zone_stats?: { label: string; pct_area: number; min: number; max: number }[];
  } | undefined;

  return (
    <div className="space-y-3 text-sm">
      <div className="grid grid-cols-2 gap-2 text-xs">
        <label className="space-y-1">
          <span>Escala</span>
          <select
            value={params.scale_mode}
            onChange={(e) => setZoneParams({ scale_mode: e.target.value as 'fixed' | 'adaptive' })}
            className="w-full rounded bg-black/30 border border-white/20 px-2 py-1"
          >
            <option value="fixed">Fija</option>
            <option value="adaptive">Adaptativa</option>
          </select>
        </label>
        <label className="space-y-1">
          <span>Simbología</span>
          <select
            value={params.symbology}
            onChange={(e) =>
              setZoneParams({ symbology: e.target.value as 'continuous' | 'discrete' })
            }
            className="w-full rounded bg-black/30 border border-white/20 px-2 py-1"
          >
            <option value="discrete">Discreta</option>
            <option value="continuous">Continua</option>
          </select>
        </label>
      </div>
      <button type="button" className="btn-primary" onClick={() => runZones()}>
        Generar zonificación
      </button>
      {data?.zone_stats && (
        <ResultsBox>
          {data.zone_stats.map((z) => (
            <p key={z.label}>
              {z.label}: {z.pct_area}% área ({z.min.toFixed(0)}–{z.max.toFixed(0)}%)
            </p>
          ))}
        </ResultsBox>
      )}
    </div>
  );
}

export function StepCompare() {
  const { runCompare } = usePipelineActions();
  const compare = useAppStore((s) => s.compare);

  return (
    <div className="space-y-3 text-sm">
      <button type="button" className="btn-primary" onClick={() => runCompare()}>
        Calcular comparación
      </button>
      {compare && (
        <div className="grid grid-cols-2 gap-2">
          <Kpi title="Tradicional" value={`${compare.traditional_mean.toFixed(2)}%`} hint="Media muestras" />
          <Kpi title="Dirigido" value={`${compare.directed_mean.toFixed(2)}%`} hint="Media IDW" />
          <Kpi title="Δ absoluta" value={`${compare.abs_diff.toFixed(2)} pp`} />
          <Kpi title="Δ porcentual" value={`${compare.pct_diff.toFixed(2)}%`} />
          <ResultsBox>
            <p>Muestras: {compare.n_samples}</p>
            <p>Centroides k: {compare.k}</p>
            <p>Área: {compare.area_ha.toFixed(1)} ha</p>
            <p>Resolución: {compare.grid_res_m} m</p>
          </ResultsBox>
        </div>
      )}
    </div>
  );
}

function Kpi({ title, value, hint }: { title: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl bg-gradient-to-br from-lime-400/20 to-amber-400/10 border border-white/15 p-3">
      <p className="text-[11px] uppercase tracking-wider text-lime-200/80">{title}</p>
      <p className="text-xl font-semibold text-white mt-1">{value}</p>
      {hint && <p className="text-[11px] text-emerald-100/60">{hint}</p>}
    </div>
  );
}

function Legend() {
  return (
    <div className="flex items-center gap-2 text-[10px] text-emerald-100/80">
      <span>0%</span>
      <div
        className="flex-1 h-2 rounded-full"
        style={{
          background: 'linear-gradient(90deg,#228B22,#9ACD32,#FFD700,#FF8C00,#B22222)',
        }}
      />
      <span>100%</span>
    </div>
  );
}
