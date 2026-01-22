/**
 * Subdomain Utilities for Multi-Tenant ISP Management System
 * 
 * This module handles dynamic subdomain detection for multi-tenant API routing.
 * 
 * Development Setup:
 * - Frontend: bluenet.localhost:3000
 * - Backend: bluenet.localhost:8000
 * - Add to hosts file: 127.0.0.1 bluenet.localhost
 * 
 * Production Setup:
 * - Frontend: bluenet.netily.io
 * - Backend: bluenet.netily.io (or api.bluenet.netily.io)
 */

// ==========================================
// CONFIGURATION
// ==========================================

// Set to true to enable subdomain API routing (backend is now configured)
// When true, API calls will go to {subdomain}.localhost:8000
const ENABLE_SUBDOMAIN_API_ROUTING = true

// Known base domains (add your production domain here)
const KNOWN_DOMAINS = [
  'localhost',
  'netily.io',
  'netily.com',
  'ngrok-free.app',
  'ngrok.io',
  // Add more as needed
]

// Reserved subdomains that should NOT be treated as tenant subdomains
const RESERVED_SUBDOMAINS = [
  'www',
  'api',
  'admin',
  'app',
  'dashboard',
  'mail',
  'smtp',
  'ftp',
  'cdn',
  'static',
  'assets',
]

// ==========================================
// SUBDOMAIN DETECTION
// ==========================================

export interface SubdomainInfo {
  /** The tenant subdomain (e.g., "bluenet") or null if on main domain */
  subdomain: string | null
  /** The base domain (e.g., "localhost" or "netily.io") */
  baseDomain: string
  /** Full hostname (e.g., "bluenet.localhost") */
  hostname: string
  /** Whether this is a development environment */
  isDevelopment: boolean
  /** Whether a valid tenant subdomain was detected */
  hasTenantSubdomain: boolean
  /** The current port (e.g., "3000" or null) */
  port: string | null
}

/**
 * Detect subdomain information from the current URL
 */
export function getSubdomainInfo(): SubdomainInfo {
  // Handle SSR - return defaults when window is not available
  if (typeof window === 'undefined') {
    return {
      subdomain: null,
      baseDomain: 'localhost',
      hostname: 'localhost',
      isDevelopment: process.env.NODE_ENV === 'development',
      hasTenantSubdomain: false,
      port: null,
    }
  }

  const hostname = window.location.hostname
  const port = window.location.port || null
  const parts = hostname.split('.')
  
  // Determine if we're in development
  const isDevelopment = 
    process.env.NODE_ENV === 'development' ||
    hostname.includes('localhost') ||
    hostname.startsWith('127.') ||
    hostname.startsWith('192.168.')

  // Single part hostname (e.g., "localhost")
  if (parts.length === 1) {
    return {
      subdomain: null,
      baseDomain: hostname,
      hostname,
      isDevelopment,
      hasTenantSubdomain: false,
      port,
    }
  }

  // Handle localhost subdomains (e.g., "bluenet.localhost")
  if (parts[parts.length - 1] === 'localhost') {
    const subdomain = parts.slice(0, -1).join('.')
    const isReserved = RESERVED_SUBDOMAINS.includes(subdomain.toLowerCase())
    
    return {
      subdomain: isReserved ? null : subdomain,
      baseDomain: 'localhost',
      hostname,
      isDevelopment: true,
      hasTenantSubdomain: !isReserved && subdomain.length > 0,
      port,
    }
  }

  // Handle production domains (e.g., "bluenet.netily.io")
  // Find the base domain from known domains
  let baseDomain = hostname
  let subdomain: string | null = null

  for (const known of KNOWN_DOMAINS) {
    if (hostname.endsWith(`.${known}`)) {
      baseDomain = known
      subdomain = hostname.slice(0, hostname.length - known.length - 1)
      break
    } else if (hostname === known) {
      baseDomain = known
      subdomain = null
      break
    }
  }

  // Check if subdomain is reserved
  const isReserved = subdomain ? RESERVED_SUBDOMAINS.includes(subdomain.toLowerCase()) : false
  
  return {
    subdomain: isReserved ? null : subdomain,
    baseDomain,
    hostname,
    isDevelopment,
    hasTenantSubdomain: !isReserved && !!subdomain,
    port,
  }
}

/**
 * Get the current tenant subdomain or null
 */
export function getCurrentSubdomain(): string | null {
  const info = getSubdomainInfo()
  return info.hasTenantSubdomain ? info.subdomain : null
}

// ==========================================
// API URL GENERATION
// ==========================================

export interface ApiUrlConfig {
  /** Override the default API port (default: 8000 for dev, none for prod) */
  apiPort?: string
  /** Override protocol (default: auto-detect) */
  protocol?: 'http' | 'https'
  /** Force a specific subdomain (useful for testing) */
  forceSubdomain?: string
}

/**
 * Generate the API base URL based on current subdomain
 * 
 * Examples:
 * - bluenet.localhost:3000 → http://bluenet.localhost:8000/api/v1
 * - bluenet.netily.io → https://bluenet.netily.io/api/v1
 * - localhost:3000 → http://localhost:8000/api/v1 (fallback)
 */
export function getApiBaseUrl(config: ApiUrlConfig = {}): string {
  const info = getSubdomainInfo()
  
  console.log('[Subdomain] getApiBaseUrl called:', {
    hostname: info.hostname,
    subdomain: info.subdomain,
    baseDomain: info.baseDomain,
    isDevelopment: info.isDevelopment,
    hasTenantSubdomain: info.hasTenantSubdomain,
    ENABLE_SUBDOMAIN_API_ROUTING,
  })
  
  // Check if using ngrok (always uses HTTPS, no port)
  const isNgrok = info.hostname.includes('ngrok-free.app') || info.hostname.includes('ngrok.io')
  
  // Determine protocol
  const protocol = config.protocol || (isNgrok ? 'https' : (info.isDevelopment ? 'http' : 'https'))
  
  // Determine port (ngrok doesn't need port)
  let port = ''
  if (info.isDevelopment && !isNgrok) {
    port = `:${config.apiPort || '8000'}`
  }
  
  // TEMPORARY: If subdomain routing is disabled, always use localhost
  // This allows the frontend to work until backend subdomain support is ready
  if (!ENABLE_SUBDOMAIN_API_ROUTING && info.isDevelopment) {
    const fallbackUrl = `http://localhost:8000/api/v1`
    console.log('[Subdomain] Using fallback URL:', fallbackUrl)
    return fallbackUrl
  }
  
  // Build hostname
  let apiHostname = info.hostname
  
  // Apply force subdomain if specified
  if (config.forceSubdomain) {
    apiHostname = `${config.forceSubdomain}.${info.baseDomain}`
  }
  
  const finalUrl = `${protocol}://${apiHostname}${port}/api/v1`
  console.log('[Subdomain] Final API URL:', finalUrl)
  
  return finalUrl
}

/**
 * Get API URL for a specific tenant (used in registration flow)
 */
export function getTenantApiUrl(subdomain: string, config: ApiUrlConfig = {}): string {
  const info = getSubdomainInfo()
  const protocol = config.protocol || (info.isDevelopment ? 'http' : 'https')
  const port = info.isDevelopment ? `:${config.apiPort || '8000'}` : ''
  
  return `${protocol}://${subdomain}.${info.baseDomain}${port}/api/v1`
}

/**
 * Get the frontend URL for a specific tenant (used in registration redirect)
 */
export function getTenantFrontendUrl(subdomain: string, path: string = '/'): string {
  const info = getSubdomainInfo()
  const protocol = info.isDevelopment ? 'http' : 'https'
  const port = info.isDevelopment && info.port ? `:${info.port}` : ''
  
  return `${protocol}://${subdomain}.${info.baseDomain}${port}${path}`
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

/**
 * Check if current page is on the main domain (no tenant subdomain)
 */
export function isMainDomain(): boolean {
  return !getSubdomainInfo().hasTenantSubdomain
}

/**
 * Check if current page is on a tenant subdomain
 */
export function isTenantDomain(): boolean {
  return getSubdomainInfo().hasTenantSubdomain
}

/**
 * Redirect to a tenant's subdomain
 */
export function redirectToTenant(subdomain: string, path: string = '/admin'): void {
  if (typeof window !== 'undefined') {
    const url = getTenantFrontendUrl(subdomain, path)
    window.location.href = url
  }
}

/**
 * Redirect to main domain
 */
export function redirectToMainDomain(path: string = '/'): void {
  if (typeof window !== 'undefined') {
    const info = getSubdomainInfo()
    const protocol = info.isDevelopment ? 'http' : 'https'
    const port = info.isDevelopment && info.port ? `:${info.port}` : ''
    window.location.href = `${protocol}://${info.baseDomain}${port}${path}`
  }
}

/**
 * Generate a slug from company name (for subdomain)
 * Must match backend's slugify logic
 */
export function slugifyCompanyName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')  // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, '')       // Remove leading/trailing hyphens
    .substring(0, 50)              // Limit length
}

// ==========================================
// DEBUG HELPERS
// ==========================================

/**
 * Log subdomain info (useful for debugging)
 */
export function logSubdomainInfo(): void {
  if (typeof window !== 'undefined') {
    const info = getSubdomainInfo()
    console.group('🌐 Subdomain Info')
    console.log('Hostname:', info.hostname)
    console.log('Subdomain:', info.subdomain)
    console.log('Base Domain:', info.baseDomain)
    console.log('Has Tenant:', info.hasTenantSubdomain)
    console.log('Is Development:', info.isDevelopment)
    console.log('Port:', info.port)
    console.log('API Base URL:', getApiBaseUrl())
    console.groupEnd()
  }
}
