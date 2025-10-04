import { createServer } from "http";
import llmHandler from "./api/llm.ts";

const server = createServer(async (req, res) => {
  if (req.url?.startsWith("/api/llm")) return llmHandler(req, res);
  res.statusCode = 404;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify({ error: { type: "not_found", message: "Unknown route" } }));
});

const port = process.env.PORT ? Number(process.env.PORT) : 8787;
server.listen(port, () => {
  console.log(`[server] listening on http://localhost:${port}`);
});
