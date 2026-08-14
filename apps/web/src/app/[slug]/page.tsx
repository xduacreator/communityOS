import { notFound } from 'next/navigation';
import CommunityMicrosite from '../../components/CommunityMicrosite';
import { getApiUrl } from '../../lib/api';

async function getCommunityData(slug: string) {
  const candidateUrls = [
    process.env.INTERNAL_API_URL,
    'http://api:3001/api',
    getApiUrl(),
    'http://localhost:3001/api',
    'http://127.0.0.1:3001/api',
  ].filter(Boolean) as string[];

  // Remove duplicate URLs
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
      if (res.status === 404) {
        // Community not found in this backend
        return null;
      }
    } catch {
      // Try next endpoint candidate
    }
  }

  return null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const community = await getCommunityData(resolvedParams.slug);

  if (!community) {
    return {
      title: 'Community Not Found',
    };
  }

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

export default async function CommunityPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const community = await getCommunityData(resolvedParams.slug);

  if (!community) {
    notFound();
  }

  return (
    <CommunityMicrosite community={community} slug={resolvedParams.slug} />
  );
}
