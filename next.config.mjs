/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  // Remove X-Powered-By header (security hygiene)
  poweredByHeader: false,
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

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Powered-By', value: '' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ]
  },
}

export default nextConfig
