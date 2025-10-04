import { getCache, setCache } from "./cache.js";
const endpoint = "https://api.weather.bom.gov.au/v1/locations";

export async function fetchWindData(suburb: string) {
  const key = suburb.toLowerCase();
  const cached = getCache(key);
  if (cached) return cached;
  const apiKey = process.env.BOM_API_KEY;
  if (!apiKey) throw Object.assign(new Error("Missing BOM_API_KEY"), { status: 500, type: "config" });
  try {
    const url = `${endpoint}/${encodeURIComponent(suburb)}/wind?api_key=${apiKey}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`BOM API ${res.status}`);
    const raw = await res.json();
    const data = {
      fastest_recorded: { speed_kmh: raw.fastest?.speed_kmh ?? 0, year: raw.fastest?.year ?? 0 },
      average_last_year: { speed_kmh: raw.average?.speed_kmh ?? 0, year: raw.average?.year ?? 0 }
    };
    setCache(key, data);
    return data;
  } catch {
    const data = { status: "unavailable" };
    setCache(key, data);
    return data;
  }
}
