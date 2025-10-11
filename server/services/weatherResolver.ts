import { Region, WeatherEvent } from "../../src/types/sales.types";

export class WeatherResolver {
  private cache = new Map<string, WeatherEvent>();
  async resolve(region: Region): Promise<WeatherEvent | null> {
    const key = `${region.suburb.toLowerCase()}-${region.state.toLowerCase()}`;
    if (this.cache.has(key)) return this.cache.get(key)!;
    // TODO: integrate BOM adapter when ready. For now, null.
    const ev: WeatherEvent | null = null;
    if (ev) this.cache.set(key, ev);
    return ev;
  }
}
export const weatherResolver = new WeatherResolver();
