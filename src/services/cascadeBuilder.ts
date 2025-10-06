// ==============================================================================
// CASCADE BUILDER
// ==============================================================================

import { KBSnippet } from '../types/sales.types';
import benefitsData from '../data/salesKB/benefits.json';
import cascadesData from '../data/salesKB/cascades.json';

export class CascadeBuilder {
  buildCascade(startSnippetId: string, maxDepth = 5, visited: Set<string> = new Set()): string {
    if (visited.has(startSnippetId) || visited.size >= maxDepth) return '';
    visited.add(startSnippetId);

    const sn = (benefitsData as any).benefits.find((b: any) => b.id === startSnippetId);
    if (!sn) return '';

    let out = `• ${sn.text}`;
    if (sn.competitor_contrast) out += `\n  → ${sn.competitor_contrast}`;

    if (sn.cascade_to && sn.cascade_to.length && visited.size < maxDepth) {
      const next = sn.cascade_to[0];
      const tail = this.buildCascade(next, maxDepth, visited);
      if (tail) out += '\n' + tail.split('\n').map(l => '  ' + l).join('\n');
    }
    return out;
  }

  buildFromTemplate(id: string): string {
    const cas = (cascadesData as any).cascades.find((c: any) => c.id === id);
    if (!cas) return '';
    let out = '';
    for (const step of cas.chain) {
      const indent = '  '.repeat(Math.max(0, step.level - 1));
      out += `${indent}• ${step.text}\n`;
      if (step.comparison) out += `${indent}  → ${step.comparison}\n`;
      if (step.data) out += `${indent}  → ${step.data}\n`;
    }
    return out.trim();
  }
}

export const cascadeBuilder = new CascadeBuilder();
