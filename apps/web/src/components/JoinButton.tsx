'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAuthHeaders } from '../lib/auth';
import { LogIn, X } from 'lucide-react';

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

export default function JoinButton({ 
  communityId, 
  slug, 
  registrationFields,
  registrationMode,
  memberships,
  className,
  label
}: { 
  communityId: string; 
  slug: string; 
  registrationFields?: string | null;
  registrationMode?: string | null;
  memberships?: Membership[];
  className?: string;
  label?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [fields, setFields] = useState<CustomField[]>([]);
  const [formAnswers, setFormAnswers] = useState<Record<string, string>>({});
  const [selectedMembershipId, setSelectedMembershipId] = useState<string>('');
  const router = useRouter();

  useEffect(() => {
    if (registrationFields) {
      try {
        setFields(JSON.parse(registrationFields));
      } catch {
        setFields([]);
      }
    } else {
      setFields([]);
    }
  }, [registrationFields]);

  useEffect(() => {
    if (memberships && memberships.length > 0) {
      setSelectedMembershipId(memberships[0].id);
    }
  }, [memberships]);

  const handleStartJoin = () => {
    const headers = getAuthHeaders();
    if (!headers.Authorization) {
      router.push(`/${slug}/login`);
      return;
    }

    if (fields.length > 0 || registrationMode === 'PAID') {
      // Initialize form answers
      const initialAnswers: Record<string, string> = {};
      fields.forEach(f => {
        initialAnswers[f.id] = f.type === 'select' ? (f.options?.[0] || '') : '';
      });
      setFormAnswers(initialAnswers);
      setShowModal(true);
    } else {
      submitJoin();
    }
  };

  const submitJoin = async (answers?: Record<string, string>) => {
    setLoading(true);
    setError('');
    const headers = getAuthHeaders();

    try {
      // 1. If paid registration is active, subscribe user to selected membership first
      if (registrationMode === 'PAID' && selectedMembershipId) {
        const meRes = await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001') + '/auth/me', { headers });
        if (!meRes.ok) throw new Error('Please login again');
        const meData = await meRes.json();
        const userId = meData.id;

        const subRes = await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001') + '/user-membership', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...headers
          },
          body: JSON.stringify({
            userId,
            communityId,
            membershipId: selectedMembershipId
          }),
        });
        if (!subRes.ok) {
          throw new Error('Failed to create paid membership subscription');
        }
      }

      // 2. Submit join request
      const res = await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001') + '/memberships/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: JSON.stringify({ 
          communityId,
          customFieldsData: answers ? JSON.stringify(answers) : undefined
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to join community');
      }

      setShowModal(false);
      router.push(`/${slug}?tab=dashboard`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitJoin(formAnswers);
  };

  const defaultButtonClass = "group w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-50";

  return (
    <>
      <button 
        type="button"
        onClick={handleStartJoin}
        disabled={loading}
        className={className || defaultButtonClass}
      >
        {loading ? 'Joining...' : (
          <>
            {label || 'Gabung Komunitas'}
            <LogIn className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </>
        )}
      </button>
      {error && <p className="mt-2 text-sm text-red-600 text-center bg-red-50 p-2 rounded">{error}</p>}

      {/* Modal Dialog */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-950">Formulir Pendaftaran</h3>
                <p className="text-sm text-slate-500 mt-1">Silakan lengkapi data profil komunitas Anda.</p>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500 hover:text-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {registrationMode === 'PAID' && (
              <div className="mx-6 mt-4 p-4 bg-indigo-50 border border-indigo-100 rounded-2xl text-indigo-800 text-xs font-semibold flex items-center gap-2.5 shadow-sm text-left">
                <svg className="w-5 h-5 text-indigo-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <div className="font-extrabold text-indigo-950">Pendaftaran Berbayar</div>
                  <div className="text-[10px] text-indigo-700/90 font-medium mt-0.5">Komunitas ini mewajibkan pemilihan paket membership aktif untuk mendaftar.</div>
                </div>
              </div>
            )}

            {/* Content */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
              
              {/* Membership Tier select radio group if paid registration is active */}
              {registrationMode === 'PAID' && memberships && memberships.length > 0 && (
                <div className="bg-indigo-50/50 p-5 rounded-2xl border border-indigo-100 space-y-3">
                  <label className="block text-sm font-bold text-slate-700">
                    Pilih Paket Membership <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-2">
                    {memberships.map((m) => (
                      <label 
                        key={m.id} 
                        className={`flex items-center justify-between p-3 bg-white border rounded-xl cursor-pointer transition-all hover:border-indigo-400 ${
                          selectedMembershipId === m.id ? 'border-indigo-500 ring-2 ring-indigo-500/10' : 'border-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input 
                            type="radio" 
                            name="joinMembershipTier"
                            checked={selectedMembershipId === m.id}
                            onChange={() => setSelectedMembershipId(m.id)}
                            className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-slate-300"
                          />
                          <div className="text-left">
                            <div className="font-bold text-slate-900 text-xs">{m.name}</div>
                            <div className="text-[10px] font-semibold text-slate-400">Durasi: {m.durationDays} hari</div>
                          </div>
                        </div>
                        <div className="font-black text-indigo-600 text-xs">
                          Rp {m.price?.toLocaleString('id-ID') || 0}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {fields.map((field) => (
                <div key={field.id} className="space-y-2 text-left">
                  <label className="block text-sm font-bold text-slate-700">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  
                  {field.type === 'textarea' ? (
                    <textarea
                      required={field.required}
                      rows={3}
                      value={formAnswers[field.id] || ''}
                      onChange={(e) => setFormAnswers({ ...formAnswers, [field.id]: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-medium text-sm resize-none"
                    />
                  ) : field.type === 'select' ? (
                    <select
                      required={field.required}
                      value={formAnswers[field.id] || ''}
                      onChange={(e) => setFormAnswers({ ...formAnswers, [field.id]: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-semibold text-sm"
                    >
                      {(field.options || []).map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={field.type}
                      required={field.required}
                      value={formAnswers[field.id] || ''}
                      onChange={(e) => setFormAnswers({ ...formAnswers, [field.id]: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-medium text-sm"
                    />
                  )}
                </div>
              ))}

              {/* Actions */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 mt-6">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="px-5 py-3 font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all text-sm"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 transition-all text-sm disabled:opacity-50"
                >
                  {loading ? 'Mengirim...' : 'Kirim Pendaftaran'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
