import { WeatherAU } from "../../vendor/weather-au/index.js";

const weather = new WeatherAU();

type WeatherResponse = {
  status: "ok" | "not_found" | "no_data" | "error";
  suburb?: string;
  temp?: number | null;
  wind_kph?: number | null;
  gust_kph?: number | null;
  humidity?: number | null;
  fact?: string | null;
  message?: string;
};

export async function getWeather(suburb: string): Promise<WeatherResponse> {
  const query = suburb?.trim();
  if (!query) {
    return { status: "error", message: "Suburb is required" };
  }

  try {
    const stations = await weather.locationSearch(query);
    if (!stations?.length) {
      return { status: "not_found", message: "No station for suburb", suburb: query };
    }

    const obs = await weather.observations(stations[0].id);
    const w = obs?.observations?.data?.[0];
    if (!w) {
      return { status: "no_data", message: "No weather data", suburb: query };
    }

    return {
      status: "ok",
      suburb: query,
      temp: coerceNumber(w.air_temp),
      wind_kph: coerceNumber(w.wind_spd_kmh),
      gust_kph: coerceNumber(w.gust_kmh),
      humidity: coerceNumber(w.rel_hum),
      fact:
        w.gust_kmh != null && w.rel_hum != null
          ? `In ${query}, the latest wind gust was ${w.gust_kmh} kph with ${w.rel_hum}% humidity.`
          : `In ${query}, the latest observation is available.`
    };
  } catch (err) {
    return { status: "error", message: String(err), suburb: query };
  }
}

function coerceNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}
