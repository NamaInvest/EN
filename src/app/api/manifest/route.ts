import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';

async function _GET() {

  return NextResponse.json({
    name: 'NamaVest ERP & POS',
    short_name: 'NamaVest',
    description: 'Enterprise Resource Planning and Offline Point of Sale',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#0B0E14',
    theme_color: '#0B0E14',
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable'
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any'
      }
    ]
  }, {
    headers: {
      'Content-Type': 'application/manifest+json'
    }
  });
}

export const GET = withRoute(async ({ req }) => _GET(), { rateLimit: 'DEFAULT' });
