'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { setToken } from '../../../lib/auth';
import { Community } from '../../../types';
export default function MemberLogin({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = React.use(params);
  const router = useRouter();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [community, setCommunity] = useState<Community | null>(null);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/communities/${resolvedParams.slug}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => { if(data) setCommunity(data) })
      .catch(console.error);
  }, [resolvedParams.slug]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001') + '/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Login failed');
      }

      const data = await res.json();
      setToken(data.access_token);
      
      // Auto-join them to the community if they haven't already
      try {
        const commRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/communities/${resolvedParams.slug}`);
        if (commRes.ok) {
          const commData = await commRes.json();
          await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001') + '/memberships/join', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${data.access_token}`
            },
            body: JSON.stringify({ communityId: commData.id }),
          });
        }
      } catch (err) {
        console.error('Auto-join failed', err);
      }

      // Redirect to the member dashboard
      router.push(`/${resolvedParams.slug}?tab=dashboard`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 font-sans p-4">
      <div className="max-w-md w-full bg-white rounded-[2rem] shadow-2xl p-8 border border-slate-100">
        <div className="text-center mb-8">
          {community?.logoUrl ? (
            <img src={community.logoUrl} alt={community.name} className="w-20 h-20 rounded-2xl object-cover mx-auto mb-4 border border-slate-200 shadow-sm" />
          ) : (
            <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-black text-indigo-600">{community?.name?.[0] || 'C'}</span>
            </div>
          )}
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Selamat Datang</h2>
          <p className="text-slate-500 mt-2 font-medium">Masuk untuk mengikuti event dan sesi di {community?.name || 'Komunitas'}.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-600 rounded-2xl text-sm font-bold text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Alamat Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 font-medium text-slate-900 transition-all outline-none"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Kata Sandi</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 font-medium text-slate-900 transition-all outline-none"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 hover:-translate-y-0.5 transition-all shadow-xl shadow-indigo-500/25 disabled:opacity-50 disabled:hover:translate-y-0 mt-2"
          >
            {loading ? 'Masuk...' : 'Masuk'}
          </button>
        </form>

        <p className="mt-8 text-center text-slate-500 font-medium">
          Don&apos;t have an account?{' '}
          <Link href={`/${resolvedParams.slug}/register`} className="text-indigo-600 font-bold hover:text-indigo-700">Daftar di sini</Link>
        </p>
        
        <div className="mt-4 text-center">
           <Link href={`/${resolvedParams.slug}`} className="text-sm text-slate-400 font-bold hover:text-slate-600">
            &larr; Kembali ke Komunitas
          </Link>
        </div>
      </div>
    </div>
  );
}
