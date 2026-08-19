import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from '../components/AuthProvider';

export async function generateMetadata(): Promise<Metadata> {
  let faviconUrl = '/favicon.ico';
  try {
    const apiUrl = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL;
    if (apiUrl) {
      const res = await fetch(`${apiUrl}/system-settings/platform.favicon`, { 
        next: { revalidate: 60 } // Cache for 60 seconds
      });
      if (res.ok) {
        const text = await res.text();
        if (text) faviconUrl = text;
      }
    }
  } catch (error) {
    console.error('Failed to fetch favicon:', error);
  }

  return {
    title: "Latih.Club - Platform Manajemen Kelas & Komunitas",
    description: "Platform all-in-one untuk membangun, mengelola, dan melejitkan bisnis kelas & aktivitas Anda.",
    icons: {
      icon: faviconUrl,
    }
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className="font-sans antialiased text-slate-800 bg-slate-50"
      >
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
