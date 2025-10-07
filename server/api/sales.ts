import { IncomingMessage, ServerResponse } from "http";
import { composeSales } from "../services/salesComposer";

function readJson(req: IncomingMessage): Promise<any> {
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
    const body = (await readJson(req)) as { form?: any; feedback?: any; provider?: 'grok' | 'openai' };
    const output = await composeSales(body.form, body.feedback, body.provider);

    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(output));
  } catch (err: any) {
    res.statusCode = err?.status || 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: { type: "internal", message: String(err?.message || "compose failed") } }));
  }
}
