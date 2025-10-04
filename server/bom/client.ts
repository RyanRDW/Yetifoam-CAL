import { getCache, setCache } from "./cache.ts";

const endpoint = "https://api.weather.bom.gov.au/v1/locations";

type WindStat = { speed_kmh: number; year: number | null };

export type BomWindStatus = "ok" | "unavailable";

export interface BomWindData {
  suburb: string;
  status: BomWindStatus;
  fastest_recorded: WindStat | null;
  average_last_year: WindStat | null;
  weather_fact: string | null;
}

function normalizeWindStat(value: any): WindStat | null {
  if (!value || typeof value !== "object") return null;
  const speed = Number((value as Record<string, unknown>).speed_kmh);
  const yearRaw = (value as Record<string, unknown>).year;
  const year = typeof yearRaw === "number" && Number.isFinite(yearRaw) ? Math.trunc(yearRaw) : null;
  if (!Number.isFinite(speed) || speed <= 0) return null;
  return { speed_kmh: Math.round(speed), year };
}

function windExposureTakeaway(speed: number): string {
  if (speed >= 120) return "Severe gust zone — reinforce sealing and fixation";
  if (speed >= 95) return "Strong gust exposure — airtight insulation stops drafts";
  if (speed >= 70) return "Seasonal fronts bring notable gusts — foam keeps the envelope tight";
  return "Winds trend moderate — sealing still prevents moisture and draughts";
}

function buildWeatherFact(suburb: string, fastest: WindStat | null, average: WindStat | null): string | null {
  if (!fastest && !average) return null;
  const descriptors: string[] = [];
  if (fastest) {
    descriptors.push(
      `fastest gust ${fastest.speed_kmh} km/h${fastest.year ? ` in ${fastest.year}` : ""}`,
    );
  }
  if (average) {
    descriptors.push(
      `average winds last year ${average.speed_kmh} km/h${average.year ? ` (${average.year})` : ""}`,
    );
  }

  const headline = descriptors.length > 0 ? descriptors.join(", ") : null;
  const guidance = windExposureTakeaway(fastest?.speed_kmh ?? 0);
  return `${suburb} BOM snapshot: ${headline ?? "readings available"}. ${guidance}.`;
}

function normalizeCached(suburb: string, cached: any): BomWindData | null {
  if (!cached || typeof cached !== "object") return null;
  const fastest = normalizeWindStat(cached.fastest_recorded);
  const average = normalizeWindStat(cached.average_last_year);
  const status = cached.status === "unavailable" ? "unavailable" : "ok";
  const fact = typeof cached.weather_fact === "string" ? cached.weather_fact : null;
  return {
    suburb,
    status,
    fastest_recorded: fastest,
    average_last_year: average,
    weather_fact: fact,
  };
}

export async function fetchWindData(rawSuburb: string): Promise<BomWindData> {
  const suburb = rawSuburb?.trim();
  if (!suburb) {
    throw Object.assign(new Error("Suburb is required"), { status: 400, type: "validation" });
  }

  const key = suburb.toLowerCase();
  const cached = normalizeCached(suburb, getCache(key));
  if (cached) return cached;

  const apiKey = process.env.BOM_API_KEY;
  if (!apiKey) {
    throw Object.assign(new Error("Missing BOM_API_KEY"), { status: 500, type: "config" });
  }

  try {
    const url = `${endpoint}/${encodeURIComponent(suburb)}/wind?api_key=${apiKey}`;
    const res = await fetch(url);
    if (!res.ok) {
      throw Object.assign(new Error(`BOM API ${res.status}`), { status: res.status, type: "upstream" });
    }

    const raw = await res.json();
    const fastest = normalizeWindStat(raw?.fastest);
    const average = normalizeWindStat(raw?.average);
    const payload: BomWindData = {
      suburb,
      status: "ok",
      fastest_recorded: fastest,
      average_last_year: average,
      weather_fact: buildWeatherFact(suburb, fastest, average),
    };
    setCache(key, payload);
    return payload;
  } catch (error) {
    const fallback: BomWindData = {
      suburb,
      status: "unavailable",
      fastest_recorded: null,
      average_last_year: null,
      weather_fact: `Weather data unavailable for ${suburb}. Use conservative wind design assumptions.`,
    };
    setCache(key, fallback);
    return fallback;
  }
}
