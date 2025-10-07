import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defaultFormValues, formSchema } from '../src/state/formSchema';

function buildValidForm() {
  const base = JSON.parse(JSON.stringify(defaultFormValues));
  base.dimensions = { length: 10, width: 5, height: 3 };
  base.pitch = { selected: '10', suggested: null, assumed: false };
  base.cladding = { type: 'corrugated' };
  base.members = { roof: 'top_hat', walls: 'c_channel' };
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

describe('server planLLM', () => {
  it('parses JSON content with code fences into variants and closing', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: '```json\n{ "variants": ["Option A", "Option B"], "closing": "Wrap up" }\n```',
            },
          },
        ],
      }),
    });

    const { planLLM } = await import('../server/services/llmPlanner.ts');
    const result = await planLLM({ dimensions: {} }, { notes: 'sample' });
    expect(result.variants).toEqual(['Option A', 'Option B']);
    expect(result.closing).toBe('Wrap up');
  });

  it('returns fallback copy when Grok request fails', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'server exploded',
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'openai exploded',
      });

    const { planLLM } = await import('../server/services/llmPlanner.ts');
    const result = await planLLM({}, {});
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(result.variants).toEqual([
      'Standard foam application for this size.',
      'Premium option with extra coverage.',
    ]);
    expect(result.closing).toBe("Let's discuss the best fit for your shed.");
  });
});

describe('client requestAdvisor', () => {
  it('throws when form validation fails', async () => {
    const { requestAdvisor } = await import('../src/services/llmClient.ts');
    await expect(
      requestAdvisor({ form: defaultFormValues, question: 'Can we spray this shed?' })
    ).rejects.toThrow(/Required/);
  });

  it('posts form/feedback and normalises fallback response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ variants: [], closing: '' }),
    });

    const { requestAdvisor, DEFAULT_ADVISOR_VARIANTS, DEFAULT_ADVISOR_CLOSING } = await import(
      '../src/services/llmClient.ts'
    );

    const form = buildValidForm();
    const response = await requestAdvisor({ form, question: 'Key selling points?' });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/llm');
    expect(init?.method).toBe('POST');
    const payload = JSON.parse(String(init?.body ?? '{}'));
    expect(payload.form.dimensions.length).toBe(10);
    expect(payload.feedback.question).toBe('Key selling points?');
    expect(payload.provider).toBe('grok');

    expect(response.variants).toEqual(DEFAULT_ADVISOR_VARIANTS);
    expect(response.closing).toBe(DEFAULT_ADVISOR_CLOSING);
  });
});
