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
  const clusters = compare?.clusters ?? [];
  const ambientes = compare?.ambientes ?? [];
  const kAmb = compare?.k_ambientes ?? ambientes.length;

  return (
    <div className="space-y-3 text-sm">
      <button type="button" className="btn-primary" onClick={() => runCompare()}>
        Finalizar
      </button>
      {compare && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-2">
            <Kpi
              title="1 · Promedio simple"
              value={`${compare.traditional_mean.toFixed(2)}%`}
              hint="Media de muestras (sin peso espacial)"
            />
            <Kpi
              title={`2 · Ponderado K-Means (k=${compare.k})`}
              value={`${compare.weighted_mean.toFixed(2)}%`}
              hint={`Δ vs simple: ${compare.abs_diff.toFixed(2)} pp (${compare.pct_diff.toFixed(1)}%)`}
            />
            <Kpi
              title={`3 · Ambientes reducidos (k'=${kAmb})`}
              value={`${(compare.weighted_ambientes_mean ?? 0).toFixed(2)}%`}
              hint={`Re-KMeans por similitud de daño · Δ vs simple: ${(compare.abs_diff_ambientes ?? 0).toFixed(2)} pp · Δ vs k: ${(compare.abs_diff_k_vs_ambientes ?? 0).toFixed(2)} pp`}
            />
          </div>

          <ContributionTable
            title={`Clusters K-Means (k=${compare.k})`}
            rows={clusters}
            footnote="Peso = área del cluster / área total. Aporte = daño × peso."
          />

          {ambientes.length > 0 && (
            <ContributionTable
              title={`Ambientes por similitud (k'=${kAmb}${kAmb < compare.k ? ` · reducido desde ${compare.k}` : ''})`}
              rows={ambientes}
              footnote="Se vuelve a hacer K-Means sobre el daño de los centroides y se fusionan clusters similares. El daño del ambiente es el promedio ponderado de sus clusters."
            />
          )}

          <ResultsBox>
            <p>Muestras: {compare.n_samples}</p>
            <p>
              Clusters → ambientes: {compare.k} → {kAmb}
            </p>
            <p>Área lote: {compare.area_ha.toFixed(1)} ha</p>
            <p>Resolución: {compare.grid_res_m} m</p>
            {compare.ambientes_silhouette != null && (
              <p>Silhouette ambientes: {compare.ambientes_silhouette.toFixed(3)}</p>
            )}
            <p>
              IDW (ref.): {compare.directed_mean.toFixed(2)}%
              {compare.abs_diff_idw != null && (
                <span className="text-emerald-100/50">
                  {' '}
                  (Δ {compare.abs_diff_idw.toFixed(2)} pp vs simple)
                </span>
              )}
            </p>
          </ResultsBox>
        </div>
      )}
    </div>
  );
}

function ContributionTable({
  title,
  rows,
  footnote,
}: {
  title: string;
  rows: {
    cluster: number;
    label: string;
    area_ha: number;
    weight_pct: number;
    damage: number;
    contribution: number;
    contribution_pct: number;
  }[];
  footnote: string;
}) {
  if (rows.length === 0) return null;
  return (
    <div className="rounded-xl border border-white/15 overflow-hidden">
      <div className="bg-black/30 px-3 py-2 text-[11px] uppercase tracking-wider text-lime-200/80">
        {title}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-[11px]">
          <thead className="text-emerald-100/60 border-b border-white/10">
            <tr>
              <th className="px-2 py-1.5 font-medium">ID</th>
              <th className="px-2 py-1.5 font-medium">Área</th>
              <th className="px-2 py-1.5 font-medium">Peso</th>
              <th className="px-2 py-1.5 font-medium">Daño</th>
              <th className="px-2 py-1.5 font-medium">Aporte</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={`${title}-${c.cluster}`} className="border-b border-white/5 last:border-0">
                <td className="px-2 py-1.5 text-white">{c.label}</td>
                <td className="px-2 py-1.5">{c.area_ha.toFixed(2)} ha</td>
                <td className="px-2 py-1.5">{c.weight_pct.toFixed(1)}%</td>
                <td className="px-2 py-1.5">{c.damage.toFixed(1)}%</td>
                <td className="px-2 py-1.5">
                  {c.contribution.toFixed(2)} pp
                  <span className="text-emerald-100/50"> ({c.contribution_pct.toFixed(0)}%)</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="px-3 py-2 text-[10px] text-emerald-100/55 border-t border-white/10">{footnote}</p>
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
