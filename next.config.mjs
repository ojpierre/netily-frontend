/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    // Allow production builds to complete even with ESLint warnings
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
  },
  // Allow ngrok, LAN IPs, and other dev origins for testing
  allowedDevOrigins: [
    "*.ngrok-free.app",
    "*.ngrok.io",
    "*.loca.lt",
    "*.localhost.run",
    "192.168.100.149",
    "localhost",
  ],
  // Production: Standalone output for smaller deployments (Vercel handles this natively)
  // output: 'standalone',
}

export default nextConfig