export type Role = 'system' | 'user' | 'assistant';

export interface ChatMessage {
  role: Role;
  content: string;
}

export interface LlmCallParams {
  system?: string;
  messages: ChatMessage[];
  maxTokens?: number;
}

interface LlmResponse {
  content?: string;
  error?: {
    type: string;
    message: string;
  };
}

export async function llmCall({ system, messages, maxTokens }: LlmCallParams): Promise<string> {
  const response = await fetch('/api/llm', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ system, messages, maxTokens }),
  });

  let data: LlmResponse;

  try {
    data = (await response.json()) as LlmResponse;
  } catch (error) {
    throw new Error('Failed to parse server response.');
  }

  if (!response.ok || data.error) {
    const message = data?.error?.message || 'LLM request failed.';
    throw new Error(message);
  }

  return data.content ?? '';
}
