// Redirect legacy /api/products/feed to the English locale feed.
// The GMC data source registered at this URL will auto-follow the 301.
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const BASE_URL = (process.env.NEXT_PUBLIC_APP_URL || 'https://muhandeshub.com').trim();

export function GET() {
  return NextResponse.redirect(`${BASE_URL}/api/products/feed/ar`, 301);
}
