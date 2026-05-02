import { withSentryConfig } from '@sentry/nextjs';
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: process.env.ELECTRON_BUILD ? '.next-electron' : '.next',
  reactCompiler: true,
  allowedDevOrigins: ['https://namainvist.com', 'http://localhost:3000'],
  env: {
    NEXT_PUBLIC_IS_DESKTOP: process.env.ELECTRON_BUILD ? '1' : '0',
  },
  typescript: {
    // تجاهل أخطاء TypeScript مؤقتاً (سيتم إصلاحها تدريجياً)
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
      {
        source: '/onboarding/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, max-age=0' },
          { key: 'Pragma', value: 'no-cache' },
          { key: 'CDN-Cache-Control', value: 'no-store' },
          { key: 'Cloudflare-CDN-Cache-Control', value: 'no-store' },
        ],
      },
    ];
  },
  output: 'standalone',
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
  reactComponentAnnotation: {
    enabled: true,
  },

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  tunnelRoute: "/monitoring",

});
