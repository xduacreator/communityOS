'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, Clock, FileText, MapPin, Save, Type } from 'lucide-react';
import { getApiUrl } from '../../lib/api';
import { getAuthHeaders } from '../../lib/auth';

export interface EventFormValues {
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
}

const input =
  'w-full px-4 py-3 bg-[#F6F6F2] border border-[#E6E6E0] rounded-xl focus:ring-2 focus:ring-[#111214]/15 focus:border-[#111214] outline-none transition-all font-medium';
const label = 'mb-2 flex items-center text-sm font-bold text-slate-700';

/** Splits an ISO date into the local date and time the inputs expect */
export function eventFormValues(event: { title: string; description?: string | null; date: string; location?: string | null }): EventFormValues {
  const d = new Date(event.date);
  const pad = (n: number) => String(n).padStart(2, '0');
  return {
    title: event.title,
    description: event.description || '',
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
    location: event.location || '',
  };
}

/** Create (no eventId) or edit an event */
export default function EventForm({
  slug,
  eventId,
  initial,
}: {
  slug: string;
  eventId?: string;
  initial?: EventFormValues;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<EventFormValues>(initial || { title: '', description: '', date: '', time: '', location: '' });
  const set = (key: keyof EventFormValues) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [key]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body = JSON.stringify({
        title: form.title,
        description: form.description,
        date: new Date(`${form.date}T${form.time}`).toISOString(),
        location: form.location,
      });
      const headers = { 'Content-Type': 'application/json', ...getAuthHeaders() };
      let res: Response;
      if (eventId) {
        res = await fetch(`${getApiUrl()}/events/${eventId}`, { method: 'PATCH', headers, body });
      } else {
        const commRes = await fetch(`${getApiUrl()}/communities/${slug}`);
        if (!commRes.ok) throw new Error('Klub tidak ditemukan');
        const community = await commRes.json();
        res = await fetch(`${getApiUrl()}/events/community/${community.id}`, { method: 'POST', headers, body });
      }
      if (!res.ok) throw new Error(eventId ? 'Gagal menyimpan perubahan event' : 'Gagal membuat event');
      router.push(`/${slug}/admin/events`);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Terjadi kesalahan');
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8 flex items-center">
        <Link
          href={`/${slug}/admin/events`}
          className="mr-3 rounded-xl p-2 text-slate-400 transition-colors hover:bg-white hover:text-slate-900"
          aria-label="Kembali ke daftar event"
        >
          <ArrowLeft className="h-6 w-6" />
        </Link>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">{eventId ? 'Edit Event' : 'Buat Event'}</h1>
          <p className="mt-1 text-slate-500">
            {eventId ? 'Perubahan langsung tampil di halaman klub.' : 'Event akan tampil di tab Event dan beranda halaman klub.'}
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-[#E6E6E0] bg-white">
        <form onSubmit={handleSubmit} className="space-y-6 p-6 sm:p-8">
          <div>
            <label className={label} htmlFor="event-title">
              <Type className="mr-2 h-4 w-4 text-slate-400" /> Nama event
            </label>
            <input id="event-title" type="text" required value={form.title} onChange={set('title')} placeholder="Contoh: Fun Run 5K Akhir Tahun" className={input} />
          </div>

          <div>
            <label className={label} htmlFor="event-desc">
              <FileText className="mr-2 h-4 w-4 text-slate-400" /> Deskripsi
            </label>
            <textarea
              id="event-desc"
              rows={5}
              required
              value={form.description}
              onChange={set('description')}
              placeholder="Ceritakan acaranya: untuk siapa, apa yang perlu dibawa, rute, biaya bila ada…"
              className={`${input} resize-y`}
            />
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className={label} htmlFor="event-date">
                <Calendar className="mr-2 h-4 w-4 text-slate-400" /> Tanggal
              </label>
              <input id="event-date" type="date" required value={form.date} onChange={set('date')} className={input} />
            </div>
            <div>
              <label className={label} htmlFor="event-time">
                <Clock className="mr-2 h-4 w-4 text-slate-400" /> Jam mulai
              </label>
              <input id="event-time" type="time" required value={form.time} onChange={set('time')} className={input} />
            </div>
          </div>

          <div>
            <label className={label} htmlFor="event-location">
              <MapPin className="mr-2 h-4 w-4 text-slate-400" /> Lokasi
            </label>
            <input
              id="event-location"
              type="text"
              required
              value={form.location}
              onChange={set('location')}
              placeholder="Contoh: GBK Senayan, Pintu 7 — atau link Zoom"
              className={input}
            />
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-[#EEEEE8] pt-6 sm:flex-row sm:justify-end">
            <Link
              href={`/${slug}/admin/events`}
              className="flex items-center justify-center rounded-xl px-6 py-3 font-bold text-slate-600 hover:bg-[#F1F1EC]"
            >
              Batal
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center justify-center rounded-xl bg-[#111214] px-8 py-3 font-bold text-white transition-all hover:bg-[#2A2C30] disabled:opacity-50"
            >
              <Save className="mr-2 h-5 w-5" />
              {saving ? 'Menyimpan…' : eventId ? 'Simpan perubahan' : 'Terbitkan event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
