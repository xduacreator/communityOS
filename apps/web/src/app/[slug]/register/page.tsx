'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { setToken } from '../../../lib/auth';

interface CustomField {
  id: string;
  label: string;
  type: string;
  required: boolean;
  options?: string[];
}

interface Membership {
  id: string;
  name: string;
  durationDays: number;
  price: number;
  status: string;
}

interface CommunityWithMemberships {
  id: string;
  slug: string;
  name: string;
  logo?: string | null;
  registrationMode?: string | null;
  memberships?: Membership[];
  registrationFields?: string | null;
}

export default function MemberRegister({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = React.use(params);
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
  });
  const [community, setCommunity] = useState<CommunityWithMemberships | null>(null);
  const [selectedMembershipId, setSelectedMembershipId] = useState<string>('');
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [customAnswers, setCustomAnswers] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    const fetchCommunity = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/communities/${resolvedParams.slug}`);
        if (res.ok) {
          const data = await res.json() as CommunityWithMemberships;
          setCommunity(data);
          if (data.memberships && data.memberships.length > 0) {
            setSelectedMembershipId(data.memberships[0].id);
          }
          if (data.registrationFields) {
            try {
              const fields = JSON.parse(data.registrationFields) as CustomField[];
              setCustomFields(fields);
              const initial: Record<string, string> = {};
              fields.forEach((f: CustomField) => {
                initial[f.id] = f.type === 'select' ? (f.options?.[0] || '') : '';
              });
              setCustomAnswers(initial);
            } catch {
              setCustomFields([]);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load community details', err);
      }
    };
    fetchCommunity();
  }, [resolvedParams.slug]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 1. Register the user
      const registerRes = await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001') + '/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, role: 'USER' }), // Default to USER role
      });

      if (!registerRes.ok) {
        const errorData = await registerRes.json();
        throw new Error(errorData.message || 'Registration failed');
      }

      // 2. Automatically log them in
      const loginRes = await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001') + '/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, password: formData.password }),
      });

      if (!loginRes.ok) {
        // If login fails, just redirect to login page
        router.push(`/${resolvedParams.slug}/login`);
        return;
      }

      const loginData = await loginRes.json();
      setToken(loginData.access_token);
      
      // Retrieve logged-in user profile to get ID
      const meRes = await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001') + '/auth/me', {
        headers: { 'Authorization': `Bearer ${loginData.access_token}` }
      });
      if (!meRes.ok) throw new Error('Failed to retrieve user details');
      const meData = await meRes.json();
      const userId = meData.id;

      // 3. Auto-join them to the community
      try {
        const commRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/communities/${resolvedParams.slug}`);
        if (commRes.ok) {
          const commData = await commRes.json();

          // Subcribe to paid membership tier upfront if required
          if (commData.registrationMode === 'PAID' && selectedMembershipId) {
            const subRes = await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001') + '/user-membership', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${loginData.access_token}`
              },
              body: JSON.stringify({
                userId,
                communityId: commData.id,
                membershipId: selectedMembershipId
              }),
            });
            if (!subRes.ok) {
              throw new Error('Failed to create paid membership subscription');
            }
          }

          await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001') + '/memberships/join', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${loginData.access_token}`
            },
            body: JSON.stringify({ 
              communityId: commData.id,
              customFieldsData: customFields.length > 0 ? JSON.stringify(customAnswers) : undefined
            }),
          });
        }
      } catch (err) {
        console.error('Auto-join failed', err);
      }
      
      // 4. Redirect them back to the member dashboard
      router.push(`/${resolvedParams.slug}/dashboard`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 font-sans p-4">
      <div className="max-w-xl w-full bg-white rounded-[2rem] shadow-2xl p-8 md:p-10 border border-slate-100">
        <div className="text-center mb-10">
          {community?.logo ? (
            <img src={community.logo} alt={community.name} className="w-20 h-20 rounded-2xl object-cover mx-auto mb-4 border border-slate-200 shadow-sm" />
          ) : (
            <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-black text-emerald-600">{community?.name?.[0] || 'C'}</span>
            </div>
          )}
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Bergabung ke Komunitas</h2>
          <p className="text-slate-500 mt-2 font-medium">Buat akun untuk berpartisipasi di event {community?.name}.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-600 rounded-2xl text-sm font-bold text-center">
            {error}
          </div>
        )}

        {community?.registrationMode === 'PAID' && (
          <div className="mb-6 p-4 bg-indigo-50 border border-indigo-150 rounded-2xl text-indigo-800 text-sm font-semibold flex items-center gap-3 shadow-sm text-left animate-in fade-in slide-in-from-top-4 duration-300">
            <svg className="w-5 h-5 text-indigo-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <div className="font-extrabold text-indigo-900">Pendaftaran Berbayar</div>
              <div className="text-xs text-indigo-700/90 font-medium mt-0.5">Komunitas ini mewajibkan pemilihan paket membership aktif untuk mendaftar.</div>
            </div>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Nama Lengkap</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 font-medium text-slate-900 transition-all outline-none"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Nomor HP / WhatsApp</label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 font-medium text-slate-900 transition-all outline-none"
                placeholder="+62 812..."
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Alamat Email</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 font-medium text-slate-900 transition-all outline-none"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Kata Sandi</label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 font-medium text-slate-900 transition-all outline-none"
              placeholder="••••••••"
            />
          </div>

          {/* Membership Tier upfront selection if paid registration is active */}
          {community?.registrationMode === 'PAID' && (
            <div className="bg-indigo-50/50 p-6 rounded-[1.5rem] border border-indigo-100 space-y-4 text-left">
              <label className="block text-sm font-bold text-slate-700">
                Pilih Paket Membership <span className="text-rose-500">*</span>
              </label>
              {community.memberships && community.memberships.length > 0 ? (
                <div className="space-y-3">
                  {community.memberships.map((m: Membership) => (
                    <label 
                      key={m.id} 
                      className={`flex items-center justify-between p-4 bg-white border rounded-2xl cursor-pointer transition-all hover:border-indigo-400 ${
                        selectedMembershipId === m.id ? 'border-indigo-500 ring-2 ring-indigo-500/10' : 'border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input 
                          type="radio" 
                          name="membershipTier"
                          checked={selectedMembershipId === m.id}
                          onChange={() => setSelectedMembershipId(m.id)}
                          className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-slate-300"
                        />
                        <div className="text-left">
                          <div className="font-bold text-slate-900 text-sm">{m.name}</div>
                          <div className="text-xs font-semibold text-slate-400 mt-0.5">Durasi: {m.durationDays} hari</div>
                        </div>
                      </div>
                      <div className="font-black text-indigo-600 text-sm">
                        Rp {m.price?.toLocaleString('id-ID') || 0}
                      </div>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 bg-white border border-dashed border-red-200 rounded-2xl text-rose-500 font-bold text-xs">
                  ⚠️ Belum ada paket membership aktif yang dikonfigurasi admin. Hubungi pengelola komunitas Anda.
                </div>
              )}
              <p className="text-xs text-slate-400 leading-relaxed text-left">
                Komunitas ini mewajibkan pembelian paket membership aktif saat mendaftar.
              </p>
            </div>
          )}

          {/* Custom Fields */}
          {customFields.map((field) => (
            <div key={field.id}>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                {field.label}
                {field.required && <span className="text-rose-500 ml-1">*</span>}
              </label>
              {field.type === 'textarea' ? (
                <textarea
                  required={field.required}
                  rows={3}
                  value={customAnswers[field.id] || ''}
                  onChange={(e) => setCustomAnswers({ ...customAnswers, [field.id]: e.target.value })}
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 font-medium text-slate-900 transition-all outline-none resize-none"
                />
              ) : field.type === 'select' ? (
                <select
                  required={field.required}
                  value={customAnswers[field.id] || ''}
                  onChange={(e) => setCustomAnswers({ ...customAnswers, [field.id]: e.target.value })}
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 font-bold text-slate-900 transition-all outline-none"
                >
                  {(field.options || []).map((opt: string) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              ) : (
                <input
                  type={field.type}
                  required={field.required}
                  value={customAnswers[field.id] || ''}
                  onChange={(e) => setCustomAnswers({ ...customAnswers, [field.id]: e.target.value })}
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 font-medium text-slate-900 transition-all outline-none"
                />
              )}
            </div>
          ))}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 hover:-translate-y-0.5 transition-all shadow-xl shadow-emerald-500/25 disabled:opacity-50 disabled:hover:translate-y-0 mt-2"
          >
            {loading ? 'Membuat akun...' : 'Buat Akun'}
          </button>
        </form>

        <p className="mt-8 text-center text-slate-500 font-medium">
          Already have an account?{' '}
          <Link href={`/${resolvedParams.slug}/login`} className="text-emerald-600 font-bold hover:text-emerald-700">
            Log in here
          </Link>
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
