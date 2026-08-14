'use client';
import { getApiUrl } from '../../../lib/api';

import { useEffect, useState } from 'react';
import { getAuthHeaders } from '../../../lib/auth';
import { Fingerprint, ShieldAlert, ArrowRight, ShieldCheck, Plus, X } from 'lucide-react';
import Link from 'next/link';
import { User } from '../../../types';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Create User State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', isSuperAdmin: false });

  const fetchUsers = async () => {
    const headers = getAuthHeaders();
    try {
      const res = await fetch(getApiUrl() + '/users', { headers });
      if (!res.ok) throw new Error('Failed to fetch users');
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const toggleSuperAdmin = async (userId: string, currentStatus: boolean) => {
    try {
      const headers = getAuthHeaders();
      const res = await fetch(`${getApiUrl()}/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({ isSuperAdmin: !currentStatus }),
      });
      if (!res.ok) throw new Error('Failed to update role');
      fetchUsers();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const headers = getAuthHeaders();
      const res = await fetch(getApiUrl() + '/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify(newUser),
      });

      if (!res.ok) throw new Error('Failed to create user');
      
      setCreateModalOpen(false);
      setNewUser({ name: '', email: '', password: '', isSuperAdmin: false });
      fetchUsers();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="animate-pulse flex flex-col items-center">
        <div className="w-16 h-16 bg-indigo-100 rounded-[2rem] flex items-center justify-center mb-6">
          <Fingerprint className="w-8 h-8 text-indigo-500" />
        </div>
        <div className="text-slate-400 font-bold tracking-widest uppercase text-xs">Loading Users...</div>
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
    <div className="max-w-5xl mx-auto">
      {/* Header - One UI */}
      <div className="flex flex-col sm:flex-row justify-between items-end mb-10 mt-8 gap-4">
        <div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-2">Users & Roles</h1>
          <p className="text-slate-500 text-lg">Manage global platform users and administrative roles.</p>
        </div>
        <button 
          onClick={() => setCreateModalOpen(true)}
          className="flex items-center px-6 py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-indigo-600 hover:shadow-lg hover:shadow-indigo-500/25 transition-all duration-300"
        >
          <Plus className="w-5 h-5 mr-2" />
          Register User
        </button>
      </div>

      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50/50">
              <tr>
                <th scope="col" className="px-8 py-5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Admin</th>
                <th scope="col" className="px-8 py-5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Joined Date</th>
                <th scope="col" className="px-8 py-5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Role</th>
                <th scope="col" className="px-8 py-5 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {users.filter(u => u.isSuperAdmin).map((user) => (
                <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-8 py-6 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 w-12 h-12 rounded-[1rem] bg-indigo-50 flex items-center justify-center text-indigo-600 font-extrabold mr-4">
                        {(user.name || 'A').charAt(0)}
                      </div>
                      <div>
                        <div className="text-[15px] font-bold text-slate-900">{user.name}</div>
                        <div className="text-sm text-slate-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 whitespace-nowrap text-sm font-semibold text-slate-500">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-8 py-6 whitespace-nowrap">
                    <span className="inline-flex items-center px-3 py-1.5 rounded-xl bg-violet-50 border border-violet-100 text-violet-750 text-xs font-bold uppercase tracking-wider">
                      <ShieldCheck className="w-3.5 h-3.5 mr-1 text-violet-600" /> Super Admin
                    </span>
                  </td>
                  <td className="px-8 py-6 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => toggleSuperAdmin(user.id, user.isSuperAdmin)}
                      className="px-4 py-2 bg-red-50 text-red-650 hover:bg-red-100 border border-red-100 rounded-xl text-sm font-bold transition-colors"
                    >
                      Revoke Access
                    </button>
                  </td>
                </tr>
              ))}
              
              {users.filter(u => u.isSuperAdmin).length === 0 && (
                <tr>
                  <td colSpan={4} className="px-8 py-16 text-center text-slate-500 font-medium">
                    No administrators found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create User Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-2xl font-extrabold text-slate-900">Register New User</h2>
              <button onClick={() => setCreateModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-200 rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleCreateUser} className="p-8 overflow-y-auto">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Full Name</label>
                  <input 
                    required type="text" 
                    value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-shadow" 
                    placeholder="e.g. Jane Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Email Address</label>
                  <input 
                    required type="email" 
                    value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-shadow" 
                    placeholder="jane@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Password</label>
                  <input 
                    required type="password" 
                    value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-shadow" 
                    placeholder="••••••••"
                  />
                </div>
                
                <div className="flex items-center bg-slate-50 p-4 rounded-xl border border-slate-200 mt-4">
                  <input 
                    type="checkbox" 
                    id="isSuperAdmin"
                    checked={newUser.isSuperAdmin}
                    onChange={e => setNewUser({...newUser, isSuperAdmin: e.target.checked})}
                    className="w-5 h-5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                  />
                  <label htmlFor="isSuperAdmin" className="ml-3 block text-sm font-bold text-slate-700">
                    Grant Super Admin Access
                    <span className="block text-xs font-normal text-slate-500 mt-0.5">This user will have full control over all communities and settings.</span>
                  </label>
                </div>
              </div>
              
              <div className="mt-10 flex justify-end">
                <button type="button" onClick={() => setCreateModalOpen(false)} className="px-6 py-3 font-bold text-slate-500 hover:bg-slate-100 rounded-xl mr-4 transition-colors">
                  Cancel
                </button>
                <button type="submit" className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-500/25 transition-all">
                  Register User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
