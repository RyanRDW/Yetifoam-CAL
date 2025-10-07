import { IncomingMessage, ServerResponse } from "http";
import { rateLimit } from "../middleware/rateLimit.js";
import { planLLM } from "../services/llmPlanner";

function parseJson(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let buf = "";
    req.on("data", (chunk) => { buf += chunk; });
    req.on("end", () => {
      try { resolve(buf ? JSON.parse(buf) : {}); } catch (error) { reject(error); }
    });
    req.on("error", reject);
  });
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== "POST") {
    res.statusCode = 405;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: { type: "method_not_allowed", message: "POST only" } }));
    return;
  }

  try {
    const userId = (req.headers["x-user-id"] as string) || "local";
    rateLimit(userId);

    const body = (await parseJson(req)) as { form?: any; feedback?: any; provider?: 'grok' | 'openai' };
    const payload = await planLLM(body.form, body.feedback, body.provider);

    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(payload));
  } catch (err: any) {
    const status = err?.status || 500;
    const type =
      err?.type ||
      (status === 401 ? "auth" :
       status === 429 ? "rate_limit" :
       "internal");
    res.statusCode = status;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: { type, message: String(err?.message || "LLM error") } }));
  }
}
