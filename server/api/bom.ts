import { IncomingMessage, ServerResponse } from "http";
import { fetchWindData } from "../bom/client.ts";

async function parseJson(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(Object.assign(new Error("Invalid JSON body"), { status: 400, type: "validation" }));
      }
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
    const body = await parseJson(req);
    const suburb = typeof body?.suburb === "string" ? body.suburb : "";
    const data = await fetchWindData(suburb);

    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(data));
  } catch (error: any) {
    const status = error?.status ?? 500;
    res.statusCode = status;
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        error: {
          type: error?.type || (status === 400 ? "validation" : status === 404 ? "not_found" : "internal"),
          message: String(error?.message || "BOM error"),
        },
      }),
    );
  }
}
