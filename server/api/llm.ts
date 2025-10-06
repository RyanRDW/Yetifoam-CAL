import { chat, ChatMessage } from "../llm/openai.js";
import { rateLimit } from "../middleware/rateLimit.js";
import { IncomingMessage, ServerResponse } from "http";

function parseJson(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let buf = "";
    req.on("data", (c) => (buf += c));
    req.on("end", () => {
      try { resolve(buf ? JSON.parse(buf) : {}); } catch (e) { reject(e); }
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

    const body = (await parseJson(req)) as {
      system?: string;
      messages: ChatMessage[];
      maxTokens?: number;
    };

    const content = await chat({
      system: body.system,
      messages: body.messages || [],
      maxTokens: body.maxTokens
    });

    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ content }));
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
