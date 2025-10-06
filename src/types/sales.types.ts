// Minimal types used by Sales Composer (trimmed to essentials)
export interface CalcSummary {
  dimensions: { L: number; W: number; H: number; };
  areas: { roof?: number; walls?: number; floor?: number; };
  materials: { cladding: string; members: string[]; };
  options: string[];
}
export interface Region { suburb: string; state: string; }
export interface ComposeInput { customer_notes: string; calc_summary: CalcSummary; region: Region; }
export interface ComposeOutput {
  meta: {
    snippets_used: string[];
    feedback_used: boolean;
    feedback_ids: string[];
    fallback_used: boolean;
  };
  benefits: string;
  comparison: string;
  objections: string;
}
export interface KBSnippet {
  id: string; topic: string;
  material_trigger?: string[]; scenario_trigger?: string[];
  text: string; cascade_to?: string[]; competitor_contrast?: string;
  data_source?: string; tags: string[];
}
export interface FeedbackEntry {
  id: string; timestamp: string; input_hash: string;
  scenario_context: { customer_notes: string; materials: string[]; options: string[]; };
  generated_output_snippet: string; user_feedback: string; applied_rules: string[];
  priority: 'critical'|'high'|'medium'|'low'; active: boolean; applies_to_scenarios: string[];
}
export interface GlobalOverride { rule: string; priority: 'critical'|'high'|'medium'; active: boolean; }
export interface ScenarioContext { customer_notes: string; materials: string[]; options: string[]; detected_scenarios?: string[]; }
