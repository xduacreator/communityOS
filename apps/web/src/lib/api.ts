/**
 * Helper to get the correct API Base URL
 * - Server-side (SSR in Docker): Prioritizes INTERNAL_API_URL or http://api:3001/api
 * - Client-side (Browser): Defaults to '/api' or NEXT_PUBLIC_API_URL (if custom remote host provided)
 */
export function getApiUrl(): string {
  if (typeof window === 'undefined') {
    // Server-Side Rendering (Node.js runtime inside Docker or local)
    if (process.env.INTERNAL_API_URL) {
      return process.env.INTERNAL_API_URL.replace(/\/$/, '');
    }
    if (process.env.NODE_ENV === 'production') {
      return 'http://api:3001/api';
    }
    const localUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    return localUrl.replace(/\/$/, '');
  }

  // Client-Side in browser:
  // If NEXT_PUBLIC_API_URL is set and not pointing to localhost, use it
  if (process.env.NEXT_PUBLIC_API_URL && !process.env.NEXT_PUBLIC_API_URL.includes('localhost')) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, '');
  }

  // Default for all browser requests in production:
  // Relative '/api' will automatically resolve against current domain (e.g. https://latih.club/api)
  return '/api';
}

/**
 * Builds a clean, fully-qualified endpoint URL:
 * e.g. apiUrl('/auth/login') -> '/api/auth/login' or 'http://api:3001/api/auth/login'
 */
export function apiUrl(endpoint: string): string {
  const base = getApiUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  if (base.endsWith('/api') && cleanEndpoint.startsWith('/api/')) {
    return `${base}${cleanEndpoint.slice(4)}`;
  }
  return `${base}${cleanEndpoint}`;
}
