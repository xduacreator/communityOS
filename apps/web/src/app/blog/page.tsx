import Link from 'next/link';
import { getApiUrl } from '../../lib/api';

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
        return await res.json();
      }
    } catch {
      // Try next
    }
  }
  return {};
}

async function getBlogPosts() {
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
        ? `${cleanBase}/blog-post`
        : `${cleanBase}/api/blog-post`;

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
  return [];
}

export const metadata = {
  title: 'Blog - Latih.club',
  description: 'Artikel, tips, dan panduan untuk mengelola bisnis kelas, keanggotaan, dan akademi olahraga.',
};

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  cluster: string | null;
  excerpt: string | null;
  featuredImage: string | null;
  isPublished: boolean;
  createdAt: string;
}

export default async function BlogPage() {
  const [posts, settings] = await Promise.all([
    getBlogPosts(),
    getSettings()
  ]);
  const publishedPosts = posts.filter((p: BlogPost) => p.isPublished);

  return (
    <div className="min-h-screen bg-[#fafbfc] text-slate-900 pt-32 pb-24">
      {/* Navbar */}
      <header className="fixed top-0 inset-x-0 bg-white/80 backdrop-blur-2xl z-50 border-b border-slate-200/60 shadow-sm shadow-slate-900/5 transition-all duration-300">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 h-16 sm:h-20 flex justify-between items-center gap-2">
          <Link href="/" className="flex items-center group shrink-0">
            <img 
              src={settings['platform.logo'] || '/images/logo.svg'} 
              alt={settings['platform.name'] || 'Latih.Club'} 
              className="h-8 transition-transform group-hover:scale-105"
            />
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="/" className="text-sm font-bold text-slate-600 hover:text-indigo-600 transition-colors">
              Kembali ke Beranda
            </Link>
          </nav>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 lg:px-10">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-black text-slate-900 mb-4">Blog {settings['platform.name'] || 'Latih.club'}</h1>
          <p className="text-slate-600">Panduan dan wawasan terbaik untuk mengembangkan bisnis komunitas & kelas Anda.</p>
        </div>

        {publishedPosts.length === 0 ? (
          <div className="text-center py-20 text-slate-500">
            Belum ada artikel yang diterbitkan.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {publishedPosts.map((post: BlogPost) => (
              <Link key={post.id} href={`/blog/${post.slug}`} className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-xl transition-all group flex flex-col">
                {post.featuredImage && (
                  <div className="h-48 overflow-hidden bg-slate-100">
                    <img src={post.featuredImage} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                )}
                <div className="p-6 flex flex-col flex-1">
                  {post.cluster && (
                    <span className="text-xs font-extrabold text-indigo-600 uppercase tracking-wider mb-2">{post.cluster}</span>
                  )}
                  <h2 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-indigo-600 transition-colors">{post.title}</h2>
                  <p className="text-sm text-slate-600 mb-6 flex-1 line-clamp-3">{post.excerpt || 'Baca artikel selengkapnya...'}</p>
                  <div className="text-xs text-slate-400 mt-auto pt-4 border-t border-slate-100">
                    {new Date(post.createdAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
