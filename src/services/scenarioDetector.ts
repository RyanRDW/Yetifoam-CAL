// ==============================================================================
// SCENARIO DETECTOR
// ==============================================================================

import { ComposeInput, ScenarioContext } from '../types/sales.types';

export class ScenarioDetector {
  detect(input: ComposeInput): ScenarioContext {
    const notes = (input.customer_notes || '').toLowerCase();
    const materials = [input.calc_summary.materials.cladding, ...input.calc_summary.materials.members].filter(Boolean);
    const options = input.calc_summary.options || [];
    const scenarios: string[] = [];

    if (!notes.trim()) scenarios.push('no_notes_default');
    if (/(price|expensive|budget|cost)/.test(notes)) scenarios.push('price_objection');
    if (/foilboard/.test(notes)) scenarios.push('foilboard_comparison');
    if (/(fibreglass|batts?\b)/.test(notes)) scenarios.push('fibreglass_comparison');
    if (/(anti[- ]?con|anticon)/.test(notes)) scenarios.push('anticon_comparison');
    if (/(hot|summer|heat|workshop)/.test(notes)) scenarios.push('hot_workshop');
    if (/(condensation|moisture|damp)/.test(notes)) scenarios.push('condensation_concern');
    if (/(leak|water|rain)/.test(notes)) scenarios.push('leak_concern');
    if (/(wind|storm|structural|strength)/.test(notes)) scenarios.push('structural_concern');
    if (/\broof\b/.test(notes) && !/\bwall/.test(notes)) scenarios.push('roof_only');
    if (/\bwall/.test(notes) && !/\broof\b/.test(notes)) scenarios.push('walls_only');
    if (/partial/.test(notes) || (options.length === 1 && (options[0] === 'roof' || options[0] === 'walls'))) scenarios.push('partial_treatment');
    if (/(durability|long term|forever|lifetime)/.test(notes)) scenarios.push('longevity_concern');
    if (/(competitor|comparing|other option)/.test(notes)) scenarios.push('competitor_generic');

    return { customer_notes: input.customer_notes, materials, options, detected_scenarios: scenarios };
  }

  detectCompetitor(notes: string): string | null {
    const n = (notes || '').toLowerCase();
    if (n.includes('foilboard')) return 'foilboard';
    if (n.includes('anti-con') || n.includes('anticon')) return 'anti_con_blanket';
    if (n.includes('fibreglass') || /\bbatts?\b/.test(n)) return 'fibreglass_batts';
    return null;
  }
}

export const scenarioDetector = new ScenarioDetector();
