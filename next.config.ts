import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { withSentryConfig } from "@sentry/nextjs";

const withNextIntl = createNextIntlPlugin();

// Content Security Policy
// Note: 'unsafe-inline' and 'unsafe-eval' are needed for Next.js and inline scripts
const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.sentry.io https://*.stripe.com https://*.vercel-scripts.com https://vercel.live https://*.google.com https://*.gstatic.com https://*.googlesyndication.com https://*.googletagservices.com https://*.doubleclick.net https://*.adtrafficquality.google;
  style-src 'self' 'unsafe-inline' https://*.googleapis.com;
  img-src 'self' data: blob: https: http:;
  font-src 'self' https://*.gstatic.com;
  connect-src 'self' https://*.sentry.io https://*.stripe.com https://*.vercel-scripts.com https://vercel.live https://vercel.com https://*.google.com https://*.googlesyndication.com https://*.adtrafficquality.google https://*.googleusercontent.com;
  frame-src 'self' https://*.stripe.com https://*.google.com https://*.doubleclick.net https://*.googlesyndication.com https://vercel.live https://*.adtrafficquality.google;
  worker-src 'self' blob:;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'self';
  upgrade-insecure-requests;
`.replace(/\s{2,}/g, ' ').trim();

// Security headers configuration
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN',
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=(self "https://js.stripe.com"), usb=(), magnetometer=(), gyroscope=(), accelerometer=()',
  },
  {
    key: 'Content-Security-Policy',
    value: ContentSecurityPolicy,
  },
];

const nextConfig: NextConfig = {
  serverExternalPackages: ["esbuild-wasm"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

const configWithPlugins = withNextIntl(nextConfig);

export default withSentryConfig(configWithPlugins, {
  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Suppress verbose source map upload logs
  silent: true,

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  tunnelRoute: "/monitoring",

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Webpack-specific options
  webpack: {
    // Automatically annotate React components to show their full name in breadcrumbs and session replay
    reactComponentAnnotation: {
      enabled: true,
    },
    // Automatically tree-shake Sentry logger statements to reduce bundle size
    treeshake: {
      removeDebugLogging: true,
    },
    // Enables automatic instrumentation of Vercel Cron Monitors
    automaticVercelMonitors: true,
  },

  // Hides source maps from generated client bundles
  sourcemaps: {
    deleteSourcemapsAfterUpload: true,
  },

  // Disable the detailed source map upload report in build logs
  bundleSizeOptimizations: {
    excludeDebugStatements: true,
    excludeReplayIframe: true,
    excludeReplayShadowDom: true,
  },
});
