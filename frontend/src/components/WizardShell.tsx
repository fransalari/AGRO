import clsx from 'clsx';
import { DidacticPanel } from './DidacticPanel';
import { LayerPanel } from './LayerPanel';
import { MapView } from './MapView';
import { ProgressBar } from './ProgressBar';
import { StepLoad } from './steps/StepLoad';
import {
  StepAssign,
  StepCompare,
  StepGrid,
  StepIdw,
  StepKMeans,
  StepSamples,
  StepZones,
} from './steps/PipelineSteps';
import { usePipelineActions } from '../hooks/usePipeline';
import { useAppStore, type WizardStep } from '../store';

export function WizardShell() {
  const step = useAppStore((s) => s.step);
  const setStep = useAppStore((s) => s.setStep);
  const mode = useAppStore((s) => s.mode);
  const setMode = useAppStore((s) => s.setMode);
  const loading = useAppStore((s) => s.loading);
  const error = useAppStore((s) => s.error);
  const session = useAppStore((s) => s.session);
  const { runAll } = usePipelineActions();

  const next = async () => {
    if (mode === 'production' && step === 1 && session) {
      await runAll();
      setStep(8);
      return;
    }
    setStep(Math.min(8, step + 1) as WizardStep);
  };

  const back = () => setStep(Math.max(1, step - 1) as WizardStep);

  return (
    <div className="h-full flex flex-col gap-3 p-4 md:p-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.25em] text-lime-300/80">Sancor Seguros · AGRO</p>
          <h1 className="text-2xl md:text-3xl font-semibold text-white tracking-tight">
            Muestreo Dirigido
          </h1>
          <p className="text-sm text-emerald-100/70">Clustering, IDW y comparación metodológica</p>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-black/30 border border-white/15 p-1">
          <ModeBtn active={mode === 'learning'} onClick={() => setMode('learning')} label="Aprendizaje" />
          <ModeBtn active={mode === 'production'} onClick={() => setMode('production')} label="Producción" />
        </div>
      </header>

      <ProgressBar />

      <div className="flex-1 min-h-0 grid grid-cols-1 xl:grid-cols-[340px_1fr_320px] gap-3">
        <div className="flex flex-col gap-3 min-h-0 overflow-auto">
          <DidacticPanel />
          <section className="rounded-2xl bg-white/10 border border-white/15 p-4 backdrop-blur">
            <StepControls />
          </section>
          {error && (
            <p className="text-sm text-red-200 bg-red-900/40 border border-red-400/30 rounded-xl p-3">
              {error}
            </p>
          )}
          {loading && <p className="text-xs text-lime-200 animate-pulse">Procesando…</p>}
          <div className="flex gap-2 mt-auto">
            <button type="button" className="btn-secondary flex-1" onClick={back} disabled={step === 1}>
              Anterior
            </button>
            <button type="button" className="btn-primary flex-1" onClick={next} disabled={step === 8 && mode === 'learning'}>
              {mode === 'production' && step === 1 ? 'Ejecutar pipeline' : step === 8 ? 'Fin' : 'Siguiente'}
            </button>
          </div>
        </div>

        <div className="min-h-[360px] h-full relative">
          <MapView />
          <div className="absolute left-3 bottom-3 right-3 z-10">
            <LayerPanel />
          </div>
        </div>

        <aside className="rounded-2xl bg-black/25 border border-white/10 p-4 text-xs text-emerald-50/80 space-y-3 overflow-auto">
          <p className="text-[11px] uppercase tracking-widest text-lime-200">Parámetros / resultados</p>
          <p>
            El mapa satelital híbrido combina imagen Esri World Imagery con etiquetas de referencia. Activá o
            desactivá capas para ver cómo evoluciona el proceso.
          </p>
          {session && (
            <ul className="space-y-1">
              <li>Lote ID: {session.lot_id}</li>
              <li>Área: {session.area_ha.toFixed(2)} ha</li>
              <li>k: {session.k}</li>
              <li>Res: {session.grid_res_m} m</li>
              <li>Pasos: {session.steps_done.join(' → ') || '—'}</li>
            </ul>
          )}
          <DamageLegend />
        </aside>
      </div>
    </div>
  );
}

function StepControls() {
  const step = useAppStore((s) => s.step);
  switch (step) {
    case 1:
      return <StepLoad />;
    case 2:
      return <StepGrid />;
    case 3:
      return <StepKMeans />;
    case 4:
      return <StepSamples />;
    case 5:
      return <StepAssign />;
    case 6:
      return <StepIdw />;
    case 7:
      return <StepZones />;
    case 8:
      return <StepCompare />;
    default:
      return null;
  }
}

function ModeBtn({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'px-4 py-1.5 rounded-full text-sm transition',
        active ? 'bg-lime-400 text-emerald-950 font-semibold' : 'text-emerald-50/80 hover:text-white',
      )}
    >
      {label}
    </button>
  );
}

function DamageLegend() {
  return (
    <div>
      <p className="mb-1 text-lime-200">Escala de daño</p>
      <div
        className="h-2 rounded-full"
        style={{ background: 'linear-gradient(90deg,#228B22,#9ACD32,#FFD700,#FF8C00,#B22222)' }}
      />
      <div className="flex justify-between mt-1 text-[10px]">
        <span>Muy bajo</span>
        <span>Medio</span>
        <span>Muy alto</span>
      </div>
    </div>
  );
}
