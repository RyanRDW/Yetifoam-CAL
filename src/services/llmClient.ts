export type ChatMessage = { role: "system"|"user"|"assistant"; content: string };

export async function llmCall(params: {
  system?: string;
  messages: ChatMessage[];
  maxTokens?: number;
}): Promise<string> {
  const resp = await fetch("/api/llm", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params)
  });
  const data = await resp.json();
  if (!resp.ok) throw new Error(data?.error?.message || "LLM request failed");
  return data.content as string;
}
