'use client';
import { getApiUrl } from '../../../lib/api';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAuthHeaders } from '../../../lib/auth';
import { Users, ShieldAlert, ArrowRight, Globe } from 'lucide-react';
import Link from 'next/link';
import { CommunityMember } from '../../../types';

export default function GlobalMembersPage() {
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const fetchMembers = async () => {
      const headers = getAuthHeaders();
      try {
        const res = await fetch(getApiUrl() + '/memberships/all', { headers });
        if (!res.ok) throw new Error('Failed to fetch memberships');
        const data = await res.json();
        setMembers(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };
    fetchMembers();
  }, [router]);

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="animate-pulse flex flex-col items-center">
        <div className="w-16 h-16 bg-indigo-100 rounded-[2rem] flex items-center justify-center mb-6">
          <Users className="w-8 h-8 text-indigo-500" />
        </div>
        <div className="text-slate-400 font-bold tracking-widest uppercase text-xs">Loading Members...</div>
      </div>
    </div>
  );
  
  if (error) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="bg-white border border-red-100 p-10 rounded-[2rem] shadow-xl shadow-red-500/5 max-w-lg text-center">
        <div className="w-16 h-16 bg-red-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
          <ShieldAlert className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Access Denied</h2>
        <p className="text-slate-500">{error}</p>
        <Link href="/" className="mt-8 inline-flex items-center px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl transition-colors">
          Return Home <ArrowRight className="w-4 h-4 ml-2" />
        </Link>
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header - One UI */}
      <div className="mb-10 mt-8">
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-2">Global Members</h1>
        <p className="text-slate-500 text-lg">A comprehensive view of all memberships across the platform.</p>
      </div>

      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50/50">
              <tr>
                <th scope="col" className="px-8 py-5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">User</th>
                <th scope="col" className="px-8 py-5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Community</th>
                <th scope="col" className="px-8 py-5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Role</th>
                <th scope="col" className="px-8 py-5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {members.map((member) => (
                <tr key={member.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-8 py-6 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 w-12 h-12 rounded-[1rem] bg-indigo-50 flex items-center justify-center text-indigo-600 font-extrabold mr-4">
                        {(member.user?.name || 'U').charAt(0)}
                      </div>
                      <div>
                        <div className="text-[15px] font-bold text-slate-900">{member.user?.name || 'Unknown User'}</div>
                        <div className="text-sm text-slate-500">{member.user?.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 whitespace-nowrap">
                    <div className="flex items-center text-sm font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-xl w-max">
                      <Globe className="w-4 h-4 mr-2 text-slate-400" />
                      {member.community?.name}
                    </div>
                  </td>
                  <td className="px-8 py-6 whitespace-nowrap">
                    <span className="text-sm font-medium text-slate-600">{member.role}</span>
                  </td>
                  <td className="px-8 py-6 whitespace-nowrap">
                    <span className={`px-4 py-1.5 inline-flex text-xs font-bold rounded-xl
                      ${member.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600' : 
                        member.status === 'REJECTED' ? 'bg-red-50 text-red-600' : 
                        'bg-amber-50 text-amber-600'}`}>
                      {member.status}
                    </span>
                  </td>
                </tr>
              ))}
              
              {members.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-8 py-16 text-center text-slate-500 font-medium">
                    No memberships found across the platform.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
