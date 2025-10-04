import { WeatherAU } from "weather-au";

const weather = new WeatherAU();

type WeatherSuccess = {
  status: "ok";
  suburb: string;
  temp: number | null;
  wind_kph: number | null;
  gust_kph: number | null;
  humidity: number | null;
  fact: string;
};

type WeatherFailure = {
  status: "not_found" | "no_data" | "error";
  message: string;
  suburb?: string;
};

export type WeatherResponse = WeatherSuccess | WeatherFailure;

export async function getWeather(suburb: string): Promise<WeatherResponse> {
  const query = suburb?.trim();
  if (!query) {
    return { status: "error", message: "Suburb is required" };
  }

  try {
    const stations = await weather.locationSearch(query);
    if (!stations?.length) {
      return { status: "not_found", message: "Suburb not recognised", suburb: query };
    }

    const obs = await weather.observations(stations[0].id);
    const w = obs?.observations?.data?.[0];
    if (!w) {
      return { status: "no_data", message: "No weather data", suburb: query };
    }

    const gust = isFiniteNumber(w.gust_kmh) ? roundNumber(w.gust_kmh) : null;
    const humidity = isFiniteNumber(w.rel_hum) ? roundNumber(w.rel_hum) : null;
    const wind = isFiniteNumber(w.wind_spd_kmh) ? roundNumber(w.wind_spd_kmh) : null;
    const temp = isFiniteNumber(w.air_temp) ? roundNumber(w.air_temp, 1) : null;

    return {
      status: "ok",
      suburb: query,
      temp,
      wind_kph: wind,
      gust_kph: gust,
      humidity,
      fact: buildFact(query, { gust, humidity })
    };
  } catch (err) {
    return { status: "error", message: String(err), suburb: query };
  }
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function roundNumber(value: number, precision = 0): number {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}

function buildFact(
  suburb: string,
  readings: { gust: number | null; humidity: number | null }
): string {
  const gustText =
    readings.gust != null ? `${readings.gust} km/h gusts` : "gust data unavailable";
  const humidityText =
    readings.humidity != null ? `${readings.humidity}% humidity` : "humidity data unavailable";
  return `In ${suburb}, the most recent observation reported ${gustText} and ${humidityText}.`;
}
