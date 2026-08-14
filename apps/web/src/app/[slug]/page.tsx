import { notFound } from 'next/navigation';
import CommunityMicrosite from '../../components/CommunityMicrosite';
import { getApiUrl } from '../../lib/api';

async function getCommunityData(slug: string) {
  try {
    const apiUrl = getApiUrl();
    const res = await fetch(`${apiUrl}/communities/${slug}`, {
      cache: 'no-store',
    });
    
    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error('Failed to fetch data');
    }
    
    return res.json();
  } catch (error) {
    console.error(error);
    return null;
  }
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
