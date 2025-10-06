import { formSchema, type FormState, type ValidFormState } from '../state/formSchema';

export type SalesResponse = {
  variants: string[];
  closing: string;
};

export const DEFAULT_SALES_VARIANTS = [
  'Basic package: Covers core areas efficiently.',
  'Enhanced package: Includes member bands for durability.',
];

export const DEFAULT_SALES_CLOSING = 'This solution ensures optimal insulation—ready to proceed?';

type SalesPayload = {
  form: FormState | ValidFormState;
  feedback?: Record<string, unknown>;
};

export async function composeSales(payload: SalesPayload): Promise<SalesResponse> {
  const validated = ensureValidForm(payload.form);
  const body = {
    form: validated,
    feedback: payload.feedback ?? {},
  };

  const response = await fetch('/api/sales', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    throw new Error('Sales composer response could not be parsed.');
  }

  if (!response.ok) {
    const message = extractErrorMessage(data) ?? 'Sales composer request failed.';
    throw new Error(message);
  }

  const variants = normaliseVariants((data as any)?.variants);
  const closing = normaliseString((data as any)?.closing) ?? DEFAULT_SALES_CLOSING;

  return {
    variants: variants.length > 0 ? variants : DEFAULT_SALES_VARIANTS,
    closing,
  };
}

export const composePitch = composeSales;

function ensureValidForm(form: FormState | ValidFormState): ValidFormState {
  const result = formSchema.safeParse(form);
  if (!result.success) {
    const message = result.error.issues[0]?.message ?? 'Complete all required inputs before generating variants.';
    const error = new Error(message);
    (error as Error & { issues?: typeof result.error.issues }).issues = result.error.issues;
    throw error;
  }
  return result.data;
}

function normaliseVariants(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const variants: string[] = [];
  for (const entry of value) {
    const text = normaliseString(entry);
    if (text) {
      variants.push(text);
    }
  }
  return variants;
}

function normaliseString(value: unknown): string | null {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  if (Array.isArray(value)) {
    const joined = value
      .map((part) => normaliseString(part))
      .filter((part): part is string => Boolean(part))
      .join('\n');
    return joined.length > 0 ? joined : null;
  }
  if (value && typeof value === 'object') {
    const content = (value as Record<string, unknown>).content;
    if (content) {
      return normaliseString(content);
    }
    try {
      return JSON.stringify(value);
    } catch {
      return null;
    }
  }
  return null;
}

function extractErrorMessage(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') {
    return null;
  }
  const record = payload as Record<string, unknown>;
  const message = record.message ?? (record.error as Record<string, unknown> | undefined)?.message;
  return typeof message === 'string' && message.trim().length > 0 ? message.trim() : null;
}
