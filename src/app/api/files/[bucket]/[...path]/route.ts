// =============================================================================
// File Proxy — Hides Supabase storage URLs from clients
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';

// Allowed buckets (must match uploads.ts BUCKET_CONFIG)
const ALLOWED_BUCKETS = new Set([
  'avatars',
  'logos',
  'project-files',
  'product-images',
  'product-specs',
  'rfq-files',
  'deal-proofs',
  'deal-documents',
  'verification-docs',
  'message-attachments',
  'site-log-photos',
  'company-documents',
  'bank-payments',
]);

// MIME type lookup from extension
const EXT_TO_MIME: Record<string, string> = {
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bucket: string; path: string[] }> },
) {
  const { bucket, path: pathSegments } = await params;

  // 1. Validate bucket
  if (!ALLOWED_BUCKETS.has(bucket)) {
    return NextResponse.json({ error: 'Invalid bucket' }, { status: 400 });
  }

  // 2. Validate path — prevent traversal attacks
  if (
    !pathSegments ||
    pathSegments.length === 0 ||
    pathSegments.some((s) => s === '..' || s === '.' || s.includes('\\'))
  ) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
  }

  const filePath = pathSegments.join('/');

  // 3. Build upstream Supabase storage URL
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    return NextResponse.json({ error: 'Storage not configured' }, { status: 500 });
  }

  const storageUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${filePath}`;

  try {
    // 4. Fetch from Supabase storage (server-side)
    const upstream = await fetch(storageUrl, { next: { revalidate: 3600 } });

    if (!upstream.ok) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // 5. Determine content type
    const ext = filePath.split('.').pop()?.toLowerCase() || '';
    const contentType =
      upstream.headers.get('content-type') || EXT_TO_MIME[ext] || 'application/octet-stream';

    // 6. Determine filename for download
    const fileName = pathSegments[pathSegments.length - 1];
    const isDownload = request.nextUrl.searchParams.get('download') === 'true';
    const disposition = isDownload ? `attachment; filename="${fileName}"` : 'inline';

    // 7. Stream response with caching headers
    return new NextResponse(upstream.body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': disposition,
        'Cache-Control': 'public, max-age=3600, s-maxage=86400',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch file' }, { status: 502 });
  }
}
