import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const config = {
  matcher: [
    /*
     * Match all paths except for:
     * 1. /api routes
     * 2. /_next (Next.js internals)
     * 3. /_static (inside /public)
     * 4. all root files inside /public (e.g. favicon.ico)
     */
    '/((?!api/|_next/|_static/|_vercel|[\\w-]+\\.\\w+).*)',
  ],
};

export default function middleware(req: NextRequest) {
  const url = req.nextUrl;
  
  // Get hostname of request (e.g. demo.communityos.com, demo.localhost:3000)
  const hostname = req.headers.get('host')!;
  
  // Extract custom domain or subdomain
  // For local development, we might use community.localhost:3000
  // For production, we use actual domain like mycommunity.com
  
  // Example simplistic logic:
  // If the path starts with something like /_sites, block it directly from users
  if (url.pathname.startsWith(`/_sites`)) {
    return NextResponse.rewrite(new URL(`/404`, req.url));
  }

  // We rewrite based on the path. The PRD says "Default URL: /slug".
  // This means the user goes to `communityos.com/slug`.
  // If the PRD specifically says "Default URL: /slug", then we don't necessarily need subdomain routing by default, but we DO need custom domain routing.
  
  const searchParams = req.nextUrl.searchParams.toString();
  const path = `${url.pathname}${searchParams.length > 0 ? `?${searchParams}` : ''}`;

  // Let's assume our root domain is communityos.com
  // If the hostname is NOT our root domain (meaning it's a custom domain like mycommunity.com),
  // we rewrite to our dynamic route `/[domain]/...`
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost:3000';
  
  if (hostname !== rootDomain && !hostname.includes('localhost')) {
    // Custom domain rewrite
    return NextResponse.rewrite(new URL(`/_sites/${hostname}${path}`, req.url));
  }

  // Otherwise, it's just the default behavior (e.g., /slug goes to app/[slug])
  return NextResponse.next();
}
