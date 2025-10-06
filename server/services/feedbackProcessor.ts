import crypto from "crypto";
import {
  FeedbackEntry, ComposeInput, ComposeOutput, ScenarioContext
} from "../../src/types/sales.types";
import { feedbackStore } from "../state/feedbackStore";
import { scenarioDetector } from "../../src/services/scenarioDetector";

export class FeedbackProcessor {
  async init() { await feedbackStore.load(); }
  relevant(ctx: ScenarioContext): FeedbackEntry[] {
    const all = feedbackStore.getActive();
    const scen = ctx.detected_scenarios || [];
    return all.filter(f =>
      f.applies_to_scenarios.some(s => scen.includes(s)) ||
      f.scenario_context.materials.some(m => ctx.materials.includes(m)) ||
      this.fuzzy(f.scenario_context.customer_notes, ctx.customer_notes)
    ).sort((a,b)=>this.rank(b.priority)-this.rank(a.priority));
  }
  private rank(p: FeedbackEntry["priority"]) {
    return ({critical:4,high:3,medium:2,low:1} as const)[p];
  }
  async save(input: ComposeInput, output: ComposeOutput, userFeedback: string): Promise<FeedbackEntry> {
    const scen = scenarioDetector.detect(input);
    const rules = this.extractRules(userFeedback);
    const prio = this.priority(userFeedback);
    const entry: FeedbackEntry = {
      id: `FB${Date.now().toString().slice(-6)}`,
      timestamp: new Date().toISOString(),
      input_hash: this.hash({ notes: input.customer_notes, materials: input.calc_summary.materials, options: input.calc_summary.options }),
      scenario_context: { customer_notes: input.customer_notes, materials: [input.calc_summary.materials.cladding].filter(Boolean), options: input.calc_summary.options || [] },
      generated_output_snippet: (output.benefits || "").slice(0, 120) + "...",
      user_feedback: userFeedback,
      applied_rules: rules,
      priority: prio,
      active: true,
      applies_to_scenarios: scen.detected_scenarios || []
    };
    const fb = feedbackStore.getActive(); const ov = feedbackStore.getOverrides();
    fb.push(entry);
    await feedbackStore.save(fb, ov);
    return entry;
  }
  private extractRules(text: string): string[] {
    const t = text.toLowerCase(); const r: string[] = [];
    if (/(simpler|too technical|simple language)/.test(t)) r.push("Use simpler language; avoid jargon");
    if (/(shorter|too long|concise)/.test(t)) r.push("Reduce length; be more concise");
    if (/(more data|numbers|statistics)/.test(t)) r.push("Include specific data points and percentages");
    if (/(competitor|comparison)/.test(t)) r.push("Increase competitor comparison emphasis");
    if (/(cascade|depth|levels).*(less|shorter)/.test(t)) r.push("Reduce cascade depth (max 3)");
    else if (/(cascade|depth|levels)/.test(t)) r.push("Increase cascade depth (5+)");
    const lead = text.match(/lead with\s+['"]?([^'"]+)['"]?/i); if (lead) r.push(`Lead with: ${lead[1]}`);
    if (/(forever|25 years|longevity)/.test(t)) r.push("Emphasize 25-year longevity in first 2 bullets");
    if (/(4 product|multi-product|single product)/.test(t)) r.push("Lead with 4-products vs 1-product contrast");
    if (!r.length) r.push(text);
    return r;
  }
  private priority(t: string): FeedbackEntry["priority"] {
    const s = t.toLowerCase();
    if (/(never|always|critical|must)/.test(s)) return "critical";
    if (/(important|should|need)/.test(s)) return "high";
    if (/(prefer|better)/.test(s)) return "medium";
    return "medium";
  }
  private fuzzy(a: string, b: string): boolean {
    const A = a.toLowerCase().split(/\s+/), B = b.toLowerCase().split(/\s+/);
    const common = A.filter(w => B.includes(w));
    return A.length ? (common.length / A.length) > 0.3 : false;
  }
  private hash(x: unknown) { return crypto.createHash("md5").update(JSON.stringify(x)).digest("hex").slice(0,8); }
}
export const feedbackProcessor = new FeedbackProcessor();
