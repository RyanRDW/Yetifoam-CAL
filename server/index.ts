import { createServer } from "http";

// If a route handler exists at ./api/llm.(ts|js), import it dynamically.
async function route(req: any, res: any) {
  try {
    if (req.url?.startsWith("/api/llm")) {
      const mod = await import("./api/llm.ts").catch(async () => await import("./api/llm.js"));
      return mod.default(req, res);
    }

    if (req.url?.startsWith("/api/bom")) {
      const mod = await import("./api/bom.ts").catch(async () => await import("./api/bom.js"));
      return mod.default(req, res);
    }

    res.statusCode = 404;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: { type: "not_found", message: "Unknown route" } }));
  } catch (e: any) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: { type: "internal", message: e?.message || "Server error" } }));
  }
}

const server = createServer(route);
const port = Number(process.env.PORT || 8787);
server.listen(port, () => {
  console.log(`[server] http://localhost:${port}`);
});
