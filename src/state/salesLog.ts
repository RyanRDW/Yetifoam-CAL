// ==============================================================================
// SALES LOG (Browser-safe)
// Persist to localStorage under yf:v1:ui.salesLog
// ==============================================================================

// [iso-storage:start]
import { isoStorage } from '../lib/isoStorage';
// [iso-storage:end]

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
  output_preview: string;
}

const UI_KEY = "yf:v1:ui";
const SLOT = "salesLog";

function readUi(): any {
  try {
    // [iso-storage:start]
    const raw = isoStorage.getItem(UI_KEY);
    // [iso-storage:end]
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeUi(obj: any) {
  try {
    // [iso-storage:start]
    isoStorage.setItem(UI_KEY, JSON.stringify(obj));
    // [iso-storage:end]
  } catch {}
}

function readLogs(): LogEntry[] {
  const ui = readUi();
  return Array.isArray(ui[SLOT]) ? ui[SLOT] : [];
}

function writeLogs(logs: LogEntry[]) {
  const ui = readUi();
  ui[SLOT] = logs;
  writeUi(ui);
}

function hash8(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h).toString(16).slice(0, 8);
}

class SalesLog {
  async append(entry: LogEntry): Promise<void> {
    const logs = readLogs();
    logs.push(entry);
    writeLogs(logs);
  }

  hashInput(input: any): string {
    return hash8(JSON.stringify(input));
  }

  async getRecentLogs(limit = 10): Promise<LogEntry[]> {
    const logs = readLogs();
    return logs.slice(-limit).reverse();
  }
}

export const salesLog = new SalesLog();
