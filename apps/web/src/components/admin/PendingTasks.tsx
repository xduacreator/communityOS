'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, CreditCard, RefreshCw, UserPlus, Users } from 'lucide-react';
import { getApiUrl } from '../../lib/api';
import { getAuthHeaders } from '../../lib/auth';

interface Counts {
  members: number;
  renewals: number;
  purchases: number;
  guests: number;
}

async function count(url: string, filter?: (row: { status?: string }) => boolean): Promise<number> {
  try {
    const res = await fetch(url, { headers: getAuthHeaders() });
    if (!res.ok) return 0;
    const rows = await res.json();
    if (!Array.isArray(rows)) return 0;
    return filter ? rows.filter(filter).length : rows.length;
  } catch {
    return 0;
  }
}

/** "Perlu tindakan": everything waiting on the admin, with a link to where it's handled */
export default function PendingTasks({ slug, communityId }: { slug: string; communityId: string }) {
  const [counts, setCounts] = useState<Counts | null>(null);

  useEffect(() => {
    if (!communityId) return;
    const api = getApiUrl();
    const pending = (row: { status?: string }) => row.status === 'PENDING';
    Promise.all([
      count(`${api}/memberships/community/${communityId}`, pending),
      count(`${api}/user-membership/pending/${communityId}`),
      count(`${api}/session-wallet/pending/${communityId}`),
      count(`${api}/guest-registrations/community/${communityId}`, pending),
    ]).then(([members, renewals, purchases, guests]) => setCounts({ members, renewals, purchases, guests }));
  }, [communityId]);

  if (!counts) {
    return <div className="mb-8 h-[92px] animate-pulse rounded-3xl border border-[#E6E6E0] bg-white" />;
  }

  const admin = `/${slug}/admin`;
  const tasks = [
    { n: counts.members, label: 'pendaftaran member', hint: 'menunggu persetujuan', href: admin, icon: Users },
    { n: counts.purchases, label: 'pembelian paket', hint: 'menunggu konfirmasi bayar', href: `${admin}#paket-menunggu`, icon: CreditCard },
    { n: counts.renewals, label: 'perpanjangan membership', hint: 'menunggu konfirmasi', href: `${admin}#perpanjangan`, icon: RefreshCw },
    { n: counts.guests, label: 'pendaftar tamu', hint: 'menunggu konfirmasi', href: `${admin}/sessions/guests`, icon: UserPlus },
  ].filter((t) => t.n > 0);

  if (tasks.length === 0) {
    return (
      <div className="mb-8 flex items-center gap-3 rounded-3xl border border-[#E6E6E0] bg-white px-6 py-5">
        <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-500" />
        <div>
          <b className="text-slate-900">Semua beres</b>
          <p className="text-sm text-slate-500">Tidak ada pendaftaran atau pembayaran yang menunggu konfirmasi.</p>
        </div>
      </div>
    );
  }

  return (
    <section className="mb-8 rounded-3xl border border-amber-200 bg-amber-50/60 p-5 sm:p-6">
      <h2 className="mb-4 text-lg font-extrabold text-slate-900">Perlu tindakan</h2>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-3">
        {tasks.map((t) => (
          <Link
            key={t.label}
            href={t.href}
            className="group flex items-center gap-3 rounded-2xl border border-amber-100 bg-white p-4 transition-shadow hover:shadow-md"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <t.icon className="h-5 w-5" />
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <b className="text-[15px] leading-tight text-slate-900">
                {t.n} {t.label}
              </b>
              <span className="text-xs font-semibold text-slate-500">{t.hint}</span>
            </span>
            <ArrowRight className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5" />
          </Link>
        ))}
      </div>
    </section>
  );
}
