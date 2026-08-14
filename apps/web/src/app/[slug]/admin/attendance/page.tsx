'use client';
import { getApiUrl } from '../../../../lib/api';

import React, { useEffect, useState } from 'react';
import { getAuthHeaders } from '../../../../lib/auth';
import { CheckSquare, Search, Download } from 'lucide-react';
import { SessionTransaction } from '../../../../types';

export default function AdminAttendance({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = React.use(params);
  const [attendance, setAttendance] = useState<SessionTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [communityId, setCommunityId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchCommunityId = async () => {
      try {
        const res = await fetch(`${getApiUrl()}/communities/${resolvedParams.slug}`);
        if (res.ok) {
          const data = await res.json();
          setCommunityId(data.id);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchCommunityId();
  }, [resolvedParams.slug]);

  useEffect(() => {
    const fetchAttendance = async () => {
      if (!communityId) return;
      try {
        const headers = getAuthHeaders();
        const res = await fetch(`${getApiUrl()}/session-wallet/admin/community/${communityId}/attendance`, {
          headers
        });
        if (res.ok) {
          const data = await res.json();
          setAttendance(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAttendance();
  }, [communityId]);

  const filteredAttendance = attendance.filter(t => 
    t.wallet?.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.wallet?.package?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExportCSV = () => {
    if (filteredAttendance.length === 0) return;

    const headers = ['Member Name', 'Email', 'Date & Time', 'Package', 'Session Change', 'Remaining', 'Remarks'];
    const csvRows = [headers.join(',')];

    filteredAttendance.forEach(t => {
      const date = new Date(t.createdAt).toLocaleString('id-ID');
      const row = [
        `"${t.wallet?.user?.name || '-'}"`,
        `"${t.wallet?.user?.email || '-'}"`,
        `"${date}"`,
        `"${t.wallet?.package?.name || '-'}"`,
        t.changeSession,
        t.afterSession,
        `"${t.remarks || '-'}"`
      ];
      csvRows.push(row.join(','));
    });

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Attendance_Export_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto pb-12 p-8">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Attendance</h1>
          <p className="mt-2 text-slate-500">Track member check-ins and session usage</p>
        </div>
        <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm self-start md:self-auto flex gap-2">
          <CheckSquare className="w-6 h-6 text-indigo-500" />
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden mb-8">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row gap-4 items-center justify-between bg-slate-50">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by member name or package..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium text-sm shadow-sm"
            />
          </div>
          <button 
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-5 py-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors font-bold text-sm text-slate-700 w-full sm:w-auto shadow-sm"
          >
            <Download className="w-4 h-4 text-slate-400" />
            Export CSV
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white">
                <th className="px-6 py-5 text-xs font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-100">Member</th>
                <th className="px-6 py-5 text-xs font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-100">Date & Time</th>
                <th className="px-6 py-5 text-xs font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-100">Package</th>
                <th className="px-6 py-5 text-xs font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-100 text-right">Session Change</th>
                <th className="px-6 py-5 text-xs font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-100 text-right">Remaining</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500 font-bold">
                    Loading attendance history...
                  </td>
                </tr>
              ) : filteredAttendance.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500 font-bold">
                    No attendance records found.
                  </td>
                </tr>
              ) : (
                filteredAttendance.map((record) => {
                  const checkInDate = new Date(record.createdAt);
                  return (
                    <tr key={record.id} className="hover:bg-slate-50 transition-colors bg-white">
                      <td className="px-6 py-4">
                        <div className="font-extrabold text-slate-900">{record.wallet?.user?.name || 'Unknown'}</div>
                        <div className="text-xs font-semibold text-slate-500 mt-1">{record.wallet?.user?.email || ''}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-800">{checkInDate.toLocaleDateString()}</div>
                        <div className="text-xs font-semibold text-slate-400 mt-1">
                          {checkInDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-slate-700 bg-slate-100 border border-slate-200 px-3 py-1 rounded-xl text-xs inline-block shadow-sm">
                          {record.wallet?.package?.name}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-black text-rose-500 bg-rose-50 px-2 py-1 rounded-md text-sm">
                          {record.changeSession}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-black text-xl text-indigo-600">
                          {record.afterSession}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
