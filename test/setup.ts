import { afterEach, beforeEach, vi } from 'vitest';

beforeEach(() => {
  process.env.OPENAI_API_KEY = 'test-key';
  process.env.OPENAI_MODEL = 'gpt-4o-mini';
});

afterEach(() => {
  vi.restoreAllMocks();
});
