import type { CalculationResult } from '../../state/LayoutContext';
import { formatWindSpeed } from '../utils/format';

type Props = {
  wind: CalculationResult['location']['wind'] | null | undefined;
};

export function WindSnapshot({ wind }: Props) {
  if (!wind) {
    return (
      <section className="rounded-xl border border-dashed border-slate-200 bg-white/50 p-4 text-sm text-slate-500">
        <header className="mb-2 text-sm font-semibold text-slate-600">Wind snapshot</header>
        <p>No wind data captured yet. Fetch weather data before calculating to populate this section.</p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white/80 p-4 shadow-sm">
      <header className="mb-2 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-700">Wind snapshot</h3>
          {wind.sourceSuburb && <p className="text-xs text-slate-500">Data for {wind.sourceSuburb}</p>}
        </div>
      </header>
      <dl className="grid grid-cols-2 gap-3 text-sm text-slate-700">
        <div className="rounded-lg border border-slate-100 bg-white/90 p-3">
          <dt className="text-xs uppercase tracking-wide text-slate-500">Fastest recorded</dt>
          <dd className="mt-1 text-lg font-semibold text-slate-900">{formatWindSpeed(wind.fastestRecorded?.speed ?? null)}</dd>
          {wind.fastestRecorded?.year && (
            <p className="text-xs text-slate-500">Year {wind.fastestRecorded.year}</p>
          )}
        </div>
        <div className="rounded-lg border border-slate-100 bg-white/90 p-3">
          <dt className="text-xs uppercase tracking-wide text-slate-500">Average last year</dt>
          <dd className="mt-1 text-lg font-semibold text-slate-900">{formatWindSpeed(wind.averageLastYear?.speed ?? null)}</dd>
          {wind.averageLastYear?.year && (
            <p className="text-xs text-slate-500">Year {wind.averageLastYear.year}</p>
          )}
        </div>
      </dl>
    </section>
  );
}
