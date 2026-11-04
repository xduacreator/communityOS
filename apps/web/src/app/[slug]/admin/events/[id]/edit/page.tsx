'use client';

import React, { useEffect, useState } from 'react';
import { getApiUrl } from '../../../../../../lib/api';
import { getAuthHeaders } from '../../../../../../lib/auth';
import EventForm, { eventFormValues, type EventFormValues } from '../../../../../../components/admin/EventForm';

export default function EditEvent({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = React.use(params);
  const [initial, setInitial] = useState<EventFormValues | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`${getApiUrl()}/events/${id}`, { headers: getAuthHeaders() })
      .then((res) => {
        if (!res.ok) throw new Error('Event tidak ditemukan');
        return res.json();
      })
      .then((event) => setInitial(eventFormValues(event)))
      .catch((err) => setError(err instanceof Error ? err.message : 'Gagal memuat event'));
  }, [id]);

  if (error) return <div className="m-8 rounded-2xl bg-red-50 p-8 text-center text-red-600">{error}</div>;
  if (!initial) return <div className="p-10 text-center font-medium text-slate-400">Memuat event…</div>;
  return <EventForm slug={slug} eventId={id} initial={initial} />;
}
