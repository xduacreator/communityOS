'use client';
import { getApiUrl } from '../lib/api';

import { useEffect, useState } from 'react';
import { getAuthHeaders } from '../lib/auth';
import { Save, User, Mail, KeyRound } from 'lucide-react';
import { User as UserType } from '../types';

export default function ProfileSettings() {
  const [profile, setProfile] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    const fetchProfile = async () => {
      const headers = getAuthHeaders();
      try {
        const res = await fetch(getApiUrl() + '/auth/me', { headers });
        if (res.ok) {
          const data = await res.json();
          setProfile(data);
          setName(data.name || '');
        }
      } catch (err) {
        console.error('Failed to fetch profile', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ text: '', type: '' });

    const headers = getAuthHeaders();
    const body: { name: string; password?: string } = { name };
    if (password) body.password = password;

    try {
      const res = await fetch(getApiUrl() + '/auth/me', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error('Failed to update profile');
      setMessage({ text: 'Profile updated successfully!', type: 'success' });
      setPassword(''); // clear password field
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : 'An error occurred', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading profile data...</div>;
  if (!profile) return null;

  return (
    <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
      <div className="px-6 py-6 border-b border-slate-100 bg-slate-50/50">
        <h3 className="text-xl font-bold text-slate-900 flex items-center">
          <User className="w-5 h-5 mr-2 text-indigo-500" />
          Profile Settings
        </h3>
        <p className="mt-1 text-sm text-slate-500">Manage your personal information and security.</p>
      </div>
      
      <div className="p-6">
        {message.text && (
          <div className={`mb-6 p-4 rounded-xl border ${message.type === 'error' ? 'bg-red-50 border-red-100 text-red-700' : 'bg-green-50 border-green-100 text-green-700'}`}>
            <p className="text-sm font-medium">{message.text}</p>
          </div>
        )}
        
        <form onSubmit={handleSave} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
            <div className="relative rounded-xl shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-slate-400" />
              </div>
              <input 
                type="text" 
                value={profile.email} 
                disabled 
                className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-500 sm:text-sm cursor-not-allowed" 
              />
            </div>
            <p className="mt-1 text-xs text-slate-500">Email addresses cannot be changed.</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Full Name</label>
            <div className="relative rounded-xl shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-slate-400" />
              </div>
              <input 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-shadow" 
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">New Password</label>
            <div className="relative rounded-xl shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <KeyRound className="h-5 w-5 text-slate-400" />
              </div>
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="Leave blank to keep current"
                className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-shadow" 
              />
            </div>
          </div>
          
          <div className="pt-4 border-t border-slate-100">
            <button 
              type="submit" 
              disabled={saving}
              className="flex items-center justify-center w-full sm:w-auto px-6 py-3 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving Changes...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
