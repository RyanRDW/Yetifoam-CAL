import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defaultFormValues, formSchema } from '../src/state/formSchema';

const mockCreate = vi.fn();

vi.mock('openai', () => ({
  default: class {
    chat = { completions: { create: mockCreate } };
  },
}));

function buildValidForm() {
  const base = JSON.parse(JSON.stringify(defaultFormValues));
  base.dimensions = { length: 12, width: 6, height: 4 };
  base.pitch = { selected: '15', suggested: null, assumed: false };
  base.cladding = { type: 'corrugated' };
  base.members = { roof: 'top_hat', walls: 'top_hat' };
  base.spray = { includeRoofBattens: true, includeWallPurlins: false };
  return formSchema.parse(base);
}

beforeEach(() => {
  vi.resetModules();
  mockCreate.mockReset();
});

describe('server composeSales', () => {
  it('normalises structured JSON into variants and closing', async () => {
    mockCreate.mockResolvedValue({
      choices: [
        {
          message: {
            content: '{"variants": ["Roof focus", {"content": ["Walls focus"]}], "closing": "Seal the deal"}',
          },
        },
      ],
    });

    const { composeSales } = await import('../server/services/salesComposer.ts');
    const result = await composeSales({ dim: 'stub' }, { notes: 'none' });
    expect(result.variants).toEqual(['Roof focus', 'Walls focus']);
    expect(result.closing).toBe('Seal the deal');
  });

  it('returns fallback when OpenAI rejects', async () => {
    mockCreate.mockRejectedValue(new Error('network down'));
    const { composeSales } = await import('../server/services/salesComposer.ts');
    const result = await composeSales({}, {});
    expect(result.variants).toEqual([
      'Basic package: Covers core areas efficiently.',
      'Enhanced package: Includes member bands for durability.',
    ]);
    expect(result.closing).toBe('This solution ensures optimal insulation—ready to proceed?');
  });
});

describe('client composeSales', () => {
  it('validates form before posting', async () => {
    const { composeSales: composeSalesClient } = await import('../src/services/salesComposer.ts');
    await expect(
      composeSalesClient({ form: defaultFormValues, feedback: {} })
    ).rejects.toThrow(/Required/);
  });

  it('posts form data and applies fallback when response lacks variants', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ variants: [], closing: '' }),
    });
    global.fetch = mockFetch as unknown as typeof fetch;

    const {
      composeSales: composeSalesClient,
      DEFAULT_SALES_VARIANTS,
      DEFAULT_SALES_CLOSING,
    } = await import('../src/services/salesComposer.ts');

    const form = buildValidForm();
    const response = await composeSalesClient({ form, feedback: { channel: 'phone' } });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(init?.method).toBe('POST');
    const payload = JSON.parse(String(init?.body ?? '{}'));
    expect(payload.form.dimensions.length).toBe(12);
    expect(payload.feedback.channel).toBe('phone');

    expect(response.variants).toEqual(DEFAULT_SALES_VARIANTS);
    expect(response.closing).toBe(DEFAULT_SALES_CLOSING);
  });
});
