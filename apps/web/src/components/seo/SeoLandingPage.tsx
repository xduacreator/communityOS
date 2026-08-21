import Link from 'next/link';
import { ArrowRight, CheckCircle2, ChevronDown } from 'lucide-react';

interface SeoLandingPageProps {
  data: {
    title: string;
    h1: string;
    summaryParagraph: string;
    faqContent?: string;
  };
}

export default function SeoLandingPage({ data }: SeoLandingPageProps) {
  let faqs = [];
  try {
    if (data.faqContent) {
      faqs = JSON.parse(data.faqContent);
    }
  } catch (e) {
    console.error('Invalid FAQ JSON');
  }

  // Schema Markup for FAQPage (Great for SEO/SGE)
  interface FAQ {
    question: string;
    answer?: string;
    intro?: string;
    list?: string[];
    outro?: string;
  }

  const faqSchema = faqs.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map((faq: FAQ) => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer || [faq.intro, faq.list ? faq.list.map(l => `- ${l}`).join('\n') : '', faq.outro].filter(Boolean).join('\n\n')
      }
    }))
  } : null;

  return (
    <div className="min-h-screen bg-[#fafbfc] text-slate-900 font-sans selection:bg-indigo-500 selection:text-white">
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}

      {/* Hero Section */}
      <section className="relative px-4 sm:px-6 lg:px-10 max-w-[1400px] mx-auto pt-24 sm:pt-32 pb-16 sm:pb-20 text-center">
        <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1500px] h-[900px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-200/50 via-purple-100/30 to-transparent blur-3xl"></div>
        </div>

        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight mb-8 leading-[1.1]">
            {data.h1}
          </h1>
          
          <p className="text-lg sm:text-xl text-slate-600 leading-relaxed mb-12 font-medium max-w-3xl mx-auto">
            {data.summaryParagraph}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a 
              href="https://wa.me/6287722125859?text=Halo%20tim%20Latih.Club,%20saya%20ingin%20konsultasi%20mengenai%20platform%20ini" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="flex items-center justify-center gap-3 px-8 py-4 text-sm font-extrabold rounded-2xl text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 transition-all shadow-xl hover:-translate-y-1 w-full sm:w-auto"
            >
              <span>Konsultasi dengan Expert</span>
              <ArrowRight className="w-4 h-4" />
            </a>
            <Link 
              href="/"
              className="flex items-center justify-center gap-2 px-8 py-4 text-sm font-extrabold rounded-2xl text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-all shadow-sm w-full sm:w-auto"
            >
              Ke Halaman Utama
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      {faqs.length > 0 && (
        <section className="py-20 px-6 lg:px-10 max-w-[1000px] mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-slate-900">Pertanyaan yang Sering Diajukan</h2>
          </div>
          <div className="space-y-6">
            {faqs.map((faq: FAQ, idx: number) => (
              <details key={idx} className="group bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <summary className="p-6 sm:p-8 cursor-pointer list-none flex items-center justify-between outline-none [&::-webkit-details-marker]:hidden">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0 mt-0.5" />
                    <h3 className="text-xl font-bold text-slate-900 m-0">{faq.question}</h3>
                  </div>
                  <ChevronDown className="w-5 h-5 text-slate-400 group-open:rotate-180 transition-transform ml-4 shrink-0" />
                </summary>
                <div className="px-6 sm:px-8 pb-6 sm:pb-8 pt-0 ml-9 text-slate-600 leading-relaxed">
                  {faq.answer && <p className="mb-2 whitespace-pre-wrap">{faq.answer}</p>}
                  {faq.intro && <p className="mb-3 whitespace-pre-wrap">{faq.intro}</p>}
                  {faq.list && faq.list.length > 0 && (
                    <ul className="list-disc list-outside ml-5 mb-3 space-y-1">
                      {faq.list.map((item, i) => <li key={i}>{item}</li>)}
                    </ul>
                  )}
                  {faq.outro && <p className="whitespace-pre-wrap">{faq.outro}</p>}
                </div>
              </details>
            ))}
          </div>
        </section>
      )}

      {/* Footer CTA */}
      <section className="py-20 px-6 lg:px-10 max-w-[1300px] mx-auto text-center">
        <div className="bg-gradient-to-br from-indigo-950 to-purple-950 rounded-[3rem] p-12 sm:p-20 shadow-2xl relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-6">Mulai Transformasi Bisnis Anda Hari Ini</h2>
            <p className="text-indigo-200 mb-10 max-w-2xl mx-auto">Bergabung dengan ratusan pemilik bisnis lainnya yang sudah mendigitalisasi operasional mereka bersama Latih.club.</p>
            <a 
              href="https://wa.me/6287722125859" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="inline-flex items-center justify-center gap-3 px-10 py-5 text-sm font-black rounded-2xl text-slate-900 bg-white hover:bg-indigo-50 transition-all hover:scale-105"
            >
              Dapatkan Demo Gratis
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
