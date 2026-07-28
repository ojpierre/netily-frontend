import { MetadataRoute } from 'next'
import { headers } from 'next/headers'

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const headersList = await headers()
  const host = headersList.get('host') || ''
  
  // Extract tenant subdomain
  let tenantSubdomain: string | null = null;
  const hostParts = host.split(':')[0].toLowerCase();
  
  if (hostParts !== 'localhost' && !hostParts.startsWith('www.')) {
     if (hostParts.endsWith('.localhost')) {
         tenantSubdomain = hostParts.replace('.localhost', '');
     } else if (hostParts.includes('.')) {
         tenantSubdomain = hostParts.split('.')[0];
     }
  }

  // Fallback defaults
  let appName = 'Netily — ISP Management Platform'
  let shortName = 'Netily'

  // If accessed from a tenant subdomain, customize the PWA install app names
  if (tenantSubdomain && tenantSubdomain !== 'admin') {
    const capitalizedTenant = tenantSubdomain
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
      
    appName = `${capitalizedTenant} Portal`
    shortName = capitalizedTenant
  }

  return {
    name: appName,
    short_name: shortName,
    description: "Automate ISP billing, M-Pesa payments, MikroTik provisioning, and customer management. Built for Kenyan & East African ISPs.",
    start_url: "/admin",
    display: "standalone",
    orientation: "any",
    theme_color: "#1e3a5f",
    background_color: "#ffffff",
    icons: [
      {
        src: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any maskable" as const
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable" as const
      }
    ],
    categories: ["business", "productivity", "utilities"],
    lang: "en",
    dir: "ltr",
    prefer_related_applications: false
  }
}
