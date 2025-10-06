import OpenAI from 'openai';
import { salesRules } from '../../src/state/salesRules';

const fallbackResponse = {
  variants: [
    'Basic package: Covers core areas efficiently.',
    'Enhanced package: Includes member bands for durability.'
  ],
  closing: 'This solution ensures optimal insulation—ready to proceed?'
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
        console.error('composeSales JSON retry failed:', inner);
      }
    }
    console.error('composeSales JSON parse error:', err);
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

export async function composeSales(form: unknown = {}, feedback: unknown = {}) {
  if (!openai) {
    console.warn('composeSales fallback: OPENAI_API_KEY not set');
    return fallbackResponse;
  }

  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  const messages = [
    {
      role: 'system' as const,
      content: `You are crafting persuasive sales copy for YetiFoam using these rules: ${JSON.stringify(salesRules)}. Produce 2-3 concise variants and a compelling closing statement.`
    },
    {
      role: 'user' as const,
      content: `Shed configuration: ${JSON.stringify(form || {})}\nFeedback: ${JSON.stringify(feedback || {})}\nReturn JSON only (no markdown fences) shaped as { "variants": ["Variant 1"], "closing": "Close" }.\nEach variants entry must be a plain string without embedded JSON or objects.\nThe closing must be a single plain string.`
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
    console.error('composeSales OpenAI error:', error);
    return fallbackResponse;
  }
}

export default composeSales;
