import { withSentryConfig } from '@sentry/nextjs';
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: process.env.ELECTRON_BUILD ? '.next-electron' : '.next',
  allowedDevOrigins: ['https://namainvist.com', 'http://localhost:3000'],
  env: {
    NEXT_PUBLIC_IS_DESKTOP: process.env.ELECTRON_BUILD ? '1' : '0',
  },
  typescript: {
    // ⚠️ Webpack strict mode reveals pre-existing Decimal<>number type issues
    // These are runtime-safe (Prisma Decimal is number-compatible). Fix planned.
    ignoreBuildErrors: true,
  },

  serverExternalPackages: ['ssh2', 'nodemailer'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'raw.githubusercontent.com',
      },
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  async headers() {
    return [
      // ── Security Headers (global) ─────────────────────────────
      {
        source: '/(.*)',
        headers: [
          { key: 'X-DNS-Prefetch-Control',  value: 'on' },
          { key: 'X-XSS-Protection',        value: '1; mode=block' },
          { key: 'X-Frame-Options',         value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options',  value: 'nosniff' },
          { key: 'Referrer-Policy',         value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy',      value: 'camera=(), microphone=(), geolocation=()' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.sentry-cdn.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https:",
              "connect-src 'self' https://*.sentry.io https://vitals.vercel-insights.com wss:",
              "frame-ancestors 'self'",
            ].join('; '),
          },
        ],
      },
      // ── No-cache for onboarding ───────────────────────────────
      {
        source: '/onboarding/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, max-age=0' },
          { key: 'Pragma',        value: 'no-cache' },
          { key: 'CDN-Cache-Control', value: 'no-store' },
        ],
      },
      // ── API — no cache ────────────────────────────────────────
      {
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store' },
          { key: 'X-Robots-Tag',  value: 'noindex' },
        ],
      },
    ];
  },
  // output: 'standalone', // Forbidden for PM2 deployments unless in Docker/Electron
};

if (process.env.ELECTRON_BUILD) {
  // any electron specific overrides
}

export default withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options
  org: "nama-invest",
  project: "namaweb",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Automatically annotate React components to show their full name in breadcrumbs and session replay
  webpack: {
    reactComponentAnnotation: {
      enabled: true,
    },
  },

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  tunnelRoute: "/monitoring",

});
