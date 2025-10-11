const API_BASE = "https://api.weather.bom.gov.au/v1";
const DEFAULT_HEADERS = {
  "User-Agent": "weather-au-client/1.0 (https://weather.bom.gov.au/)",
  Referer: "https://weather.bom.gov.au/",
  Origin: "https://weather.bom.gov.au",
  Accept: "application/json"
};

async function getJson(url, headers) {
  const res = await fetch(url, { headers });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`weather-au request failed (${res.status}): ${text}`);
  }
  return res.json();
}

export class WeatherAU {
  constructor(options = {}) {
    this.headers = { ...DEFAULT_HEADERS, ...(options.headers || {}) };
  }

  async locationSearch(query) {
    const trimmed = query?.toString().trim();
    if (!trimmed) return [];
    const url = `${API_BASE}/locations?search=${encodeURIComponent(trimmed)}`;
    const json = await getJson(url, this.headers);
    const data = Array.isArray(json?.data) ? json.data : [];
    return data.map((item) => {
      const geohash = typeof item?.geohash === "string" ? item.geohash : "";
      const id = geohash ? geohash.slice(0, 6) : item?.id ?? trimmed;
      return {
        id,
        name: item?.name ?? trimmed,
        state: item?.state ?? null,
        postcode: item?.postcode ?? null,
        geohash
      };
    });
  }

  async observations(stationId) {
    const id = stationId?.toString().trim();
    if (!id) {
      throw new Error("Station id required for observations");
    }
    const geohash = id.slice(0, 6);
    if (geohash.length !== 6) {
      throw new Error("Invalid station id (requires 6 character geohash)");
    }
    const url = `${API_BASE}/locations/${geohash}/observations`;
    const json = await getJson(url, this.headers);
    const payload = json?.data ?? null;
    const observation = payload
      ? {
          air_temp: payload.temp ?? null,
          wind_spd_kmh: payload.wind?.speed_kilometre ?? null,
          gust_kmh:
            payload.gust?.speed_kilometre ?? payload.max_gust?.speed_kilometre ?? null,
          rel_hum: payload.humidity ?? null
        }
      : null;
    return {
      observations: {
        data: observation ? [observation] : []
      }
    };
  }
}
