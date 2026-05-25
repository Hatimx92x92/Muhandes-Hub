// =============================================================================
// File Utilities — URL proxy conversion and file type helpers
// =============================================================================

/**
 * Convert a Supabase storage URL to a proxied URL that hides the storage domain.
 *
 * Input:  https://xxx.supabase.co/storage/v1/object/public/bucket/path/file.pdf
 * Output: /api/files/bucket/path/file.pdf
 *
 * Also handles signed URLs:
 * Input:  https://xxx.supabase.co/storage/v1/object/sign/bucket/path?token=...
 * Output: /api/files/bucket/path (signed URLs are converted to public proxy paths)
 */
export function getProxyUrl(storageUrl: string | null | undefined): string {
  if (!storageUrl) return '';

  // Already a proxy URL
  if (storageUrl.startsWith('/api/files/')) return storageUrl;

  // Handle public URLs: /storage/v1/object/public/bucket/path
  const publicMarker = '/storage/v1/object/public/';
  const publicIdx = storageUrl.indexOf(publicMarker);
  if (publicIdx !== -1) {
    const bucketAndPath = storageUrl.slice(publicIdx + publicMarker.length);
    return `/api/files/${bucketAndPath}`;
  }

  // Handle signed URLs: /storage/v1/object/sign/bucket/path?token=...
  const signedMarker = '/storage/v1/object/sign/';
  const signedIdx = storageUrl.indexOf(signedMarker);
  if (signedIdx !== -1) {
    const rest = storageUrl.slice(signedIdx + signedMarker.length);
    // Strip query params (token, etc.)
    const bucketAndPath = rest.split('?')[0];
    return `/api/files/${bucketAndPath}`;
  }

  // Not a recognized Supabase storage URL — return as-is (e.g. relative path)
  return storageUrl;
}

/**
 * Convert a Supabase storage URL to a proxied download URL.
 */
export function getDownloadUrl(storageUrl: string | null | undefined): string {
  const proxy = getProxyUrl(storageUrl);
  if (!proxy) return '';
  const separator = proxy.includes('?') ? '&' : '?';
  return `${proxy}${separator}download=true`;
}

/**
 * Check if a file can be previewed in-browser (PDF or image).
 */
export function isPreviewable(filename: string | null | undefined): boolean {
  if (!filename) return false;
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  return PREVIEWABLE_EXTENSIONS.has(ext);
}

/**
 * Check if a file is a PDF.
 */
export function isPdf(filename: string | null | undefined): boolean {
  if (!filename) return false;
  return filename.toLowerCase().endsWith('.pdf');
}

/**
 * Check if a file is an image.
 */
export function isImage(filename: string | null | undefined): boolean {
  if (!filename) return false;
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  return IMAGE_EXTENSIONS.has(ext);
}

const IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif']);
const PREVIEWABLE_EXTENSIONS = new Set(['pdf', 'jpg', 'jpeg', 'png', 'webp', 'gif']);
