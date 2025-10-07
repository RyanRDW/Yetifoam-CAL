import { useMemo } from 'react';
import { useLayout } from '../../state/LayoutContext';
import { selectResults } from '../../state/results';
import { formatDate } from '../utils/format';
import { BreakdownTable } from './BreakdownTable';
import { ConfigSummary } from './ConfigSummary';
import { Toolbar } from './Toolbar';
import { TotalsSummary } from './TotalsSummary';

export function ResultsPanel() {
  const { state, dispatch } = useLayout();
  const results = selectResults(state);
  const lastResult = results.lastResult;

  const toolbarButtons = useMemo(() => {
    if (!lastResult) {
      return [];
    }

    const handleEdit = () => {
      dispatch({ type: 'SET_MODE', payload: 'input' });
      dispatch({ type: 'SET_PANELS', payload: { inputWidthPct: 40, rightStack: [35, 65] } });
    };

    return [
      {
        id: 'edit',
        label: 'Edit inputs',
        tone: 'secondary' as const,
        onClick: handleEdit,
      },
    ];
  }, [dispatch, lastResult]);

  const isLoading = results.status === 'pending';

  return (
    <section className="flex h-full flex-col">
      <div className="app-surface-glass flex h-full flex-col rounded-3xl px-6 py-6">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200/60 pb-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-blue-600/80">Results</p>
            <h2 className="mt-1 text-xl font-semibold text-slate-900">Spray coverage summary</h2>
            {lastResult?.jobId && (
              <p className="mt-1 text-xs font-medium text-slate-500">Job reference · {lastResult.jobId}</p>
            )}
          </div>
          <div className="flex flex-col items-end text-xs text-slate-500">
            <span className={`rounded-full px-3 py-1 font-semibold ${isLoading ? 'bg-amber-100 text-amber-700' : lastResult ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
              {isLoading ? 'Calculating' : lastResult ? 'Ready' : 'Waiting for inputs'}
            </span>
            {lastResult?.calculatedAt && (
              <span className="mt-2">Updated {formatDate(lastResult.calculatedAt)}</span>
            )}
          </div>
        </header>

        {results.error && (
          <div className="mt-4 rounded-2xl border border-rose-200/70 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {results.error}
          </div>
        )}

        {isLoading && !lastResult && (
          <div className="mt-6 flex flex-1 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-gradient-to-br from-white/70 to-slate-100/80 text-sm text-slate-500">
            Preparing calculations…
          </div>
        )}

        {lastResult && (
          <div className="mt-6 flex flex-1 flex-col gap-6 overflow-y-auto pr-1">
            <ConfigSummary configuration={lastResult.configuration} />
            <TotalsSummary breakdown={lastResult.breakdown} />
            <BreakdownTable breakdown={lastResult.breakdown} />
          </div>
        )}

        {!lastResult && !isLoading && !results.error && (
          <div className="mt-6 flex flex-1 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-gradient-to-br from-white/70 to-slate-100/80 text-sm text-slate-500">
            Run a calculation to review pricing-ready coverage.
          </div>
        )}

        <div className="mt-6 border-t border-slate-200/60 pt-4">
          <Toolbar buttons={toolbarButtons} />
        </div>
      </div>
    </section>
  );
}
