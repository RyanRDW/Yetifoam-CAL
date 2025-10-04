import { useEffect, useState } from 'react';
import { useLayout } from '../state/LayoutContext';

interface BomResult {
  fastest_recorded?: { speed_kmh: number; year: number };
  average_last_year?: { speed_kmh: number; year: number };
  status?: string;
}

export function WeatherPanel() {
  const {
    state: { weather },
    dispatch,
  } = useLayout();
  const [suburb, setSuburb] = useState(weather.suburb);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSuburb(weather.suburb);
  }, [weather.suburb]);

  async function fetchData() {
    const query = suburb.trim();
    if (!query) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/bom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ suburb: query }),
      });
      const json: BomResult = await res.json();
      if (!res.ok) {
        throw new Error((json as any)?.error?.message || 'BOM lookup failed');
      }
      dispatch({
        type: 'SET_WEATHER',
        payload: { suburb: query, lastResult: json, lastUpdated: new Date().toISOString() },
      });
      setSuburb(query);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Unknown error';
      setError(message);
      dispatch({
        type: 'SET_WEATHER',
        payload: {
          suburb: query,
          lastResult: weather.lastResult,
          lastUpdated: weather.lastUpdated,
        },
      });
      setSuburb(query);
    } finally {
      setLoading(false);
    }
  }

  const data = weather.lastResult as BomResult | null;
  const fastest = data?.fastest_recorded;
  const average = data?.average_last_year;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white/70 p-5 shadow-sm backdrop-blur">
      <header className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-800">Weather</h2>
        {weather.lastUpdated && (
          <span className="text-xs text-slate-500">Updated {new Date(weather.lastUpdated).toLocaleTimeString()}</span>
        )}
      </header>
      <label className="block text-sm font-medium text-slate-700">Suburb</label>
      <div className="mt-1 flex gap-2">
        <input
          value={suburb}
          onChange={(event) => setSuburb(event.target.value)}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-500/30"
        />
        <button
          onClick={fetchData}
          disabled={!suburb.trim() || loading}
          className="flex items-center justify-center rounded-lg bg-slate-900 px-4 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {loading ? 'Loading…' : 'Fetch'}
        </button>
      </div>
      {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}
      {data && !data.status && (
        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-700">
          <div className="rounded-xl border border-slate-100 bg-white/80 p-3">
            <dt className="text-xs uppercase tracking-wide text-slate-500">Fastest Recorded</dt>
            <dd className="mt-2 text-2xl font-semibold text-slate-900">
              {fastest?.speed_kmh ?? '--'}
              <span className="ml-1 text-sm font-medium text-slate-500">km/h</span>
            </dd>
            <p className="mt-1 text-xs text-slate-500">Year {fastest?.year ?? '—'}</p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-white/80 p-3">
            <dt className="text-xs uppercase tracking-wide text-slate-500">Average Last Year</dt>
            <dd className="mt-2 text-2xl font-semibold text-slate-900">
              {average?.speed_kmh ?? '--'}
              <span className="ml-1 text-sm font-medium text-slate-500">km/h</span>
            </dd>
            <p className="mt-1 text-xs text-slate-500">Year {average?.year ?? '—'}</p>
          </div>
        </dl>
      )}
      {data?.status === 'unavailable' && (
        <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
          Weather data is currently unavailable.
        </p>
      )}
    </section>
  );
}
