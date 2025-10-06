import { afterEach, beforeEach, vi } from 'vitest';

afterEach(() => {
  vi.restoreAllMocks();
});

beforeEach(() => {
  process.env.XAI_API_KEY = 'test-key';
});
