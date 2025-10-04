import OpenAI from 'openai';

type Role = 'system' | 'user' | 'assistant';

export interface ChatMessage {
  role: Role;
  content: string;
}

export interface ChatParams {
  system?: string;
  messages?: ChatMessage[];
  maxTokens?: number;
}

export interface ChatStreamParams extends ChatParams {
  onChunk: (chunk: string) => void | Promise<void>;
  signal?: AbortSignal;
}

function resolveMessages(system: string | undefined, messages: ChatMessage[] = []): ChatMessage[] {
  const conversation: ChatMessage[] = [];

  if (system && system.trim().length > 0) {
    conversation.push({ role: 'system', content: system });
  }

  if (messages.length > 0) {
    conversation.push(...messages);
  }

  return conversation;
}

function createClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error('Missing OpenAI API key. Set OPENAI_API_KEY in the environment.');
  }

  return new OpenAI({ apiKey });
}

export async function chat({ system, messages, maxTokens }: ChatParams): Promise<string> {
  const client = createClient();
  const conversation = resolveMessages(system, messages);

  const completion = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-5',
    messages: conversation,
    max_tokens: maxTokens ?? 300,
    temperature: 0.2,
  });

  return completion.choices?.[0]?.message?.content ?? '';
}

export async function chatStream({
  system,
  messages,
  maxTokens,
  onChunk,
  signal,
}: ChatStreamParams): Promise<void> {
  const client = createClient();
  const conversation = resolveMessages(system, messages);

  const stream = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-5',
    messages: conversation,
    max_tokens: maxTokens ?? 300,
    temperature: 0.2,
    stream: true,
    signal,
  });

  for await (const part of stream) {
    const content = part.choices?.[0]?.delta?.content;
    if (content && content.length > 0) {
      await onChunk(content);
    }
  }
}
