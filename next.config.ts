import { withSentryConfig } from '@sentry/nextjs';
import type { NextConfig } from "next";

// ── CSP directives ────────────────────────────────────────────────────────────
const cspDirectives = [
  "default-src 'self'",
  [
    "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
    "https://js.sentry-cdn.com",
    "https://*.clerk.accounts.dev",
    "https://clerk.namainvist.com",
    "https://challenges.cloudflare.com",
    "https://unpkg.com",            // Swagger UI CDN
    "https://static.cloudflareinsights.com", // Cloudflare Insights beacon
  ].join(' '),
  [
    "style-src 'self' 'unsafe-inline'",
    "https://fonts.googleapis.com",
    "https://unpkg.com",            // Swagger UI CSS
  ].join(' '),
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: blob: https:",
  [
    "connect-src 'self'",
    "https://*.sentry.io",
    "https://vitals.vercel-insights.com",
    "https://*.clerk.accounts.dev",
    "https://clerk.namainvist.com",
    "https://api.clerk.com",
    "https://generativelanguage.googleapis.com", // Gemini API
    "https://gw-fatoora.zatca.gov.sa",           // ZATCA sandbox
    "https://fatoora.zatca.gov.sa",              // ZATCA production
    "https://cloudflareinsights.com",            // Cloudflare Web Analytics
    "wss:",
  ].join(' '),
  "frame-src 'self' https://*.clerk.accounts.dev https://challenges.cloudflare.com",
  "worker-src 'self' blob:",
  "frame-ancestors 'self'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

const nextConfig: NextConfig = {
  distDir: process.env.ELECTRON_BUILD ? '.next-electron' : '.next',
  allowedDevOrigins: ['https://namainvist.com', 'http://localhost:3000'],
  compress: true,
  poweredByHeader: false,

  env: {
    NEXT_PUBLIC_IS_DESKTOP: process.env.ELECTRON_BUILD ? '1' : '0',
    NEXT_PUBLIC_APP_VERSION: process.env.npm_package_version ?? '2.4.6',
  },

  typescript: {
    ignoreBuildErrors: true,
  },

  // Packages that should not be bundled (remain on server filesystem)
  serverExternalPackages: ['ssh2', 'nodemailer', '@prisma/client', 'prisma'],

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'raw.githubusercontent.com' },
      { protocol: 'https', hostname: '**' },
    ],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 86400,
  },

  // ── Experimental Optimizations ────────────────────────────────────────────
  experimental: {
    // Parallel routes data fetching
    serverActions: { bodySizeLimit: '2mb' },
  },

  // ── Webpack bundle optimizations ─────────────────────────────────────────
  webpack(config, { isServer }) {
    // Reduce bundle size: alias large server-only modules to empty on client
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        'ssh2':       false,
        'nodemailer': false,
        'bcryptjs':   false,
      };
    }
    return config;
  },

  async headers() {
    return [
      // ── Security Headers (global) ─────────────────────────────────────────
      {
        source: '/(.*)',
        headers: [
          { key: 'X-DNS-Prefetch-Control',  value: 'on' },
          { key: 'X-XSS-Protection',        value: '1; mode=block' },
          { key: 'X-Frame-Options',         value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options',  value: 'nosniff' },
          { key: 'Referrer-Policy',         value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy',      value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'Content-Security-Policy', value: cspDirectives },
        ],
      },
      // ── No-cache for onboarding ───────────────────────────────────────────
      {
        source: '/onboarding/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, max-age=0' },
          { key: 'Pragma',        value: 'no-cache' },
          { key: 'CDN-Cache-Control', value: 'no-store' },
        ],
      },
      // ── API — no cache, no indexing ───────────────────────────────────────
      {
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store' },
          { key: 'X-Robots-Tag',  value: 'noindex' },
        ],
      },
      // ── Static assets (long-lived cache) ─────────────────────────────────
      {
        source: '/_next/static/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        source: '/fonts/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        source: '/images/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' }],
      },
    ];
  },
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
