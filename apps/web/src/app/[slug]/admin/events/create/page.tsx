'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAuthHeaders } from '../../../../../lib/auth';
import { ArrowLeft, Calendar, FileText, Type, MapPin, Save } from 'lucide-react';
import Link from 'next/link';

export default function CreateEvent({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = React.use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const headers = getAuthHeaders();
      const commRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/communities/${resolvedParams.slug}`);
      if (!commRes.ok) throw new Error('Community not found');
      const commData = await commRes.json();

      // Combine date and time
      const datetime = new Date(`${formData.date}T${formData.time}`).toISOString();

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/events/community/${commData.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          date: datetime,
          location: formData.location,
        }),
      });

      if (!res.ok) throw new Error('Failed to create event');
      
      router.push(`/${resolvedParams.slug}/admin/events`);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center">
          <Link 
            href={`/${resolvedParams.slug}/admin/events`}
            className="mr-4 p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Create Event</h1>
            <p className="mt-1 text-slate-500">Plan a new activity for your community</p>
          </div>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-3xl border border-slate-200 overflow-hidden">
        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center">
                <Type className="w-4 h-4 mr-2 text-slate-400" /> Event Title
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Annual Tech Meetup"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-medium"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center">
                <FileText className="w-4 h-4 mr-2 text-slate-400" /> Description (Content)
              </label>
              <textarea
                rows={6}
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe what the event is about..."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-medium resize-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center">
                  <Calendar className="w-4 h-4 mr-2 text-slate-400" /> Date
                </label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-medium"
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center">
                  <Calendar className="w-4 h-4 mr-2 text-slate-400" /> Time
                </label>
                <input
                  type="time"
                  required
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center">
                <MapPin className="w-4 h-4 mr-2 text-slate-400" /> Location / Meeting Link
              </label>
              <input
                type="text"
                required
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g., Jakarta Convention Center or Zoom Link"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-medium"
              />
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-50"
            >
              <Save className="w-5 h-5 mr-2" />
              {loading ? 'Publishing...' : 'Publish Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
