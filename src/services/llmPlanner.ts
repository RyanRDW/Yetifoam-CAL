import {
  KBSnippet,
  CalcSummary,
  FeedbackEntry,
  GlobalOverride,
} from '../types/sales.types';
import { salesRules } from '../state/salesRules';

interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}
interface LLMRequest {
  system: string;
  messages: LLMMessage[];
}

export class LLMPlanner {
  buildSystemPrompt(
    snippets: KBSnippet[],
    calcSummary: CalcSummary,
    relevantFeedback: FeedbackEntry[],
    globalOverrides: GlobalOverride[]
  ): string {
    let prompt = `You are the YetiFoam Sales Benefits Composer.

=== CRITICAL OVERRIDES (HIGHEST PRIORITY) ===
`;
    if (relevantFeedback.length > 0) {
      prompt += `\n**USER FEEDBACK (APPLIES FIRST, OVERRIDES ALL OTHER RULES):**\n`;
      for (const fb of relevantFeedback) {
        prompt += `\nFeedback ID: ${fb.id} | Priority: ${fb.priority.toUpperCase()} | Date: ${fb.timestamp}\n`;
        prompt += `Context: ${JSON.stringify(fb.scenario_context)}\n`;
        prompt += `User said: "${fb.user_feedback}"\n`;
        prompt += `**RULES TO APPLY:**\n`;
        fb.applied_rules.forEach(rule => { prompt += `- ${rule}\n`; });
      }
    }
    if (globalOverrides.length > 0) {
      prompt += `\n**GLOBAL OVERRIDES:**\n`;
      for (const o of globalOverrides) prompt += `- [${o.priority.toUpperCase()}] ${o.rule}\n`;
    }
    prompt += `\n=== END CRITICAL OVERRIDES ===\n\n`;

    prompt += `MISSION:
Transform customer inputs into cascading benefit bullets with embedded competitor comparisons.

PRIMARY KNOWLEDGE BASE:\n\n`;
    for (const s of snippets) {
      prompt += `[${s.id}] ${s.text}\n`;
      if ((s as any).competitor_contrast) prompt += `   Comparison: ${(s as any).competitor_contrast}\n`;
      prompt += `\n`;
    }

    prompt += `\nCUSTOMER SHED DETAILS:
- Materials: ${calcSummary.materials.cladding} cladding, ${calcSummary.materials.members.join(', ')} framing
- Options: ${calcSummary.options.join(', ') || 'full shed'}
- Dimensions: ${calcSummary.dimensions.L}m x ${calcSummary.dimensions.W}m x ${calcSummary.dimensions.H}m\n\n`;

    prompt += `RULES:
1. user_feedback (HIGHEST) first
2. Detect scenario holistically
3. Cascades depth 3–6, include competitor comparisons
4. Emphasize thermal-bridging / structural / condensation trio
5. Highlight 4-product vs 1-product gap
6. Bullets only; no intro/CTA
7. Return JSON payload with meta + variants.

OUTPUT FORMAT:
\`\`\`json
{
  "meta": {
    "snippets_used": ["BEN001"],
    "feedback_used": ${relevantFeedback.length > 0},
    "feedback_ids": [${relevantFeedback.map(f => `"${f.id}"`).join(', ')}],
    "fallback_used": false
  },
  "benefits": "<markdown bullets>",
  "comparison": "<competitor analysis>",
  "objections": "<rebuttal points>",
  "closing": "",
  "variants": { "sms": "", "email": "", "call": "" }
}
\`\`\`

TONE: ${salesRules.tone.style}
FORBIDDEN: ${salesRules.tone.forbidden.join(', ')}
BEGIN COMPOSITION.`;
    return prompt;
  }

  async postLLM(request: LLMRequest): Promise<string> {
    try {
      const port = process.env.PORT ? String(process.env.PORT) : "8787";
      const base = process.env.API_BASE || `http://localhost:${port}`;
      const response = await fetch(`${base}/api/llm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system: request.system,
          messages: request.messages
        })
      });
      if (!response.ok) throw new Error(`LLM API failed: ${response.status} ${response.statusText}`);
      const data = await response.json();
      return (
        data?.content ??
        data?.choices?.[0]?.message?.content ??
        data?.messages?.[0]?.content ??
        ""
      );
    } catch (error) {
      console.error("LLM API error:", error);
      throw error;
    }
  }
}

export const llmPlanner = new LLMPlanner();
