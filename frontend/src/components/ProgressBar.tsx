import clsx from 'clsx';
import { STEPS } from '../content/didactic';
import { useAppStore, type WizardStep } from '../store';

export function ProgressBar() {
  const step = useAppStore((s) => s.step);
  const setStep = useAppStore((s) => s.setStep);
  const session = useAppStore((s) => s.session);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-lime-100/90">
          Paso <span className="font-semibold text-white">{step}</span> de 8 — {STEPS[step - 1].label}
        </p>
        <p className="text-xs text-emerald-100/60">
          {session ? `Sesión ${session.session_id}` : 'Sin sesión'}
        </p>
      </div>
      <div className="h-2 rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-lime-400 to-amber-400 transition-all duration-500"
          style={{ width: `${(step / 8) * 100}%` }}
        />
      </div>
      <div className="mt-3 grid grid-cols-8 gap-1">
        {STEPS.map((s) => (
          <button
            key={s.step}
            type="button"
            title={s.label}
            onClick={() => setStep(s.step as WizardStep)}
            className={clsx(
              'h-1.5 rounded-full transition',
              s.step <= step ? 'bg-lime-400' : 'bg-white/15',
            )}
          />
        ))}
      </div>
    </div>
  );
}
