import { notFound } from 'next/navigation';
import CommunityMicrosite from '../../../components/CommunityMicrosite';
import { clubMetadata, getClubBase, getCommunity } from '../../../lib/club-server';
import SeoLandingPage from '../../../components/seo/SeoLandingPage';
import CustomPageView from '../../../components/seo/CustomPageView';
import { getCustomPageData, getLandingPageData } from '../../../lib/slug-pages';

const getCommunityData = getCommunity;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  
  // First check if it's a community
  const community = await getCommunityData(resolvedParams.slug);
  if (community) {
    return clubMetadata(community);
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

  // If not an SEO landing page, check if it's a Custom Page
  const customPage = await getCustomPageData(resolvedParams.slug);
  if (customPage && customPage.isActive) {
    return {
      title: `${customPage.title} | Latih.Club`,
      description: customPage.title,
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
    const base = await getClubBase(resolvedParams.slug);
    return <CommunityMicrosite community={community} slug={resolvedParams.slug} view="home" base={base} />;
  }

  // Attempt to load SEO Landing Page
  const landingPage = await getLandingPageData(resolvedParams.slug);
  if (landingPage && landingPage.isActive) {
    return <SeoLandingPage data={landingPage} />;
  }

  // Attempt to load Custom Page
  const customPage = await getCustomPageData(resolvedParams.slug);
  if (customPage && customPage.isActive) {
    return <CustomPageView data={customPage} />;
  }

  // If neither, return 404
  notFound();
}

