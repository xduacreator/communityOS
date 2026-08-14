'use client';
import { getApiUrl } from '../../../../lib/api';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAuthHeaders } from '../../../../lib/auth';
import Link from 'next/link';
import { Calendar, Plus, MapPin, Clock, Users, Trash2 } from 'lucide-react';
import ConfirmModal from '../../../../components/ui/ConfirmModal';

import { Event, Community } from '../../../../types';

export default function AdminEvents({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = React.use(params);
  const [events, setEvents] = useState<Event[]>([]);
  const [community, setCommunity] = useState<Community | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteData, setDeleteData] = useState<{ id: string, title: string } | null>(null);

  const fetchData = async () => {
    try {
      const commRes = await fetch(`${getApiUrl()}/communities/${resolvedParams.slug}`);
      if (!commRes.ok) throw new Error('Community not found');
      const commData = await commRes.json();
      setCommunity(commData);

      const eventsRes = await fetch(`${getApiUrl()}/events/community/${commData.id}`);
      if (!eventsRes.ok) throw new Error('Failed to fetch events');
      const eventsData = await eventsRes.json();
      setEvents(eventsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [resolvedParams.slug]);

  const confirmDelete = (id: string, title: string) => {
    setDeleteData({ id, title });
    setDeleteModalOpen(true);
  };

  const handleDeleteEvent = async () => {
    if (!deleteData) return;
    try {
      const headers = getAuthHeaders();
      const res = await fetch(`${getApiUrl()}/events/${deleteData.id}`, {
        method: 'DELETE',
        headers,
      });

      if (!res.ok) throw new Error('Failed to delete event');
      setDeleteModalOpen(false);
      fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="animate-pulse flex flex-col items-center">
        <div className="w-12 h-12 bg-indigo-200 rounded-full mb-4"></div>
        <div className="text-slate-400 font-medium">Loading Events...</div>
      </div>
    </div>
  );

  if (error) return <div className="p-8 text-center text-red-500 bg-red-50 m-8 rounded-2xl">{error}</div>;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Events</h1>
          <p className="mt-2 text-slate-500">Manage activities for {community?.name}</p>
        </div>
        <Link 
          href={`/${resolvedParams.slug}/admin/events/create`}
          className="flex items-center justify-center px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-500/25 transition-all"
        >
          <Plus className="w-5 h-5 mr-2" /> Create Event
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map((event) => (
          <div key={event.id} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col group transition-all hover:shadow-md">
            <div className="p-6 flex-1">
              <div className="flex justify-between items-start mb-4">
                <div className="bg-indigo-50 text-indigo-700 p-3 rounded-2xl">
                  <Calendar className="w-6 h-6" />
                </div>
                <button 
                  onClick={() => confirmDelete(event.id, event.title)}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2 line-clamp-1">{event.title}</h3>
              <p className="text-sm text-slate-500 line-clamp-2 mb-4">{event.description}</p>
              
              <div className="space-y-2 text-sm font-medium text-slate-600">
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-2 text-slate-400" />
                  {new Date(event.date).toLocaleString()}
                </div>
                {event.location && (
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-2 text-slate-400" />
                    {event.location}
                  </div>
                )}
              </div>
            </div>
            
            <div className="border-t border-slate-100 p-4 bg-slate-50/50 flex justify-between items-center">
              <Link 
                href={`/${resolvedParams.slug}/admin/events/${event.id}`}
                className="text-sm font-bold text-indigo-600 hover:text-indigo-700 flex items-center"
              >
                <Users className="w-4 h-4 mr-1.5" /> View Attendees
              </Link>
            </div>
          </div>
        ))}
        
        {events.length === 0 && (
          <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-dashed border-slate-300">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">No events found</h3>
            <p className="text-slate-500 mt-1 mb-6">You haven&apos;t created any events yet.</p>
            <Link 
              href={`/${resolvedParams.slug}/admin/events/create`}
              className="inline-flex items-center justify-center px-6 py-3 bg-indigo-50 text-indigo-700 font-bold rounded-xl hover:bg-indigo-100 transition-all"
            >
              <Plus className="w-5 h-5 mr-2" /> Create First Event
            </Link>
          </div>
        )}
      </div>

      <ConfirmModal 
        isOpen={deleteModalOpen}
        title="Delete Event"
        message={`Are you sure you want to delete "${deleteData?.title}"? All registrations will be lost. This action cannot be undone.`}
        confirmText="Delete Event"
        isDestructive={true}
        onConfirm={handleDeleteEvent}
        onCancel={() => setDeleteModalOpen(false)}
      />
    </div>
  );
}
