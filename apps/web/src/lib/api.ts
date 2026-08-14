/**
 * Helper to get the correct API Base URL
 * - Server-side (SSR in Docker): Prioritizes INTERNAL_API_URL or http://api:3001/api
 * - Client-side (Browser): Uses NEXT_PUBLIC_API_URL or relative /api
 */
export function getApiUrl(): string {
  if (typeof window === 'undefined') {
    // Server-Side Rendering
    if (process.env.INTERNAL_API_URL) {
      return process.env.INTERNAL_API_URL.replace(/\/$/, '');
    }
    // In production container, always route to internal Docker service
    if (process.env.NODE_ENV === 'production') {
      return 'http://api:3001/api';
    }
    const localUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    return localUrl.replace(/\/$/, '');
  }

  // Client-Side in browser
  const clientUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
  return clientUrl.replace(/\/$/, '');
}
