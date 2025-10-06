import OpenAI from 'openai';
import { salesRules } from '../../src/state/salesRules';

const fallbackResponse = {
  variants: [
    'Standard foam application for this size.',
    'Premium option with extra coverage.'
  ],
  closing: "Let's discuss the best fit for your shed."
};

const apiKey = process.env.OPENAI_API_KEY;
const openai = apiKey ? new OpenAI({ apiKey }) : null;

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

export async function planLLM(form: unknown = {}, feedback: unknown = {}) {
  if (!openai) {
    console.warn('planLLM fallback: OPENAI_API_KEY not set');
    return fallbackResponse;
  }

  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
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

  try {
    const completion = await openai.chat.completions.create({
      model,
      messages,
    });

    const parsed = parseResponse(completion.choices?.[0]?.message?.content);
    if (!parsed) throw new Error('Invalid response payload');

    const variants = toVariantArray(parsed?.variants);
    const closing = toStringValue(parsed?.closing) ?? fallbackResponse.closing;

    return { variants, closing };
  } catch (error) {
    console.error('planLLM OpenAI error:', error);
    return fallbackResponse;
  }
}

export default planLLM;
