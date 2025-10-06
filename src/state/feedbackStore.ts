// ==============================================================================
// FEEDBACK STORE (Browser-safe)
// Persist inside localStorage yf:v1:ui.salesFeedback
// ==============================================================================

// [iso-storage:start]
import { isoStorage } from '../lib/isoStorage';
// [iso-storage:end]

import { FeedbackEntry, GlobalOverride } from '../types/sales.types';

const UI_KEY = "yf:v1:ui";
const SLOT = "salesFeedback";

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

function readStore(): { feedback_entries: FeedbackEntry[]; global_overrides: GlobalOverride[] } {
  const ui = readUi();
  const node = ui[SLOT] || {};
  return {
    feedback_entries: Array.isArray(node.feedback_entries) ? node.feedback_entries : [],
    global_overrides: Array.isArray(node.global_overrides) ? node.global_overrides : []
  };
}

function writeStore(feedback_entries: FeedbackEntry[], global_overrides: GlobalOverride[]) {
  const ui = readUi();
  ui[SLOT] = { feedback_entries, global_overrides };
  writeUi(ui);
}

class FeedbackStore {
  private activeFeedback: FeedbackEntry[] = [];
  private globalOverrides: GlobalOverride[] = [];
  private loaded = false;

  async load(): Promise<void> {
    if (this.loaded) return;
    const data = readStore();
    this.activeFeedback = (data.feedback_entries || []).filter(f => f.active);
    this.globalOverrides = (data.global_overrides || []).filter(o => o.active);
    this.loaded = true;
  }

  async reload(): Promise<void> {
    this.loaded = false;
    await this.load();
  }

  getActiveFeedback(): FeedbackEntry[] {
    return this.activeFeedback;
  }

  getGlobalOverrides(): GlobalOverride[] {
    return this.globalOverrides;
  }

  async save(feedback: FeedbackEntry[], overrides: GlobalOverride[]): Promise<void> {
    writeStore(feedback, overrides);
    await this.reload();
  }
}

export const feedbackStore = new FeedbackStore();
