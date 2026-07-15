'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function MemberDashboard({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = React.use(params);
  const router = useRouter();

  useEffect(() => {
    router.replace(`/${resolvedParams.slug}?tab=dashboard`);
  }, [resolvedParams.slug, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="animate-pulse flex flex-col items-center">
        <div className="w-12 h-12 bg-indigo-200 rounded-full mb-4"></div>
        <div className="text-slate-400 font-medium">Redirecting to Dashboard...</div>
      </div>
    </div>
  );
}
