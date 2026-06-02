# 13 - ملفات الإعداد والبيئة (Environment & Configuration)

## `next.config.ts`
```ts
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

  async redirects() {
    return [
      { source: '/ar/:path*', destination: '/:path*', permanent: true },
      { source: '/en/:path*', destination: '/:path*', permanent: true },
      { source: '/ar', destination: '/', permanent: true },
      { source: '/en', destination: '/', permanent: true },
    ];
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
      // ── Marketing Layout Injector ──────────────────────────────────────────
      {
        source: '/',
        headers: [{ key: 'x-is-marketing', value: '1' }],
      },
      {
        source: '/pricing',
        headers: [{ key: 'x-is-marketing', value: '1' }],
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

```

## `.env.example`
```
# ──────────────────────────────────────────────────────────────────────
# NamaSoft ERP — Environment Variables Template
# Copy this file to .env and fill in real values.
# NEVER commit .env to git — it's in .gitignore
# ──────────────────────────────────────────────────────────────────────

# ── Database (Multi-Tenant) ───────────────────────────────────────────
# Tenant databases (resolved per subdomain by /lib/prisma.ts)
DATABASE_URL="postgresql://postgres:password@localhost:5432/n11_db?schema=public"
DATABASE_URL_N1="postgresql://postgres:password@localhost:5432/n1_db?schema=public"
# Default DB used by health check and non-tenant routes
DATABASE_URL_DEFAULT="postgresql://postgres:password@localhost:5432/n11_db?schema=public"

# ── JWT Security ──────────────────────────────────────────────────────
# Generate: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
# MUST be at least 64 chars, unique per environment
JWT_SECRET="CHANGE_THIS_TO_A_RANDOM_64_CHAR_HEX_STRING"

# ── Encryption Key ────────────────────────────────────────────────────
# Generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# MUST be exactly 32 bytes (64 hex chars) for AES-256-GCM
ENCRYPTION_KEY="CHANGE_THIS_TO_32_BYTE_RANDOM_HEX_STRING"

# ── Cron Authentication ───────────────────────────────────────────────
# Protects /api/cron/* endpoints from unauthorized execution
# Generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Usage: curl -H "Authorization: Bearer <token>" /api/cron/debts
CRON_SECRET="CHANGE_THIS_TO_32_BYTE_RANDOM_HEX_STRING"

# ── App Settings ──────────────────────────────────────────────────────
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://namainvist.com

# ── Clerk (Authentication) ────────────────────────────────────────────
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_your-publishable-key
CLERK_SECRET_KEY=sk_live_your-secret-key

# ── AI / Gemini ───────────────────────────────────────────────────────
GEMINI_API_KEY=AIzaSyDZqiANOXJNNYw6_gH69-t_rUfdbPYYlKY

# ── ZATCA ─────────────────────────────────────────────────────────────
ZATCA_ENV=simulation
ZATCA_API_URL=https://gw-fatoora.zatca.gov.sa/e-invoicing/developer-portal
ZATCA_API_KEY=your-zatca-api-key
ZATCA_CERT_PATH=/etc/namasoft/zatca/cert.pem
ZATCA_PRIVATE_KEY_PATH=/etc/namasoft/zatca/private.pem

# ── Email (SMTP) ──────────────────────────────────────────────────────
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@email.com
SMTP_PASS=your-app-password
SMTP_FROM="NamaSoft ERP <noreply@namainvist.com>"

# ── Sentry (Error Tracking) ───────────────────────────────────────────
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
NEXT_PUBLIC_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
SENTRY_AUTH_TOKEN=your-sentry-auth-token

# ── Redis (optional — distributed rate limiting + BullMQ) ─────────────
# REDIS_URL=redis://localhost:6379

# ── Telegram Bot (Alerts + Commands) ─────────────────────────────────
TELEGRAM_BOT_TOKEN=your-bot-token
TELEGRAM_CHAT_ID=your-master-chat-id

# ── E-Commerce Integrations (optional) ───────────────────────────────
# SALLA_ACCESS_TOKEN=your-salla-token
# SALLA_CLIENT_SECRET=your-salla-webhook-secret
# ZID_WEBHOOK_SECRET=your-zid-webhook-secret

# ── Backup Storage ────────────────────────────────────────────────────
BACKUP_STORAGE_PATH=/var/backups/namasoft
# ── GOSI / WPS (Saudi Labor APIs) ──────────────────────────────────────────
GOSI_API_KEY=your-gosi-api-key
GOSI_API_URL=https://api.gosi.gov.sa
WPS_BANK_CODE=your-wps-bank-code

# ── WhatsApp Business API (Meta Cloud) ─────────────────────────────────────
WHATSAPP_ACCESS_TOKEN=your-whatsapp-access-token
WHATSAPP_PHONE_NUMBER_ID=your-phone-number-id
WHATSAPP_VERIFY_TOKEN=your-webhook-verify-token


```

## `tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": [
      "dom",
      "dom.iterable",
      "esnext"
    ],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "types": ["node", "jest"],
    "paths": {
      "@/*": [
        "./src/*"
      ]
    }
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts",
    ".next/dev/types/**/*.ts",
    "**/*.mts",
    ".next-electron/types/**/*.ts",
    ".next-electron/dev/types/**/*.ts"
  ],
  "exclude": [
    "node_modules",
    "dist-electron",
    "dist",
    "out",
    "stories",
    "tests/a11y",
    "scripts"
  ]
}

```

