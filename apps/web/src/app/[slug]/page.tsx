import { notFound } from 'next/navigation';
import CommunityMicrosite from '../../components/CommunityMicrosite';
import SeoLandingPage from '../../components/seo/SeoLandingPage';
import { getApiUrl } from '../../lib/api';

async function getCommunityData(slug: string) {
  const candidateUrls = [
    process.env.INTERNAL_API_URL,
    'http://api:3001/api',
    getApiUrl(),
    'http://localhost:3001/api',
    'http://127.0.0.1:3001/api',
  ].filter(Boolean) as string[];

  const uniqueUrls = Array.from(new Set(candidateUrls));

  for (const baseUrl of uniqueUrls) {
    try {
      const cleanBase = baseUrl.replace(/\/$/, '');
      const url = cleanBase.endsWith('/api')
        ? `${cleanBase}/communities/${slug}`
        : `${cleanBase}/api/communities/${slug}`;

      const res = await fetch(url, {
        cache: 'no-store',
        signal: AbortSignal.timeout(3000),
      });

      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Try next endpoint candidate
    }
  }

  return null;
}

async function getLandingPageData(slug: string) {
  const candidateUrls = [
    process.env.INTERNAL_API_URL,
    'http://api:3001/api',
    getApiUrl(),
    'http://localhost:3001/api',
    'http://127.0.0.1:3001/api',
  ].filter(Boolean) as string[];

  const uniqueUrls = Array.from(new Set(candidateUrls));

  for (const baseUrl of uniqueUrls) {
    try {
      const cleanBase = baseUrl.replace(/\/$/, '');
      const url = cleanBase.endsWith('/api')
        ? `${cleanBase}/landing-page/${slug}`
        : `${cleanBase}/api/landing-page/${slug}`;

      const res = await fetch(url, {
        next: { revalidate: 60 },
        signal: AbortSignal.timeout(3000),
      });

      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Try next
    }
  }
  return null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  
  // First check if it's a community
  const community = await getCommunityData(resolvedParams.slug);
  if (community) {
    return {
      title: community.seoTitle || community.name,
      description: community.seoDescription || community.about || `Welcome to ${community.name}`,
      keywords: community.seoKeywords || 'community, platform, groups',
      openGraph: {
        title: community.seoTitle || community.name,
        description: community.seoDescription || community.about || `Welcome to ${community.name}`,
        images: community.heroBanner || community.logo ? [community.heroBanner || community.logo] : [],
      },
    };
  }

  // If not a community, check if it's an SEO Landing Page
  const landingPage = await getLandingPageData(resolvedParams.slug);
  if (landingPage && landingPage.isActive) {
    return {
      title: landingPage.title,
      description: landingPage.summaryParagraph || landingPage.h1,
      keywords: landingPage.targetKeywords || '',
      openGraph: {
        title: landingPage.title,
        description: landingPage.summaryParagraph || landingPage.h1,
      },
    };
  }

  return {
    title: 'Not Found',
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  
  // Attempt to load Community
  const community = await getCommunityData(resolvedParams.slug);
  if (community) {
    return <CommunityMicrosite community={community} slug={resolvedParams.slug} />;
  }

  // Attempt to load SEO Landing Page
  const landingPage = await getLandingPageData(resolvedParams.slug);
  if (landingPage && landingPage.isActive) {
    return <SeoLandingPage data={landingPage} />;
  }

  // If neither, return 404
  notFound();
}
