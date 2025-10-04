import { WeatherAU } from "../../vendor/weather-au/index.js";
const weather = new WeatherAU();

export type WeatherResult = {
  status: "ok" | "not_found" | "no_data" | "error";
  suburb?: string;
  temp?: number;
  wind_kph?: number;
  gust_kph?: number;
  humidity?: number;
  fact?: string;
  message?: string;
};

export async function getWeather(suburb: string): Promise<WeatherResult> {
  const query = suburb?.toString().trim();
  if (!query) {
    return { status: "error", message: "Suburb is required" };
  }
  try {
    const stations = await weather.locationSearch(query);
    if (!stations?.length) return { status: "not_found", message: "No station for suburb" };

    const obs = await weather.observations(stations[0].id);
    const w = obs?.observations?.data?.[0];
    if (!w) return { status: "no_data", message: "No weather data" };

    return {
      status: "ok",
      suburb: query,
      temp: w.air_temp,
      wind_kph: w.wind_spd_kmh,
      gust_kph: w.gust_kmh,
      humidity: w.rel_hum,
      fact: `In ${query}, the latest wind gust was ${w.gust_kmh} kph with ${w.rel_hum}% humidity.`
    };
  } catch (err) {
    return { status: "error", message: String(err) };
  }
}
