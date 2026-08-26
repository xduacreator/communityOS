import React from 'react';
import Link from 'next/link';

import { getApiUrl } from '../../../lib/api';

interface CustomPageData {
  title: string;
  content: string;
}

async function getSettings(): Promise<Record<string, string>> {
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
        ? `${cleanBase}/system-settings`
        : `${cleanBase}/api/system-settings`;

      const res = await fetch(url, {
        next: { revalidate: 5 },
        signal: AbortSignal.timeout(3000),
      });

      if (res.ok) {
        const data = await res.json();
        const obj: Record<string, string> = {};
        data.forEach((s: any) => {
          obj[s.key] = s.value;
        });
        return obj;
      }
    } catch {
      // Try next
    }
  }
  return {};
}

export default async function CustomPageView({ data }: { data: CustomPageData }) {
  const settings = await getSettings();
  
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Simple Header */}
      <header className="bg-white border-b border-slate-200 py-4 px-6 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <img 
              src={settings['platform.logo'] || '/images/logo.svg'} 
              alt={settings['platform.name'] || 'Latih.Club'} 
              className="h-8 transition-transform group-hover:scale-105"
            />
          </Link>
          <Link href="/" className="text-sm font-semibold text-slate-500 hover:text-indigo-600 transition-colors">
            Kembali ke Beranda
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-4xl mx-auto w-full px-6 py-12 md:py-20">
        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-slate-200">
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-8 border-b border-slate-100 pb-6">{data.title}</h1>
          <article 
            className="prose prose-slate prose-lg max-w-none prose-headings:font-bold prose-a:text-indigo-600 hover:prose-a:text-indigo-500"
            dangerouslySetInnerHTML={{ __html: data.content }}
          />
        </div>
      </main>

      {/* Simple Footer */}
      <footer className="bg-white border-t border-slate-200 py-8">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-sm font-medium text-slate-500">
            © {new Date().getFullYear()} Latih.Club. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
