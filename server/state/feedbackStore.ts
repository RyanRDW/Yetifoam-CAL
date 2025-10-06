import fs from "fs/promises";
import path from "path";
import { FeedbackEntry, GlobalOverride } from "../../src/types/sales.types";

class FeedbackStore {
  private filePath = path.join(process.cwd(), "src", "data", "salesKB", "userFeedback.json");
  private loaded = false;
  private feedback: FeedbackEntry[] = [];
  private overrides: GlobalOverride[] = [];

  async load(): Promise<void> {
    if (this.loaded) return;
    try {
      const raw = await fs.readFile(this.filePath, "utf-8");
      const parsed = JSON.parse(raw);
      this.feedback = (parsed.feedback_entries || []).filter((f: FeedbackEntry) => f.active);
      this.overrides = (parsed.global_overrides || []).filter((o: GlobalOverride) => o.active);
    } catch { this.feedback = []; this.overrides = []; }
    this.loaded = true;
  }
  async reload(): Promise<void> { this.loaded = false; await this.load(); }
  getActive(): FeedbackEntry[] { return this.feedback; }
  getOverrides(): GlobalOverride[] { return this.overrides; }
  async save(feedback: FeedbackEntry[], overrides: GlobalOverride[]): Promise<void> {
    await fs.writeFile(this.filePath, JSON.stringify({
      feedback_entries: feedback, global_overrides: overrides
    }, null, 2), "utf-8");
    await this.reload();
  }
}
export const feedbackStore = new FeedbackStore();
