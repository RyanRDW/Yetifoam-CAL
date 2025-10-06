import { ComposeInput, ComposeOutput, KBSnippet } from "../../src/types/sales.types";
import { scenarioDetector } from "../../src/services/scenarioDetector";
import { feedbackProcessor } from "./feedbackProcessor";
import { llmPlanner } from "./llmPlanner";
import { salesLog } from "../state/salesLog";
import benefitsData from "../../src/data/salesKB/benefits.json";
import comparisonsData from "../../src/data/salesKB/comparisons.json";
import { feedbackStore } from "../state/feedbackStore";

export async function composePitchServer(input: ComposeInput): Promise<ComposeOutput> {
  await feedbackProcessor.init();
  const scen = scenarioDetector.detect(input);
  const fb = feedbackProcessor.relevant(scen);
  const overrides = feedbackStore.getOverrides();

  const snippets = pickSnippets(scen, input);
  const system = llmPlanner.buildSystem(snippets, input.calc_summary, fb, overrides);
  const userMsg = `Customer notes: "${input.customer_notes}". Generate cascading benefit bullets now.`;

  const raw = await llmPlanner.complete(system, userMsg, 1400);
  const out = parseLLM(raw, snippets, fb);

  await salesLog.append({
    timestamp: new Date().toISOString(),
    inputs_hash: salesLog.hashInput(input),
    customer_notes: input.customer_notes,
    materials: [input.calc_summary.materials.cladding].filter(Boolean),
    options: input.calc_summary.options || [],
    region: `${input.region.suburb}, ${input.region.state}`,
    snippets_used: out.meta.snippets_used,
    feedback_used: out.meta.feedback_used,
    feedback_ids: out.meta.feedback_ids,
    output_preview: (out.benefits || "").slice(0, 200) + "..."
  });

  return out;
}

function pickSnippets(scen: any, input: ComposeInput): KBSnippet[] {
  const detected = scen.detected_scenarios || [];
  const mats = [input.calc_summary.materials.cladding].filter(Boolean);
  const benefits = (benefitsData as any).benefits as KBSnippet[];
  const comps = (comparisonsData as any).comparisons as any[];

  let rel: KBSnippet[] = [];
  for (const b of benefits) {
    const m = (b.material_trigger || []).some(mt => mats.some(x => (x||"").toLowerCase().includes(mt.toLowerCase())));
    const s = (b.scenario_trigger || []).some(st => detected.some(d => d.includes(st) || st.includes(d)));
    if (m || s) rel.push(b);
  }
  const compName = scenarioDetector.detectCompetitor(input.customer_notes);
  if (compName) {
    for (const c of comps) if (c.competitor === compName || c.competitor === "generic") rel.push(c as any as KBSnippet);
  }
  const seen = new Set<string>();
  return rel.filter(x => !seen.has(x.id) && seen.add(x.id)).slice(0, 20);
}

function parseLLM(raw: string, snippets: KBSnippet[], fb: any[]): ComposeOutput {
  try {
    let txt = raw;
    const m = raw.match(/```json\s*([\s\S]*?)```/); if (m) txt = m[1];
    const j = JSON.parse(txt);
    return {
      meta: {
        snippets_used: j.meta?.snippets_used || snippets.map(s => s.id),
        feedback_used: !!fb.length,
        feedback_ids: fb.map((x: any) => x.id),
        fallback_used: !!j.meta?.fallback_used
      },
      benefits: j.benefits || "",
      comparison: j.comparison || "",
      objections: j.objections || ""
    };
  } catch {
    return {
      meta: {
        snippets_used: snippets.map(s => s.id),
        feedback_used: !!fb.length,
        feedback_ids: fb.map((x: any) => x.id),
        fallback_used: true
      },
      benefits: raw,
      comparison: "",
      objections: ""
    };
  }
}
