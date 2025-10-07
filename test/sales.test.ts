import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defaultFormValues, formSchema } from '../src/state/formSchema';

function buildValidForm() {
  const base = JSON.parse(JSON.stringify(defaultFormValues));
  base.dimensions = { length: 12, width: 6, height: 4 };
  base.pitch = { selected: '15', suggested: null, assumed: false };
  base.cladding = { type: 'corrugated' };
  base.members = { roof: 'top_hat', walls: 'top_hat' };
  base.spray = { includeRoofBattens: true, includeWallPurlins: false };
  return formSchema.parse(base);
}

let mockFetch: vi.Mock;

beforeEach(() => {
  mockFetch = vi.fn();
  global.fetch = mockFetch as unknown as typeof fetch;
  vi.resetModules();
  process.env.GROK_API_KEY = 'test-grok';
  process.env.OPENAI_API_KEY = 'test-openai';
});

describe('server composeSales', () => {
  it('normalises structured JSON into variants and closing', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: '{"variants": ["Roof focus", {"content": ["Walls focus"]}], "closing": "Seal the deal"}',
            },
          },
        ],
      }),
    });

    const { composeSales } = await import('../server/services/salesComposer.ts');
    const result = await composeSales({ dim: 'stub' }, { notes: 'none' });
    expect(result.variants).toEqual(['Roof focus', 'Walls focus']);
    expect(result.closing).toBe('Seal the deal');
  });

  it('returns fallback when Grok rejects', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'network down',
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'openai offline',
      });

    const { composeSales } = await import('../server/services/salesComposer.ts');
    const result = await composeSales({}, {});
    expect(mockFetch).toHaveBeenCalledTimes(2);
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
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ variants: [], closing: '' }),
    });

    const {
      composeSales: composeSalesClient,
      DEFAULT_SALES_VARIANTS,
      DEFAULT_SALES_CLOSING,
    } = await import('../src/services/salesComposer.ts');

    const form = buildValidForm();
    const response = await composeSalesClient({ form, feedback: { channel: 'phone' } });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/sales');
    expect(init?.method).toBe('POST');
    const payload = JSON.parse(String(init?.body ?? '{}'));
    expect(payload.form.dimensions.length).toBe(12);
    expect(payload.feedback.channel).toBe('phone');
    expect(payload.provider).toBe('grok');

    expect(response.variants).toEqual(DEFAULT_SALES_VARIANTS);
    expect(response.closing).toBe(DEFAULT_SALES_CLOSING);
  });
});
