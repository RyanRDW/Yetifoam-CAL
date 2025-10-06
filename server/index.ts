import { createServer } from "http";
import llmHandler from "./api/llm.ts";
import salesHandler from "./api/sales.ts";

const server = createServer(async (req, res) => {
  try {
    const url = req.url || "/";
    if (url.startsWith("/api/llm")) return llmHandler(req, res);
    if (url.startsWith("/api/sales")) return salesHandler(req, res);
    res.statusCode = 404;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: { type: "not_found", message: "Unknown route" } }));
  } catch (e: any) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: { type: "internal", message: String(e?.message || "server error") } }));
  }
});

const port = process.env.PORT ? Number(process.env.PORT) : 8787;
server.listen(port, () => { console.log(`[server] http://localhost:${port}`); });
