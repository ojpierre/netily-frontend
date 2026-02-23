/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
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
}

export default nextConfig