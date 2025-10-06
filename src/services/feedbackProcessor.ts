// ==============================================================================
// FEEDBACK PROCESSOR (Browser-safe)
// Extract rules, persist via FeedbackStore (localStorage-backed)
// ==============================================================================

import {
  FeedbackEntry,
  ComposeInput,
  ComposeOutput,
  ScenarioContext
} from '../types/sales.types';
  import { feedbackStore } from '../state/feedbackStore';
import { scenarioDetector } from './scenarioDetector';

function hash8(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h).toString(16).slice(0, 8);
}

export class FeedbackProcessor {
  async initialize(): Promise<void> {
    await feedbackStore.load();
  }

  getRelevantFeedback(context: ScenarioContext): FeedbackEntry[] {
    const all = feedbackStore.getActiveFeedback();
    const detected = context.detected_scenarios || [];

    return all
      .filter(fb => {
        const scenarioMatch = fb.applies_to_scenarios.some(s => detected.includes(s));
        const materialMatch = fb.scenario_context.materials.some(m => context.materials.includes(m));
        const notesMatch = this.fuzzyMatchNotes(fb.scenario_context.customer_notes, context.customer_notes);
        return scenarioMatch || materialMatch || notesMatch;
      })
      .sort((a, b) => {
        const order: any = { critical: 4, high: 3, medium: 2, low: 1 };
        return (order[b.priority] || 0) - (order[a.priority] || 0);
      });
  }

  async saveFeedback(input: ComposeInput, output: ComposeOutput, userFeedback: string): Promise<FeedbackEntry> {
    const scenario = scenarioDetector.detect(input);
    const extractedRules = this.extractRules(userFeedback);
    const priority = this.determinePriority(userFeedback);

    const newEntry: FeedbackEntry = {
      id: `FB${Date.now().toString().slice(-6)}`,
      timestamp: new Date().toISOString(),
      input_hash: hash8(JSON.stringify({ notes: input.customer_notes, m: input.calc_summary.materials, o: input.calc_summary.options })),
      scenario_context: {
        customer_notes: input.customer_notes,
        materials: [input.calc_summary.materials.cladding].filter(Boolean),
        options: input.calc_summary.options || []
      },
      generated_output_snippet: (output.benefits || "").substring(0, 100) + "...",
      user_feedback: userFeedback,
      applied_rules: extractedRules,
      priority,
      active: true,
      applies_to_scenarios: scenario.detected_scenarios || []
    };

    const currentFeedback = feedbackStore.getActiveFeedback();
    const currentOverrides = feedbackStore.getGlobalOverrides();
    currentFeedback.push(newEntry);
    await feedbackStore.save(currentFeedback, currentOverrides);
    return newEntry;
  }

  private extractRules(feedback: string): string[] {
    const rules: string[] = [];
    const lower = feedback.toLowerCase();

    if (/(simpler|simple language|too technical)/.test(lower)) rules.push('Use simpler language, avoid technical jargon');
    if (/(shorter|too long|concise)/.test(lower)) rules.push('Reduce output length, be more concise');
    if (/(more data|numbers|statistics)/.test(lower)) rules.push('Include more specific data points and percentages');
    if (/(competitor|comparison)/.test(lower)) rules.push('Increase competitor comparison emphasis');

    if (/cascade|depth|levels/.test(lower)) {
      if (/(less|shorter)/.test(lower)) rules.push('Reduce cascade depth (max 3 levels)');
      else rules.push('Increase cascade depth (5+ levels)');
    }

    const lead = feedback.match(/lead with\s+['"]?([^'"]+)['"]?/i);
    if (lead) rules.push(`Lead all outputs with: ${lead[1]}`);

    if (/(always|never)/.test(lower)) rules.push(feedback);
    if (/(forever|25 years|longevity)/.test(lower)) rules.push('Emphasize longevity and "lasts forever" angle in first 2 bullets');
    if (/(4 product|multi-product|single product)/.test(lower)) rules.push('Lead with 4-product vs 1-product comparison');

    return rules.length ? rules : [feedback];
  }

  private determinePriority(feedback: string): 'critical' | 'high' | 'medium' | 'low' {
    const lower = feedback.toLowerCase();
    if (/(never|always|critical|must)/.test(lower)) return 'critical';
    if (/(important|should|need)/.test(lower)) return 'high';
    if (/(prefer|better)/.test(lower)) return 'medium';
    return 'medium';
  }

  private fuzzyMatchNotes(a: string, b: string): boolean {
    const A = a.toLowerCase().split(/\s+/).filter(Boolean);
    const B = b.toLowerCase().split(/\s+/).filter(Boolean);
    if (!A.length || !B.length) return false;
    const common = A.filter(w => B.includes(w)).length;
    return common / A.length > 0.3;
  }

  async toggleFeedback(feedbackId: string, active: boolean): Promise<void> {
    const all = feedbackStore.getActiveFeedback();
    const item = all.find(f => f.id === feedbackId);
    if (item) {
      item.active = active;
      const overrides = feedbackStore.getGlobalOverrides();
      await feedbackStore.save(all, overrides);
    }
  }
}

export const feedbackProcessor = new FeedbackProcessor();
