import { useMemo } from 'react';
import { useLayout } from '../../state/LayoutContext';
import { selectResults } from '../../state/results';
import { formatDate } from '../utils/format';
import { BreakdownTable } from './BreakdownTable';
import { ConfigSummary } from './ConfigSummary';
import { Toolbar } from './Toolbar';
import { TotalsSummary } from './TotalsSummary';
import { WindSnapshot } from './WindSnapshot';

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
      { id: 'save', label: 'Save quote', tone: 'primary' as const, onClick: () => undefined },
      { id: 'pdf', label: 'Export PDF', tone: 'secondary' as const, onClick: () => undefined },
      { id: 'email', label: 'Email client', tone: 'secondary' as const, onClick: () => undefined },
    ];
  }, [dispatch, lastResult]);

  return (
    <section className="flex h-full flex-col gap-4 overflow-hidden">
      <header className="flex items-start justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-800">Results</h2>
          {lastResult?.location.suburb && (
            <p className="text-sm text-slate-500">{lastResult.location.suburb}</p>
          )}
        </div>
        {lastResult?.calculatedAt && (
          <span className="text-xs text-slate-400">{formatDate(lastResult.calculatedAt)}</span>
        )}
      </header>

      {results.status === 'pending' && (
        <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white/60 text-sm text-slate-500">
          Calculating…
        </div>
      )}

      {results.error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {results.error}
        </div>
      )}

      {lastResult ? (
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto pr-1">
          <div className="grid gap-4 md:grid-cols-[1fr_1fr]">
            <ConfigSummary configuration={lastResult.configuration} />
            <WindSnapshot wind={lastResult.location.wind} />
          </div>
          <TotalsSummary breakdown={lastResult.breakdown} />
          <BreakdownTable breakdown={lastResult.breakdown} />
        </div>
      ) : results.status !== 'pending' ? (
        <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white/60 text-sm text-slate-500">
          Run a calculation to see results here.
        </div>
      ) : null}

      <Toolbar buttons={toolbarButtons} />
    </section>
  );
}
