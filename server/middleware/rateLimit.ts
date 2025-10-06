type Bucket = { tokens: number; last: number };
const rpm = 10; // requests per minute
const refillPerMs = rpm / 60000;
const buckets = new Map<string, Bucket>();

export function rateLimit(userId: string) {
  const now = Date.now();
  const b = buckets.get(userId) ?? { tokens: rpm, last: now };
  const elapsed = now - b.last;
  b.tokens = Math.min(rpm, b.tokens + elapsed * refillPerMs);
  b.last = now;
  if (b.tokens < 1) {
    const err: any = new Error("Rate limit exceeded");
    err.status = 429; err.type = "rate_limit";
    throw err;
  }
  b.tokens -= 1;
  buckets.set(userId, b);
}
