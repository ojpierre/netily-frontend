import withPWAInit from "@ducanh2912/next-pwa"

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  // Remove X-Powered-By header (security hygiene)
  poweredByHeader: false,
  // --- NEW: Production bundle optimizations ---
  productionBrowserSourceMaps: false,   // stop shipping sourcemaps to the client
  compress: true,
  experimental: {
    optimizePackageImports: ['lucide-react'],  // tree-shakes icon imports automatically
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  // Standalone output for Docker deployment
  output: 'standalone',
  // Allow ngrok, LAN IPs, and other dev origins for testing
  allowedDevOrigins: [
    "*.ngrok-free.app",
    "*.ngrok.io",
    "*.loca.lt",
    "*.localhost.run",
    "192.168.100.149",
    "localhost",
  ],

  // ── www → non-www canonical redirect ────────────────────────────────────
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.netily.co.ke' }],
        destination: 'https://netily.co.ke/:path*',
        permanent: true, // 301
      },
    ]
  },

  // ── Security headers (removes X-Powered-By, server version leak) ─────────
  async rewrites() {
    return [
      {
        source: '/api/netily-system-payment/:path*',
        destination: 'https://api.netily.co.ke/api/v1/billing/netily-system-payment/:path*',
      },
      {
        source: '/billing-estimator',
        destination: 'https://api.netily.co.ke/api/v1/subscriptions/calculator/',
      },
      {
        source: '/api/billing-calculator',
        destination: 'https://api.netily.co.ke/api/v1/subscriptions/calculator/',
      },
      {
        source: '/api/billing-calculator/',
        destination: 'https://api.netily.co.ke/api/v1/subscriptions/calculator/',
      },
      {
        source: '/api/public/:path*',
        destination: 'https://api.netily.co.ke/api/v1/:path*',
      },
    ]
  },

  turbopack: {},

  async headers() {
    return [
      {
        source: '/affiliate/verify',
        headers: [
          { key: 'Cache-Control', value: 'private, no-store, no-cache, max-age=0, must-revalidate' },
        ],
      },
      {
        source: '/affiliate/admin-access',
        headers: [
          { key: 'Cache-Control', value: 'private, no-store, no-cache, max-age=0, must-revalidate' },
        ],
      },
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ]
  },
}

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
  extendDefaultRuntimeCaching: true,
  workboxOptions: {
    runtimeCaching: [
      {
        urlPattern: ({ url }) =>
          url.pathname === "/affiliate/verify" ||
          url.pathname === "/affiliate/admin-access",
        handler: "NetworkOnly",
        method: "GET",
      },
    ],
  },
})

export default withPWA(nextConfig)
