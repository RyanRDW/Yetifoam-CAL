import { salesRules } from '../../src/state/salesRules';

type Provider = 'grok' | 'openai';

type GrokResponse = {
  choices?: Array<{ message?: { content?: string } }>;
};

type OpenAIResponse = GrokResponse;

const fallbackResponse = {
  variants: [
    'Standard foam application for this size.',
    'Premium option with extra coverage.'
  ],
  closing: "Let's discuss the best fit for your shed."
};

const GROK_API_KEY = process.env.GROK_API_KEY || process.env.XAI_API_KEY ;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const GROK_MODEL = 'grok-4-latest';
const TEMPERATURE = 0.7;

export async function planLLM(
  form: unknown = {},
  feedback: unknown = {},
  preferredProvider: Provider = 'grok'
) {
  const messages = [
    {
      role: 'system' as const,
      content: `You are a sales advisor for YetiFoam shed insulation. Use these rules: ${JSON.stringify(salesRules)}. Generate 2-3 variants and a closing tailored to the provided configuration and feedback.`
    },
    {
      role: 'user' as const,
      content: `Configuration: ${JSON.stringify(form || {})}\nFeedback: ${JSON.stringify(feedback || {})}\nReturn JSON only (no markdown fences) shaped as { "variants": ["Variant 1"], "closing": "Close" }.\nEach variants entry must be a plain string without embedded JSON or objects.\nThe closing must be a single plain string.`
    }
  ];

  const providers: Provider[] = preferredProvider === 'openai' ? ['openai', 'grok'] : ['grok', 'openai'];
  const hasAnyProvider = Boolean(GROK_API_KEY) || Boolean(OPENAI_API_KEY);

  if (!hasAnyProvider) {
    console.warn('planLLM: no LLM provider configured; returning fallback response.');
    return fallbackResponse;
  }

  for (const provider of providers) {
    try {
      if (provider === 'grok') {
        if (!GROK_API_KEY) continue;
        const completion = await callGrok(messages);
        const responseContent = completion.choices?.[0]?.message?.content ?? '';
        const parsed = parseResponse(responseContent);
        if (!parsed) throw new Error('Invalid Grok response payload');
        return buildResult(parsed);
      }

      if (provider === 'openai') {
        if (!OPENAI_API_KEY) continue;
        const completion = await callOpenAI(messages);
        const responseContent = completion.choices?.[0]?.message?.content ?? '';
        const parsed = parseResponse(responseContent);
        if (!parsed) throw new Error('Invalid OpenAI response payload');
        return buildResult(parsed);
      }
    } catch (error) {
      console.error(`planLLM ${provider} error:`, error);
    }
  }

  return fallbackResponse;
}

function buildResult(parsed: any) {
  const variants = toVariantArray(parsed?.variants);
  const closing = toStringValue(parsed?.closing) ?? fallbackResponse.closing;
  return {
    variants: variants.length > 0 ? variants : fallbackResponse.variants,
    closing,
  };
}

function stripCodeFence(raw: string): string {
  let text = raw.trim();
  if (text.startsWith('```')) {
    text = text.replace(/^```(?:json)?/i, '');
    const fence = text.lastIndexOf('```');
    if (fence >= 0) text = text.slice(0, fence);
  }
  return text.trim();
}

function parseResponse(content: string | null | undefined): any | null {
  if (!content) return null;
  const primary = stripCodeFence(content);
  try {
    return JSON.parse(primary);
  } catch (err) {
    const match = primary.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch (inner) {
        console.error('planLLM JSON retry failed:', inner);
      }
    }
    console.error('planLLM JSON parse error:', err);
    return null;
  }
}

function toStringValue(value: unknown): string | null {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  if (typeof value === 'number') return String(value);
  if (Array.isArray(value)) {
    const parts = value
      .map((part) => toStringValue(part))
      .filter((part): part is string => Boolean(part));
    return parts.length > 0 ? parts.join('\n') : null;
  }
  if (value && typeof value === 'object') {
    const maybeContent = (value as Record<string, unknown>).content;
    if (typeof maybeContent === 'string' || Array.isArray(maybeContent)) {
      return toStringValue(maybeContent);
    }
    try {
      return JSON.stringify(value);
    } catch {
      return null;
    }
  }
  return null;
}

function toVariantArray(value: unknown): string[] {
  if (!Array.isArray(value)) return fallbackResponse.variants;
  const variants = value
    .map((entry) => toStringValue(entry))
    .filter((entry): entry is string => Boolean(entry));
  return variants.length > 0 ? variants : fallbackResponse.variants;
}

async function callGrok(messages: Array<{ role: string; content: string }>): Promise<GrokResponse> {
  const response = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${GROK_API_KEY}`,
    },
    body: JSON.stringify({
      model: GROK_MODEL,
      stream: false,
      temperature: TEMPERATURE,
      messages,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Grok request failed: ${response.status} ${errorBody}`);
  }

  return response.json();
}

async function callOpenAI(messages: Array<{ role: string; content: string }>): Promise<OpenAIResponse> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      temperature: TEMPERATURE,
      stream: false,
      messages,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`OpenAI request failed: ${response.status} ${errorBody}`);
  }

  return response.json();
}

export default planLLM;
