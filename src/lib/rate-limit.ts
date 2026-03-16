// =============================================================================
// Muqawil HUB — Rate Limiting via Upstash Redis
// =============================================================================

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// ---------------------------------------------------------------------------
// Redis client (lazy-initialized)
// ---------------------------------------------------------------------------

let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }
  if (!redis) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
  return redis;
}

// ---------------------------------------------------------------------------
// Pre-configured rate limiters per endpoint class
// ---------------------------------------------------------------------------

/** Login: 5 attempts per 15 minutes per email */
export const loginLimiter = () => {
  const r = getRedis();
  if (!r) return null;
  return new Ratelimit({
    redis: r,
    limiter: Ratelimit.slidingWindow(5, '15 m'),
    prefix: 'rl:login',
  });
};

/** Registration: 3 per hour per IP */
export const registrationLimiter = () => {
  const r = getRedis();
  if (!r) return null;
  return new Ratelimit({
    redis: r,
    limiter: Ratelimit.slidingWindow(3, '1 h'),
    prefix: 'rl:register',
  });
};

/** Bid submission: 20 per hour per user */
export const bidLimiter = () => {
  const r = getRedis();
  if (!r) return null;
  return new Ratelimit({
    redis: r,
    limiter: Ratelimit.slidingWindow(20, '1 h'),
    prefix: 'rl:bid',
  });
};

/** Message sending: 60 per minute per user */
export const messageLimiter = () => {
  const r = getRedis();
  if (!r) return null;
  return new Ratelimit({
    redis: r,
    limiter: Ratelimit.slidingWindow(60, '1 m'),
    prefix: 'rl:message',
  });
};

/** Search: 120 queries per minute per IP */
export const searchLimiter = () => {
  const r = getRedis();
  if (!r) return null;
  return new Ratelimit({
    redis: r,
    limiter: Ratelimit.slidingWindow(120, '1 m'),
    prefix: 'rl:search',
  });
};

/** API catch-all: 200 requests per minute per user */
export const apiLimiter = () => {
  const r = getRedis();
  if (!r) return null;
  return new Ratelimit({
    redis: r,
    limiter: Ratelimit.slidingWindow(200, '1 m'),
    prefix: 'rl:api',
  });
};

// ---------------------------------------------------------------------------
// Helper: check rate limit and return result
// ---------------------------------------------------------------------------

export async function checkRateLimit(
  limiter: Ratelimit | null,
  identifier: string,
): Promise<{ success: boolean; remaining?: number; reset?: number }> {
  if (!limiter) {
    // Redis not configured — allow in development
    return { success: true };
  }
  const result = await limiter.limit(identifier);
  return {
    success: result.success,
    remaining: result.remaining,
    reset: result.reset,
  };
}
