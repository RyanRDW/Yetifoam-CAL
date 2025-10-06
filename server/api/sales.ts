import { IncomingMessage, ServerResponse } from "http";
import { composePitch } from "../../src/services/salesComposer";

function readJson(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let buf = ""; req.on("data", c => buf += c);
    req.on("end", () => { try { resolve(buf ? JSON.parse(buf) : {}); } catch (e) { reject(e); } });
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
    const body = await readJson(req);
    const output = await composePitch(body);
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(output));
  } catch (err: any) {
    res.statusCode = err?.status || 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: { type: "internal", message: String(err?.message || "compose failed") } }));
  }
}
