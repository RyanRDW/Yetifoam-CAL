import { useEffect, useMemo, useState } from 'react';
import { useLayout } from '../state/LayoutContext';
import type { WeatherStatus, WeatherPayload } from '../state/LayoutContext';

interface WeatherApiResponse {
  status?: WeatherStatus | string;
  suburb?: string;
  temp?: number;
  wind_kph?: number;
  gust_kph?: number;
  humidity?: number;
  fact?: string;
  message?: string;
  error?: string;
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
      const json = (await res.json()) as WeatherApiResponse;
      if (!res.ok) {
        throw new Error(json?.error || 'Weather lookup failed');
      }

      const payload = toWeatherPayload(query, json);
      setError(payload.status === 'ok' ? null : payload.message ?? 'Weather data unavailable');

      dispatch({
        type: 'SET_WEATHER',
        payload: {
          suburb: payload.suburb ?? query,
          lastResult: payload,
          fact: payload.status === 'ok' ? payload.fact : weather.fact,
          lastUpdated: new Date().toISOString(),
        },
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
          fact: weather.fact,
          lastUpdated: weather.lastUpdated,
        },
      });
    } finally {
      setLoading(false);
    }
  }

  const data = weather.lastResult;
  const status = data?.status ?? 'no_data';
  const weatherFact = useMemo(() => weather.fact ?? data?.fact ?? null, [weather.fact, data]);

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
      {status === 'ok' && data && (
        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-700">
          <div className="rounded-xl border border-slate-100 bg-white/80 p-3">
            <dt className="text-xs uppercase tracking-wide text-slate-500">Temperature</dt>
            <dd className="mt-2 text-2xl font-semibold text-slate-900">
              {formatValue(data.temp, '°C')}
            </dd>
            <p className="mt-1 text-xs text-slate-500">Most recent observation</p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-white/80 p-3">
            <dt className="text-xs uppercase tracking-wide text-slate-500">Wind Speed</dt>
            <dd className="mt-2 text-2xl font-semibold text-slate-900">
              {formatValue(data.wind_kph, 'km/h')}
            </dd>
            <p className="mt-1 text-xs text-slate-500">Latest average wind</p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-white/80 p-3">
            <dt className="text-xs uppercase tracking-wide text-slate-500">Wind Gust</dt>
            <dd className="mt-2 text-2xl font-semibold text-slate-900">
              {formatValue(data.gust_kph, 'km/h')}
            </dd>
            <p className="mt-1 text-xs text-slate-500">Most recent gust</p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-white/80 p-3">
            <dt className="text-xs uppercase tracking-wide text-slate-500">Humidity</dt>
            <dd className="mt-2 text-2xl font-semibold text-slate-900">
              {formatValue(data.humidity, '%')}
            </dd>
            <p className="mt-1 text-xs text-slate-500">Relative humidity</p>
          </div>
        </dl>
      )}
      {status !== 'ok' && data?.message && (
        <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
          {data.message}
        </p>
      )}
      {weatherFact && (
        <p className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700">
          {weatherFact}
        </p>
      )}
    </section>
  );
}

function toWeatherPayload(suburb: string, data: WeatherApiResponse): WeatherPayload {
  const status: WeatherStatus =
    data.status === 'ok' || data.status === 'not_found' || data.status === 'no_data'
      ? data.status
      : 'error';
  const safeSuburb = typeof data.suburb === 'string' && data.suburb.trim() ? data.suburb : suburb;
  return {
    status,
    suburb: safeSuburb,
    temp: status === 'ok' ? coerceNumber(data.temp) : null,
    wind_kph: status === 'ok' ? coerceNumber(data.wind_kph) : null,
    gust_kph: status === 'ok' ? coerceNumber(data.gust_kph) : null,
    humidity: status === 'ok' ? coerceNumber(data.humidity) : null,
    fact: typeof data.fact === 'string' ? data.fact : null,
    message: typeof data.message === 'string' ? data.message : null,
  };
}

function coerceNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim()) {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : null;
  }
  return null;
}

function formatValue(value: number | null, suffix: string): string {
  if (value == null) {
    return '--';
  }
  if (suffix === '%' || suffix.startsWith('°')) {
    return `${value}${suffix}`;
  }
  return `${value} ${suffix}`;
}
