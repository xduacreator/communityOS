/**
 * Helper to get the correct API Base URL
 * - Server-side (SSR / Node.js in Docker): Uses INTERNAL_API_URL ('http://api:3001/api')
 * - Client-side (Browser): Uses NEXT_PUBLIC_API_URL ('/api' or full URL)
 */
export function getApiUrl(): string {
  if (typeof window === 'undefined') {
    // Server-Side Rendering
    const serverUrl = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://api:3001/api';
    return serverUrl.replace(/\/$/, '');
  }

  // Client-Side in browser
  const clientUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
  return clientUrl.replace(/\/$/, '');
}
