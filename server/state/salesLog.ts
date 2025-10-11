import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

export interface LogEntry {
  timestamp: string;
  inputs_hash: string;
  customer_notes: string;
  materials: string[];
  options: string[];
  region: string;
  snippets_used: string[];
  feedback_used: boolean;
  feedback_ids: string[];
  weather_used: boolean;
  output_preview: string;
}

class SalesLog {
  private logPath: string;
  constructor() {
    this.logPath = path.join(process.cwd(), "logs", "sales-compositions.json");
  }
  async append(entry: LogEntry): Promise<void> {
    await fs.mkdir(path.dirname(this.logPath), { recursive: true });
    let logs: LogEntry[] = [];
    try { logs = JSON.parse(await fs.readFile(this.logPath, "utf-8")); } catch {}
    logs.push(entry);
    await fs.writeFile(this.logPath, JSON.stringify(logs, null, 2), "utf-8");
  }
  hashInput(input: unknown): string {
    return crypto.createHash("md5").update(JSON.stringify(input)).digest("hex").slice(0, 8);
  }
  async getRecent(limit = 10): Promise<LogEntry[]> {
    try {
      const logs: LogEntry[] = JSON.parse(await fs.readFile(this.logPath, "utf-8"));
      return logs.slice(-limit).reverse();
    } catch { return []; }
  }
}
export const salesLog = new SalesLog();
