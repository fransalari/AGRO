import { DIDACTIC } from '../content/didactic';
import { useAppStore } from '../store';

export function DidacticPanel() {
  const step = useAppStore((s) => s.step);
  const mode = useAppStore((s) => s.mode);
  const d = DIDACTIC[step];

  if (mode === 'production' && step !== 8) {
    return (
      <aside className="rounded-2xl bg-white/10 backdrop-blur border border-white/15 p-4 text-sm text-emerald-50/90">
        <p className="font-semibold text-lime-200">Modo Producción</p>
        <p className="mt-2 leading-relaxed">
          El pipeline se ejecuta de forma automática. Podés revisar cualquier paso con el indicador de progreso
          o volver a Modo Aprendizaje sin perder la sesión.
        </p>
      </aside>
    );
  }

  return (
    <aside className="rounded-2xl bg-white/10 backdrop-blur border border-white/15 p-4 text-sm text-emerald-50/90 space-y-3 overflow-auto max-h-[42vh]">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-lime-300/80">Paso {step} de 8</p>
        <h2 className="text-lg font-semibold text-white mt-1">{d.title}</h2>
      </div>
      <Block label="¿Qué se está haciendo?" text={d.what} />
      <Block label="¿Por qué se hace?" text={d.why} />
      <Block label="¿Cómo se calcula?" text={d.how} />
      <Block label="¿Qué información se utiliza?" text={d.uses} />
      <Block label="¿Qué resultado produce?" text={d.result} />
      <Block label="¿Cómo influye en el siguiente paso?" text={d.next} />
    </aside>
  );
}

function Block({ label, text }: { label: string; text: string }) {
  return (
    <div>
      <p className="text-lime-200 font-medium">{label}</p>
      <p className="leading-relaxed text-emerald-50/85 mt-0.5">{text}</p>
    </div>
  );
}
