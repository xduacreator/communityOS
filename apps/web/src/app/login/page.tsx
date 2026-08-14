'use client';
import { getApiUrl } from '../../lib/api';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CommunityMember } from '../../types';
import { setToken } from '../../lib/auth';

import { ArrowRight, Mail, Lock } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(getApiUrl() + '/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        throw new Error('Invalid credentials');
      }

      const data = await res.json();
      setToken(data.access_token);
      
      // Fetch user profile to determine redirect
      const meRes = await fetch(getApiUrl() + '/auth/me', {
        headers: { 'Authorization': `Bearer ${data.access_token}` },
        cache: 'no-store'
      });
      if (meRes.ok) {
        const meData = await meRes.json();

        // Priority 1: Community Admin -> go to community CMS
        const adminMembership = (meData.memberships as CommunityMember[] | undefined)?.find((m) => m.role === 'COMMUNITY_ADMIN');
        if (adminMembership && adminMembership.community) {
          router.push(`/${adminMembership.community.slug}/admin`);
          return;
        }

        // Priority 2: Super Admin -> go to super-admin dashboard
        if (meData.isSuperAdmin) {
          router.push('/super-admin');
          return;
        }

        // Priority 3: Regular Member -> go to community public page
        const regularMembership = (meData.memberships as CommunityMember[] | undefined)?.find((m) => m.role === 'MEMBER');
        if (regularMembership && regularMembership.community) {
          router.push(`/${regularMembership.community.slug}`);
          return;
        }
      }
      
      router.push('/'); 
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Pane - Form */}
      <div className="flex-1 flex items-center justify-center bg-white px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900 tracking-tight">
              Welcome back
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Sign in to your account to continue
            </p>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleLogin}>
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Email address</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    name="email"
                    type="email"
                    required
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-shadow"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    name="password"
                    type="password"
                    required
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-shadow"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-50"
              >
                {loading ? 'Signing in...' : 'Sign in'}
                {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Right Pane - Visual */}
      <div className="hidden lg:flex lg:flex-1 relative bg-slate-900">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600 to-cyan-500 opacity-90" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-30" />
        <div className="relative z-10 w-full flex items-center justify-center p-12">
          <div className="max-w-lg text-white">
            <h1 className="text-5xl font-bold mb-6">Connect, collaborate, and grow together.</h1>
            <p className="text-xl text-indigo-100 opacity-90">
              Latih.Club is your modern platform for managing events, memberships, and engaging with your tribe.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
