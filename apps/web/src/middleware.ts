import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const config = {
  matcher: [
    /*
     * Match all paths except for:
     * 1. /api routes
     * 2. /_next (Next.js internals)
     * 3. /_static (inside /public)
     * 4. all root files inside /public (e.g. favicon.ico, images, logo.svg)
     */
    '/((?!api/|_next/|_static/|_vercel|[\\w-]+\\.\\w+).*)',
  ],
};

export default function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const rawHost = req.headers.get('host') || 'localhost:3000';
  // Strip port from host if present (e.g. latih.club:3000 -> latih.club)
  const hostname = rawHost.split(':')[0].toLowerCase();

  const searchParams = req.nextUrl.searchParams.toString();
  const queryString = searchParams.length > 0 ? `?${searchParams}` : '';
  const pathname = url.pathname;

  // List of primary/root domains that serve the main landing page and standard /:slug paths
  const rootDomains = [
    'latih.club',
    'www.latih.club',
    'communityos.com',
    'www.communityos.com',
    'localhost',
    '127.0.0.1',
  ];
  const configuredRootDomain = (process.env.NEXT_PUBLIC_ROOT_DOMAIN || '').toLowerCase();
  if (configuredRootDomain) {
    rootDomains.push(configuredRootDomain);
    rootDomains.push(`www.${configuredRootDomain.replace(/^www\./, '')}`);
  }

  // Check if current hostname is an IP address
  const isIP = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(hostname);

  // Global Platform Routes that should NOT be rewritten (always served from root)
  const globalRoutes = ['/privacy-policy', '/terms-conditions'];
  if (globalRoutes.some(route => pathname === route || pathname.startsWith(`${route}/`))) {
    return NextResponse.next();
  }

  // If visiting directly via main domain, localhost, or IP:
  // Use standard routing without rewriting! (e.g. /jakartarunners -> app/[slug])
  if (rootDomains.includes(hostname) || isIP || hostname.includes('localhost')) {
    return NextResponse.next();
  }

  // Check if it's a subdomain of latih.club (e.g. jakartarunners.latih.club)
  const isSubdomainOfLatih = hostname.endsWith('.latih.club');
  const isSubdomainOfConfigured = configuredRootDomain && hostname.endsWith(`.${configuredRootDomain}`);

  if (isSubdomainOfLatih || isSubdomainOfConfigured) {
    const mainHost = isSubdomainOfLatih ? 'latih.club' : configuredRootDomain;
    const subdomain = hostname.replace(`.${mainHost}`, '');
    if (subdomain && subdomain !== 'www') {
      // Rewrite subdomain request to /[slug]/path
      // e.g. jakartarunners.latih.club/ -> /jakartarunners
      // e.g. jakartarunners.latih.club/admin -> /jakartarunners/admin
      return NextResponse.rewrite(new URL(`/${subdomain}${pathname}${queryString}`, req.url));
    }
  }

  // Otherwise, it's a completely custom domain (e.g. jakartarunners.com)
  // Rewrite to /[domain]/path so the app/[slug] dynamic route can fetch by domain
  return NextResponse.rewrite(new URL(`/${hostname}${pathname}${queryString}`, req.url));
}
