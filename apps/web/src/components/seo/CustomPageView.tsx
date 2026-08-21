import React from 'react';
import Link from 'next/link';

interface CustomPageData {
  title: string;
  content: string;
}

export default function CustomPageView({ data }: { data: CustomPageData }) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Simple Header */}
      <header className="bg-white border-b border-slate-200 py-4 px-6 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white flex items-center justify-center font-black text-lg md:text-xl shadow-md group-hover:shadow-indigo-500/25 transition-all">
              L
            </div>
            <span className="font-extrabold text-lg md:text-xl tracking-tight text-slate-900">
              Latih<span className="text-indigo-600">.club</span>
            </span>
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
