import { ComposeInput, ComposeOutput, KBSnippet } from "../types/sales.types";
import { scenarioDetector } from "./scenarioDetector";
import { feedbackProcessor } from "./feedbackProcessor";
import { llmPlanner } from "./llmPlanner";
import { feedbackStore } from "../state/feedbackStore";
import { salesLog } from "../state/salesLog";
import benefitsData from "../data/salesKB/benefits.json";
import comparisonsData from "../data/salesKB/comparisons.json";

export async function composePitch(input: ComposeInput): Promise<ComposeOutput> {
  await feedbackProcessor.initialize();

  const scenario = scenarioDetector.detect(input);
  const relevantFeedback = feedbackProcessor.getRelevantFeedback(scenario);
  const globalOverrides = feedbackStore.getGlobalOverrides();

  const snippets = loadRelevantSnippets(scenario, input);
  const systemPrompt = llmPlanner.buildSystemPrompt(
    snippets,
    input.calc_summary,
    relevantFeedback,
    globalOverrides
  );

  const userMessage = `Customer notes: "${input.customer_notes}"
Generate cascading benefit bullets now.`;

  const llmResponse = await llmPlanner.postLLM({
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }]
  });

  const output = parseLLMResponse(llmResponse, snippets, relevantFeedback);

  await salesLog.append({
    timestamp: new Date().toISOString(),
    inputs_hash: salesLog.hashInput(input),
    customer_notes: input.customer_notes,
    materials: [input.calc_summary.materials.cladding].filter(Boolean),
    options: input.calc_summary.options || [],
    region: `${input.region.suburb}, ${input.region.state}`,
    snippets_used: output.meta.snippets_used,
    feedback_used: output.meta.feedback_used,
    feedback_ids: output.meta.feedback_ids,
    output_preview: (output.benefits || "").substring(0, 200) + "..."
  });

  return output;
}

function loadRelevantSnippets(scenario: any, input: ComposeInput): KBSnippet[] {
  const detectedScenarios = scenario.detected_scenarios || [];
  const materials = [input.calc_summary.materials.cladding].filter(Boolean);
  let relevant: KBSnippet[] = [];

  for (const benefit of (benefitsData as any).benefits) {
    const materialMatch = benefit.material_trigger?.some((m: string) =>
      materials.some(mat => mat.toLowerCase().includes(m.toLowerCase()))
    );
    const scenarioMatch = benefit.scenario_trigger?.some((s: string) =>
      detectedScenarios.some((ds: string) => ds.includes(s) || s.includes(ds))
    );
    if (materialMatch || scenarioMatch) relevant.push(benefit as KBSnippet);
  }

  const competitor = scenarioDetector.detectCompetitor(input.customer_notes);
  if (competitor) {
    for (const comp of (comparisonsData as any).comparisons) {
      if (comp.competitor === competitor || comp.competitor === "generic") {
        relevant.push(comp as unknown as KBSnippet);
      }
    }
  }

  const uniq = new Set<string>();
  relevant = relevant.filter(s => !uniq.has(s.id) && (uniq.add(s.id), true)).slice(0, 20);
  return relevant;
}

function parseLLMResponse(
  response: string,
  snippets: KBSnippet[],
  feedback: any[]
): ComposeOutput {
  try {
    let jsonText = response;
    const m = response.match(/```json\n([\s\S]*?)\n```/);
    if (m) jsonText = m[1];
    const parsed = JSON.parse(jsonText);
    return {
      meta: {
        snippets_used: parsed.meta?.snippets_used || snippets.map(s => s.id),
        feedback_used: !!parsed.meta?.feedback_used || feedback.length > 0,
        feedback_ids: parsed.meta?.feedback_ids || feedback.map(f => f.id),
        fallback_used: !!parsed.meta?.fallback_used
      },
      benefits: parsed.benefits || "",
      comparison: parsed.comparison || "",
      objections: parsed.objections || ""
    };
  } catch {
    return {
      meta: {
        snippets_used: snippets.map(s => s.id),
        feedback_used: feedback.length > 0,
        feedback_ids: feedback.map(f => f.id),
        fallback_used: true
      },
      benefits: response,
      comparison: "",
      objections: ""
    };
  }
}
