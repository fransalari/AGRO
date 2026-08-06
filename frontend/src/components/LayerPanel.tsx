import clsx from 'clsx';
import { useAppStore, type LayerKey } from '../store';

const LABELS: { key: LayerKey; label: string }[] = [
  { key: 'lot', label: 'Lote' },
  { key: 'grid', label: 'Grilla' },
  { key: 'clusters', label: 'Clusters' },
  { key: 'centroids', label: 'Centroides' },
  { key: 'samples', label: 'Muestras' },
  { key: 'idw', label: 'IDW' },
  { key: 'zones', label: 'Zonas' },
];

export function LayerPanel() {
  const layers = useAppStore((s) => s.layers);
  const toggle = useAppStore((s) => s.toggleLayer);

  return (
    <div className="rounded-2xl bg-black/35 border border-white/15 p-3 backdrop-blur">
      <p className="text-xs uppercase tracking-widest text-lime-200/90 mb-2">Capas</p>
      <div className="flex flex-wrap gap-2">
        {LABELS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => toggle(key)}
            className={clsx(
              'px-3 py-1.5 rounded-full text-xs border transition',
              layers[key]
                ? 'bg-lime-400 text-emerald-950 border-lime-300'
                : 'bg-transparent text-emerald-50/80 border-white/20 hover:border-white/40',
            )}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
