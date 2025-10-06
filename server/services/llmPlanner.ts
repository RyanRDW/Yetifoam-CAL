import { KBSnippet, CalcSummary, FeedbackEntry, GlobalOverride } from "../../src/types/sales.types";
import { chat } from "../llm/openai";
import salesRules from "../../src/state/salesRules";

export class LLMPlanner {
  buildSystem(
    snippets: KBSnippet[],
    calc: CalcSummary,
    fb: FeedbackEntry[],
    overrides: GlobalOverride[]
  ): string {
    let s = `You are the YetiFoam Sales Benefits Composer.\n\n=== CRITICAL OVERRIDES (HIGHEST PRIORITY) ===\n`;
    if (fb.length) {
      s += `\n**USER FEEDBACK OVERRIDES:**\n`;
      for (const f of fb) {
        s += `- [${f.priority.toUpperCase()}] ${f.user_feedback}\n`;
      }
    }
    if (overrides.length) {
      s += `\n**GLOBAL OVERRIDES:**\n`;
      for (const o of overrides) s += `- [${o.priority.toUpperCase()}] ${o.rule}\n`;
    }
    s += `\n=== END CRITICAL OVERRIDES ===\n\nMISSION: Produce benefit bullets with embedded competitor comparisons. No email/SMS/call drafts.\n\nPRIMARY KNOWLEDGE BASE:\n\n`;
    for (const sn of snippets) {
      s += `[${sn.id}] ${sn.text}\n`;
      if (sn.competitor_contrast) s += `   Comparison: ${sn.competitor_contrast}\n`;
      s += `\n`;
    }
    s += `\nCUSTOMER SHED DETAILS:\n- Materials: ${calc.materials.cladding} ; ${calc.materials.members.join(", ")}\n- Options: ${calc.options.join(", ") || "full shed"}\n- Dimensions: ${calc.dimensions.L}x${calc.dimensions.W}x${calc.dimensions.H} m\n\n`;
    s += `RULES:\n1) Apply feedback overrides first. 2) Cascading chains 3–6 levels. 3) Embed competitor comparisons. 4) Mention thermal bridging / structural / condensation triad. 5) 4-products vs 1-product where relevant. 6) Bullets only. No opening/closing. 7) Return JSON exactly as below. 8) DO NOT include email/SMS/call fields.\n\nOUTPUT FORMAT (JSON ONLY):\n{\n  "meta": {\n    "snippets_used": ["BEN001"],\n    "feedback_used": ${fb.length > 0},\n    "feedback_ids": [${fb.map(f => `"${f.id}"`).join(", ")}],\n    "fallback_used": false\n  },\n  "benefits": "<markdown bullets>",\n  "comparison": "<competitor analysis bullets>",\n  "objections": "<rebuttal bullets>"\n}\n\nTONE: ${salesRules.tone.style}\nFORBIDDEN: ${salesRules.tone.forbidden.join(", ")}\nBEGIN.`;
    return s;
  }

  async complete(system: string, userContent: string, maxTokens = 1200): Promise<string> {
    return await chat({
      system,
      messages: [{ role: "user", content: userContent }],
      maxTokens
    });
  }
}
export const llmPlanner = new LLMPlanner();
