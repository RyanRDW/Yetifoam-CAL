import { useEffect, useMemo, useState } from 'react';
import { openingTypes, type OpeningType } from '../../state/formSchema';

interface OpeningsModalProps {
  open: boolean;
  counts: Record<OpeningType, number>;
  onApply: (next: Record<OpeningType, number>) => void;
  onClose: () => void;
}

const OPENING_LABELS: Record<OpeningType, { label: string; area: string; surface: string }> = {
  single_roller: { label: 'Single Roller Door', area: '5.04 m²', surface: 'Gable walls' },
  double_roller: { label: 'Double Roller Door', area: '10.08 m²', surface: 'Gable walls' },
  high_roller: { label: 'High Roller Door', area: '9.00 m²', surface: 'Gable walls' },
  large_roller: { label: 'Large/Industrial Roller', area: '23.10 m²', surface: 'Gable walls' },
  pa_door: { label: 'PA Door', area: '1.67 m²', surface: 'Side walls' },
  window: { label: 'Window', area: '1.44 m²', surface: 'Side walls' },
  sliding_single: { label: 'Sliding Door (Single)', area: '4.41 m²', surface: 'Side walls' },
  sliding_double: { label: 'Sliding Door (Double)', area: '8.82 m²', surface: 'Side walls' },
  laserlight: { label: 'Laserlight Panel', area: '0.9m × rafter length', surface: 'Roof' },
  custom: { label: 'Custom Deduction', area: '1.0 m² per increment', surface: 'Side walls' },
};

export function OpeningsModal({ open, counts, onApply, onClose }: OpeningsModalProps) {
  const [draft, setDraft] = useState(counts);

  useEffect(() => {
    setDraft(counts);
  }, [counts, open]);

  useEffect(() => {
    if (!open) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose, open]);

  const totalSelected = useMemo(
    () => Object.values(draft).reduce((total, qty) => total + qty, 0),
    [draft],
  );

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 py-8"
      role="dialog"
      aria-modal="true"
      onMouseDown={onClose}
    >
      <div
        className="app-surface-glass max-h-[520px] w-full max-w-3xl overflow-hidden rounded-3xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-slate-200/60 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Manage openings</h2>
            <p className="text-sm text-slate-500">Log deductions across gable, side walls, and roof surfaces.</p>
          </div>
          <button
            type="button"
            className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-500 transition hover:bg-slate-200 hover:text-slate-700"
            onClick={onClose}
          >
            Close
          </button>
        </header>
        <div className="max-h-[360px] overflow-auto px-6 py-2">
          <ul className="space-y-3">
            {openingTypes.map((type) => {
              const meta = OPENING_LABELS[type];
              const quantity = draft[type] ?? 0;
              return (
                <li
                  key={type}
                  className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-sm text-slate-700 shadow-sm"
                >
                  <div>
                    <p className="font-semibold text-slate-800">{meta.label}</p>
                    <p className="text-xs text-slate-500">{meta.area} · Deduct from {meta.surface}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-lg leading-none text-slate-600 transition hover:border-blue-500 hover:text-blue-600 disabled:opacity-40"
                      onClick={() =>
                        setDraft((prev) => ({ ...prev, [type]: Math.max(0, (prev[type] ?? 0) - 1) }))
                      }
                      disabled={quantity === 0}
                    >
                      −
                    </button>
                    <span className="w-10 text-center text-sm font-semibold text-slate-700">{quantity}</span>
                    <button
                      type="button"
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-lg leading-none text-slate-600 transition hover:border-blue-500 hover:text-blue-600"
                      onClick={() =>
                        setDraft((prev) => ({ ...prev, [type]: Math.min(999, (prev[type] ?? 0) + 1) }))
                      }
                    >
                      +
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
        <footer className="flex items-center justify-between border-t border-slate-200/60 bg-slate-50/70 px-6 py-4">
          <span className="text-sm font-medium text-slate-600">Total openings: {totalSelected}</span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="button"
              className="rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:from-blue-500 hover:to-cyan-500 disabled:cursor-not-allowed disabled:opacity-60"
              onClick={() => onApply({ ...draft })}
              disabled={draft === counts}
            >
              Apply changes
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
