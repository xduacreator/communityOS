import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from '../components/AuthProvider';

import Script from 'next/script';

// Helper to fetch settings since both generateMetadata and RootLayout need them
async function getSystemSettings() {
  try {
    const apiUrl = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL;
    if (apiUrl) {
      const res = await fetch(`${apiUrl}/system-settings`, { 
        next: { revalidate: 60 } // Cache for 60 seconds
      });
      if (res.ok) {
        return await res.json();
      }
    }
  } catch (error) {
    console.error('Failed to fetch system settings:', error);
  }
  return {};
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSystemSettings();
  const faviconUrl = settings['platform.favicon'] || '/favicon.ico';
  const googleSiteVerification = settings['seo.google_site_verification'] || undefined;

  return {
    title: "Latih.Club - Platform Manajemen Kelas & Komunitas",
    description: "Platform all-in-one untuk membangun, mengelola, dan melejitkan bisnis kelas & aktivitas Anda.",
    icons: {
      icon: faviconUrl,
    },
    verification: {
      google: googleSiteVerification,
    }
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getSystemSettings();
  const gtmId = settings['seo.google_tag_manager'];

  return (
    <html lang="en">
      <body
        className="font-sans antialiased text-slate-800 bg-slate-50"
      >
        {gtmId && (
          <noscript>
            <iframe src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
            height="0" width="0" style={{ display: 'none', visibility: 'hidden' }}></iframe>
          </noscript>
        )}

        <AuthProvider>
          {children}
        </AuthProvider>

        {gtmId && (
          <Script id="google-tag-manager" strategy="afterInteractive">
            {`
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','${gtmId}');
            `}
          </Script>
        )}
      </body>
    </html>
  );
}
