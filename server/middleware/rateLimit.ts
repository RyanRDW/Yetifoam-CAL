const TOKENS_PER_MINUTE = 10;
const REFILL_INTERVAL_MS = 60_000;

type BucketState = {
  tokens: number;
  lastRefill: number;
};

const buckets = new Map<string, BucketState>();

export class RateLimitError extends Error {
  public readonly status: number;

  constructor(message = 'Rate limit exceeded. Try again soon.') {
    super(message);
    this.name = 'RateLimitError';
    this.status = 429;
  }
}

function refill(bucket: BucketState, now: number): void {
  const elapsed = now - bucket.lastRefill;

  if (elapsed <= 0) {
    return;
  }

  const tokensToAdd = (elapsed / REFILL_INTERVAL_MS) * TOKENS_PER_MINUTE;
  bucket.tokens = Math.min(TOKENS_PER_MINUTE, bucket.tokens + tokensToAdd);
  bucket.lastRefill = now;
}

export function rateLimit(userId: string): void {
  const now = Date.now();
  const bucket = buckets.get(userId) ?? {
    tokens: TOKENS_PER_MINUTE,
    lastRefill: now,
  };

  refill(bucket, now);

  if (bucket.tokens < 1) {
    buckets.set(userId, bucket);
    throw new RateLimitError();
  }

  bucket.tokens -= 1;
  buckets.set(userId, bucket);
}
