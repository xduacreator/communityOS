import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getApiUrl } from '../../../lib/api';

async function getBlogPost(slug: string) {
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
        ? `${cleanBase}/blog-post/${slug}`
        : `${cleanBase}/api/blog-post/${slug}`;

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
  const post = await getBlogPost(resolvedParams.slug);

  if (!post || !post.isPublished) {
    return { title: 'Not Found' };
  }

  return {
    title: post.metaTitle || `${post.title} | Latih.club Blog`,
    description: post.metaDescription || post.excerpt || `Membaca artikel ${post.title}`,
    openGraph: {
      title: post.metaTitle || post.title,
      description: post.metaDescription || post.excerpt,
      images: post.featuredImage ? [post.featuredImage] : [],
    },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const post = await getBlogPost(resolvedParams.slug);

  if (!post || !post.isPublished) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 pt-24 pb-24">
      <div className="max-w-3xl mx-auto px-6">
        <Link href="/blog" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-indigo-600 mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Blog
        </Link>

        {post.cluster && (
          <div className="mb-4">
            <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold">{post.cluster}</span>
          </div>
        )}

        <h1 className="text-3xl md:text-5xl font-black text-slate-900 mb-6 leading-tight">{post.title}</h1>
        
        <div className="flex items-center gap-4 text-sm text-slate-500 mb-10 pb-10 border-b border-slate-100">
          <span>Ditulis pada {new Date(post.createdAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>

        {post.featuredImage && (
          <div className="mb-10 rounded-2xl overflow-hidden bg-slate-100 aspect-video">
            <img src={post.featuredImage} alt={post.title} className="w-full h-full object-cover" />
          </div>
        )}

        {/* Prose Content */}
        <article 
          className="prose prose-slate prose-lg max-w-none prose-headings:font-bold prose-a:text-indigo-600 hover:prose-a:text-indigo-500"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        <div className="mt-16 pt-10 border-t border-slate-100">
          <div className="bg-slate-50 rounded-2xl p-8 text-center border border-slate-200">
            <h3 className="text-xl font-bold text-slate-900 mb-3">Siap Mengelola Kelas Anda dengan Lebih Mudah?</h3>
            <p className="text-slate-600 mb-6 text-sm">Coba Latih.club sekarang dan lihat bagaimana platform kami dapat menghemat waktu operasional Anda.</p>
            <a href="https://wa.me/6287722125859" target="_blank" rel="noopener noreferrer" className="inline-flex px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-700 transition-colors">
              Mulai Konsultasi Gratis
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
