'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAuthHeaders } from '../../../../../lib/auth';
import { ArrowLeft, Users, Calendar, Mail, MapPin, Clock } from 'lucide-react';
import Link from 'next/link';
import { Event, EventRegistration } from '../../../../../types';

export default function EventAttendees({ params }: { params: Promise<{ slug: string, id: string }> }) {
  const resolvedParams = React.use(params);
  const [event, setEvent] = useState<Event | null>(null);
  const [attendees, setAttendees] = useState<EventRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const headers = getAuthHeaders();
        const eventRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/events/${resolvedParams.id}`, { headers });
        if (!eventRes.ok) throw new Error('Event not found');
        const eventData = await eventRes.json();
        setEvent(eventData);

        const attendeesRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/events/${resolvedParams.id}/attendees`, { headers });
        if (!attendeesRes.ok) throw new Error('Failed to fetch attendees');
        const attendeesData = await attendeesRes.json();
        setAttendees(attendeesData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [resolvedParams.id]);

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="animate-pulse flex flex-col items-center">
        <div className="w-12 h-12 bg-indigo-200 rounded-full mb-4"></div>
        <div className="text-slate-400 font-medium">Loading Attendees...</div>
      </div>
    </div>
  );

  if (error) return <div className="p-8 text-center text-red-500 bg-red-50 m-8 rounded-2xl">{error}</div>;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center">
          <Link 
            href={`/${resolvedParams.slug}/admin/events`}
            className="mr-4 p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Attendees</h1>
            <p className="mt-1 text-slate-500 line-clamp-1">{event?.title}</p>
          </div>
        </div>
        <div className="bg-white px-5 py-3 rounded-2xl border border-slate-200 shadow-sm flex items-center">
          <Users className="w-5 h-5 text-indigo-500 mr-3" />
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Registered</div>
            <div className="text-lg font-bold text-slate-900 leading-none mt-1">{attendees.length}</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 mb-8 flex flex-col md:flex-row gap-6">
         <div className="flex-1">
            <h3 className="text-xl font-bold text-slate-900 mb-2">{event?.title}</h3>
            <p className="text-slate-600 mb-4">{event?.description}</p>
         </div>
         <div className="md:w-72 space-y-3 bg-slate-50 p-4 rounded-2xl">
            <div className="flex items-center text-sm font-medium text-slate-700">
               <Calendar className="w-4 h-4 mr-2 text-slate-400" />
               {event?.date ? new Date(event.date).toLocaleDateString() : ''}
            </div>
            <div className="flex items-center text-sm font-medium text-slate-700">
               <Clock className="w-4 h-4 mr-2 text-slate-400" />
               {event?.date ? new Date(event.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
            </div>
            <div className="flex items-center text-sm font-medium text-slate-700">
               <MapPin className="w-4 h-4 mr-2 text-slate-400" />
               {event?.location}
            </div>
         </div>
      </div>

      <div className="bg-white shadow-sm rounded-3xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50/50">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Attendee Details</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Registration Date</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {attendees.map((registration) => (
                <tr key={registration.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-12 w-12 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-indigo-700 font-bold text-lg shadow-inner">
                        {(registration.user?.name || 'U').charAt(0)}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-bold text-slate-900">{registration.user?.name || 'Unknown User'}</div>
                        <div className="text-sm text-slate-500 flex items-center mt-0.5">
                          <Mail className="w-3 h-3 mr-1" /> {registration.user?.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                     <span className="text-sm font-medium text-slate-600">
                        {new Date(registration.createdAt).toLocaleString()}
                     </span>
                  </td>
                </tr>
              ))}
              
              {attendees.length === 0 && (
                <tr>
                  <td colSpan={2} className="px-6 py-16 text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Users className="w-8 h-8 text-slate-300" />
                    </div>
                    <div className="text-slate-500 font-medium">No one has registered for this event yet.</div>
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
