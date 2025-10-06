import { useMemo } from 'react';
import { useLayout } from '../../state/LayoutContext';
import { selectLivePreview, selectMode } from '../../state/results';

export function LivePreview() {
  const { state } = useLayout();
  const summary = selectLivePreview(state);
  const mode = selectMode(state);

  const statusLabel = useMemo(() => {
    switch (mode) {
      case 'calculating':
        return 'Calculating…';
      case 'results':
        return 'Preview locked';
      default:
        return 'Live preview';
    }
  }, [mode]);

  return (
    <section className="flex h-full flex-col gap-4">
      <header className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-800">Live Preview</h2>
        <span className="rounded-full border border-slate-200 px-2 py-0.5 text-xs text-slate-500">{statusLabel}</span>
      </header>
      <div className="flex-1 overflow-y-auto rounded-2xl border border-slate-200 bg-white/75 p-5 shadow-sm">
        <dl className="space-y-4 text-sm text-slate-700">
          <PreviewRow label="Dimensions" value={summary.dimensionsLabel ?? 'Not set'} />
          <PreviewRow label="Pitch" value={summary.pitchLabel} highlight={summary.pitchAssumed} />
          <PreviewRow label="Cladding" value={summary.claddingLabel ?? 'Not selected'} />
          <PreviewRow label="Members" value={summary.membersLabel ?? 'Not selected'} />
          <PreviewRow label="Openings" value={`${summary.openingsCount} selected`} />
        </dl>
        {summary.warnings.length > 0 && (
          <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            {summary.warnings.map((warning) => (
              <p key={warning}>{warning}</p>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

type PreviewRowProps = {
  label: string;
  value: string;
  highlight?: boolean;
};

function PreviewRow({ label, value, highlight }: PreviewRowProps) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className={['mt-1 font-medium', highlight ? 'text-amber-600' : 'text-slate-800'].join(' ')}>{value}</dd>
    </div>
  );
}
