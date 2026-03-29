// =============================================================================
// Muhandes HUB — Translation API Route (authenticated, rate-limited)
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { translateText } from '@/lib/translate';
import { checkRateLimit } from '@/lib/rate-limit';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// ---------------------------------------------------------------------------
// Rate limiter: 30 translations per minute per user
// ---------------------------------------------------------------------------
let limiter: Ratelimit | null = null;

function getTranslateLimiter(): Ratelimit | null {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }
  if (!limiter) {
    limiter = new Ratelimit({
      redis: new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      }),
      limiter: Ratelimit.slidingWindow(30, '1 m'),
      prefix: 'rl:translate',
    });
  }
  return limiter;
}

// ---------------------------------------------------------------------------
// POST /api/translate
// Body: { text: string, from: 'ar'|'en', to: 'ar'|'en' }
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  // 1. Auth check
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Rate limit
  const rl = getTranslateLimiter();
  const { success } = await checkRateLimit(rl, user.id);
  if (!success) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  // 3. Parse body
  let body: { text?: string; from?: string; to?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { text, from, to } = body;

  if (!text || typeof text !== 'string') {
    return NextResponse.json({ error: 'text is required' }, { status: 400 });
  }
  if (from !== 'ar' && from !== 'en') {
    return NextResponse.json({ error: 'from must be "ar" or "en"' }, { status: 400 });
  }
  if (to !== 'ar' && to !== 'en') {
    return NextResponse.json({ error: 'to must be "ar" or "en"' }, { status: 400 });
  }
  if (from === to) {
    return NextResponse.json({ translated: text });
  }
  if (text.length > 5000) {
    return NextResponse.json({ error: 'Text too long (max 5000 chars)' }, { status: 400 });
  }

  // 4. Translate
  const translated = await translateText(text, from, to);
  if (!translated) {
    return NextResponse.json({ error: 'Translation failed' }, { status: 502 });
  }

  return NextResponse.json({ translated });
}
