// =============================================================================
// Muhandes HUB — Open Graph Image Generation
// Dynamic OG images for social sharing
// =============================================================================

import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const alt = 'Muhandes HUB | منصة مهندس';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  const logoData = await readFile(join(process.cwd(), 'public', 'android-chrome-512x512.png'));
  const logoSrc = `data:image/png;base64,${logoData.toString('base64')}`;

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          padding: '60px',
        }}
      >
        {/* Logo */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logoSrc}
          alt=""
          width={120}
          height={120}
          style={{ marginBottom: '32px' }}
        />

        {/* Arabic Title */}
        <div
          style={{
            fontSize: '52px',
            fontWeight: 'bold',
            color: 'white',
            textAlign: 'center',
            marginBottom: '8px',
          }}
        >
          منصة مهندس
        </div>

        {/* English Title */}
        <div
          style={{
            fontSize: '36px',
            fontWeight: '600',
            color: '#94a3b8',
            textAlign: 'center',
            marginBottom: '24px',
          }}
        >
          Muhandes HUB
        </div>

        {/* Tagline */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <div
            style={{
              fontSize: '22px',
              color: '#e2e8f0',
              textAlign: 'center',
            }}
          >
            سوق البناء الرقمي في المملكة العربية السعودية
          </div>
          <div
            style={{
              fontSize: '20px',
              color: '#94a3b8',
              textAlign: 'center',
            }}
          >
            Saudi Arabia&apos;s Digital Construction Marketplace
          </div>
        </div>

        {/* Feature badges */}
        <div
          style={{
            display: 'flex',
            gap: '16px',
            marginTop: '40px',
          }}
        >
          {['مشاريع', 'مناقصات', 'منتجات', 'عقود'].map((badge) => (
            <div
              key={badge}
              style={{
                padding: '8px 20px',
                borderRadius: '20px',
                border: '1px solid #334155',
                color: '#94a3b8',
                fontSize: '16px',
              }}
            >
              {badge}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size },
  );
}
