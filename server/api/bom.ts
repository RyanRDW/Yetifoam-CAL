import { IncomingMessage, ServerResponse } from "http";
import { fetchWindData } from "../bom/client.js";

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== "POST") {
    res.statusCode = 405;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: { type: "method_not_allowed", message: "POST only" } }));
    return;
  }
  try {
    let body = "";
    req.on("data", (c) => (body += c));
    await new Promise((r) => req.on("end", r));
    const { suburb } = JSON.parse(body || "{}");
    const data = await fetchWindData(suburb);
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(data));
  } catch (e: any) {
    res.statusCode = e?.status || 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: { type: e?.type || "internal", message: e?.message || "BOM error" } }));
  }
}
