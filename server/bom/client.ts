import { getFromCache, setInCache } from './cache';

const REQUEST_FIELDS = ['fastest_recorded', 'average_last_year'] as const;

export interface WindStatistic {
  speed_kmh: number;
  year: number;
}

export interface BomWindData {
  fastest_recorded: WindStatistic;
  average_last_year: WindStatistic;
}

export type BomWindResponse = BomWindData | 'unavailable';

export class BomConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BomConfigurationError';
  }
}

function parseWindStatistic(value: unknown): WindStatistic | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const record = value as Record<string, unknown>;
  const rawSpeed = record.speed_kmh;
  const rawYear = record.year;

  if (rawSpeed === undefined || rawYear === undefined) {
    return null;
  }

  const speed = typeof rawSpeed === 'number' ? rawSpeed : Number(rawSpeed);
  const year = typeof rawYear === 'number' ? rawYear : Number(rawYear);

  if (!Number.isFinite(speed) || !Number.isFinite(year)) {
    return null;
  }

  return {
    speed_kmh: speed,
    year,
  };
}

function normaliseResponse(payload: unknown): BomWindData | null {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const record = payload as Record<string, unknown>;
  const fastestRecorded = parseWindStatistic(record.fastest_recorded);
  const averageLastYear = parseWindStatistic(record.average_last_year);

  if (!fastestRecorded || !averageLastYear) {
    return null;
  }

  return {
    fastest_recorded: fastestRecorded,
    average_last_year: averageLastYear,
  };
}

export async function getBomWindData(suburb: string): Promise<BomWindResponse> {
  if (!suburb || typeof suburb !== 'string' || !suburb.trim()) {
    throw new SyntaxError('`suburb` must be a non-empty string.');
  }

  const trimmedSuburb = suburb.trim();
  const cached = getFromCache<BomWindData>(trimmedSuburb);

  if (cached) {
    return cached;
  }

  const apiKey = process.env.BOM_API_KEY;

  if (!apiKey) {
    throw new BomConfigurationError('Missing BOM_API_KEY environment variable.');
  }

  const endpoint =
    process.env.BOM_API_URL ??
    process.env.BOM_API_ENDPOINT ??
    'https://api.weather.bom.gov.au/v1/wind';

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-API-Key': apiKey,
      },
      body: JSON.stringify({
        suburb: trimmedSuburb,
        data_requested: REQUEST_FIELDS,
      }),
    });

    if (response.status === 401 || response.status === 403) {
      throw new BomConfigurationError('BOM API rejected the provided API key.');
    }

    if (!response.ok) {
      return 'unavailable';
    }

    const payload = await response.json().catch(() => null);

    if (!payload) {
      return 'unavailable';
    }

    const data = normaliseResponse(payload);

    if (!data) {
      return 'unavailable';
    }

    setInCache(trimmedSuburb, data);
    return data;
  } catch (error) {
    if (error instanceof BomConfigurationError || error instanceof SyntaxError) {
      throw error;
    }

    return 'unavailable';
  }
}
