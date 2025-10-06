import OpenAI from "openai";

export type ChatMessage = { role: "system"|"user"|"assistant"; content: string };

export async function chat({
  system,
  messages,
  maxTokens
}: {
  system?: string;
  messages: ChatMessage[];
  maxTokens?: number;
}): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw Object.assign(new Error("Missing OPENAI_API_KEY"), { status: 500, type: "config" });

  const client = new OpenAI({ apiKey });
  const model = process.env.OPENAI_MODEL || "gpt-5";

  const resp = await client.chat.completions.create({
    model,
    messages: [
      ...(system ? [{ role: "system", content: system } as ChatMessage] : []),
      ...messages
    ],
    max_tokens: maxTokens ?? 300,
    temperature: 0.2
  });

  return resp.choices?.[0]?.message?.content ?? "";
}
