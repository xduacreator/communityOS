'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAuthHeaders } from '../../../lib/auth';
import { Users, CheckCircle, XCircle, Edit2, Trash2, Mail, Hash } from 'lucide-react';
import ConfirmModal from '../../../components/ui/ConfirmModal';

import { CommunityMember, Community, Membership, SessionWallet } from '../../../types';

interface PendingRenewal {
  id: string;
  userId: string;
  communityId: string;
  membershipId: string;
  startDate: string;
  endDate: string;
  status: string;
  paymentProofUrl?: string | null;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  membership?: Membership;
  sessionWallets?: SessionWallet[];
}

interface PendingSessionPackage {
  id: string;
  userId: string;
  communityId: string;
  packageId: string;
  walletStatus: string;
  paymentProofUrl?: string | null;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  package?: {
    id: string;
    name: string;
    totalSession: number;
  };
}

export default function AdminDashboard({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = React.use(params);
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [confirmModalConfig, setConfirmModalConfig] = useState({ isOpen: false, title: '', message: '', confirmText: 'Konfirmasi', onConfirm: () => {} });
  const [community, setCommunity] = useState<Community | null>(null);
  const [pendingRenewals, setPendingRenewals] = useState<PendingRenewal[]>([]);
  const [pendingPackages, setPendingPackages] = useState<PendingSessionPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [actionData, setActionData] = useState<{ id: string, status: string, name: string } | null>(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteData, setDeleteData] = useState<{ id: string, name: string } | null>(null);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editData, setEditData] = useState<{ id: string, name: string, email: string, role: string, customFields: Record<string, string> } | null>(null);
  const [selectedMember, setSelectedMember] = useState<CommunityMember | null>(null);

  const fetchData = async () => {
    const headers = getAuthHeaders();
    if (!headers.Authorization) {
      router.push('/login');
      return;
    }

    try {
      const commRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/communities/${resolvedParams.slug}`);
      if (!commRes.ok) throw new Error('Community not found');
      const commData = await commRes.json();
      setCommunity(commData);

      const memRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/memberships/community/${commData.id}`, {
        headers: { ...headers },
      });

      if (!memRes.ok) throw new Error('Failed to fetch members or unauthorized');
      const memData = await memRes.json();
      setMembers(memData);

      if (commData.registrationMode === 'PAID') {
        const renewalRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/user-membership/pending/${commData.id}`, {
          headers: { ...headers },
        });
        if (renewalRes.ok) {
          const renewalData = await renewalRes.json();
          setPendingRenewals(renewalData);
        }
      }

      // Fetch pending session packages
      const pkgRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/session-wallet/pending/${commData.id}`, {
        headers: { ...headers },
      });
      if (pkgRes.ok) {
        const pkgData = await pkgRes.json();
        setPendingPackages(pkgData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [resolvedParams.slug, router]);

  const confirmAction = (id: string, status: string, name: string) => {
    setActionData({ id, status, name });
    setModalOpen(true);
  };

  const handleUpdateStatus = async () => {
    if (!actionData) return;
    try {
      const headers = getAuthHeaders();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/memberships/${actionData.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: JSON.stringify({ status: actionData.status, communityId: community?.id }),
      });

      if (!res.ok) throw new Error('Failed to update status');
      
      setModalOpen(false);
      fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const confirmDelete = (id: string, name: string) => {
    setDeleteData({ id, name });
    setDeleteModalOpen(true);
  };

  const handleDeleteMember = async () => {
    if (!deleteData) return;
    try {
      const headers = getAuthHeaders();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/memberships/${deleteData.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: JSON.stringify({ communityId: community?.id }),
      });

      if (!res.ok) throw new Error('Failed to delete member');
      
      setDeleteModalOpen(false);
      fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const openEditModal = (member: CommunityMember) => {
    let customFields: Record<string, string> = {};
    if (member.customFieldsData) {
      try {
        customFields = JSON.parse(member.customFieldsData);
      } catch (e) {
        console.error('Failed to parse customFieldsData', e);
      }
    }
    setEditData({ 
      id: member.id, 
      name: member.user?.name || '', 
      email: member.user?.email || '', 
      role: member.role,
      customFields
    });
    setEditModalOpen(true);
  };

  const handleEditMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editData) return;
    try {
      const headers = getAuthHeaders();
      const payload = {
        role: editData.role,
        name: editData.name,
        email: editData.email,
        customFieldsData: JSON.stringify(editData.customFields),
        communityId: community?.id
      };
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/memberships/${editData.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Failed to update member data');
      setEditModalOpen(false);
      fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred');
    }
  };


  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="animate-pulse flex flex-col items-center">
        <div className="w-12 h-12 bg-indigo-200 rounded-full mb-4"></div>
        <div className="text-slate-400 font-medium">Loading Admin Panel...</div>
      </div>
    </div>
  );
  if (error) return <div className="p-8 text-center text-red-500 bg-red-50 m-8 rounded-2xl">{error}</div>;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Members</h1>
          <p className="mt-2 text-slate-500">Manage all members of {community?.name}</p>
        </div>
        <div className="bg-white px-5 py-3 rounded-2xl border border-slate-200 shadow-sm flex items-center">
          <Users className="w-5 h-5 text-indigo-500 mr-3" />
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Members</div>
            <div className="text-lg font-bold text-slate-900 leading-none mt-1">{members.length}</div>
          </div>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-3xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50/50">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Member Details</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Membership #</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Role</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {members.map((member) => (
                <tr key={member.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-12 w-12 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-indigo-700 font-bold text-lg shadow-inner">
                        {(member.user?.name || 'U').charAt(0)}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-bold text-slate-900">{member.user?.name || 'Unknown User'}</div>
                        <div className="text-sm text-slate-500 flex items-center mt-0.5">
                          <Mail className="w-3 h-3 mr-1" /> {member.user?.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-mono text-slate-600 bg-slate-100 inline-flex items-center px-2 py-1 rounded-lg">
                      <Hash className="w-3 h-3 mr-1 opacity-50" />
                      {member.membershipNumber || 'Pending'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-slate-700 bg-slate-100 px-3 py-1.5 rounded-xl">{member.role}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1.5 inline-flex text-xs leading-5 font-bold rounded-xl shadow-sm
                      ${member.status === 'APPROVED' ? 'bg-green-100 text-green-700 border border-green-200' : 
                        member.status === 'REJECTED' ? 'bg-red-100 text-red-700 border border-red-200' : 
                        'bg-amber-100 text-amber-700 border border-amber-200'}`}>
                      {member.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end items-center space-x-2">
                      <button 
                        onClick={() => setSelectedMember(member)}
                        className="px-3 py-1.5 bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors font-bold text-xs"
                      >
                        Detail
                      </button>
                      {member.status === 'PENDING' ? (
                        <>
                          <button 
                            onClick={() => confirmAction(member.id, 'APPROVED', member.user?.name || '')}
                            className="flex items-center px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 rounded-xl transition-colors font-bold text-xs"
                          >
                            <CheckCircle className="w-3.5 h-3.5 mr-1" />
                            Approve
                          </button>
                          <button 
                            onClick={() => confirmAction(member.id, 'REJECTED', member.user?.name || '')}
                            className="flex items-center px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 rounded-xl transition-colors font-bold text-xs"
                          >
                            <XCircle className="w-3.5 h-3.5 mr-1" />
                            Reject
                          </button>
                        </>
                      ) : (
                        <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => openEditModal(member)}
                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
                            title="Edit Role"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => confirmDelete(member.id, member.user?.name || '')}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                            title="Remove Member"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              
              {members.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Users className="w-8 h-8 text-slate-300" />
                    </div>
                    <div className="text-slate-500 font-medium">No members found in this community.</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pending Membership Renewals Section */}
      {community?.registrationMode === 'PAID' && (
        <div className="bg-white rounded-[2rem] shadow-xl p-8 border border-slate-150 space-y-6 mt-8">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight text-left">Pending Membership Renewals</h2>
            <p className="text-sm text-slate-500 mt-1 text-left">Verify payment receipts and approve active membership extensions.</p>
          </div>

          <div className="overflow-x-auto rounded-3xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Member Details</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Requested Tier</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Price (IDR)</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Payment Receipt</th>
                  <th scope="col" className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {pendingRenewals.map((renewal) => (
                  <tr key={renewal.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4 text-left">
                      <div className="text-sm font-bold text-slate-900">{renewal.user?.name}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{renewal.user?.email}</div>
                    </td>
                    <td className="px-6 py-4 text-left">
                      <div className="text-sm font-bold text-slate-800">{renewal.membership?.name}</div>
                      <div className="text-[10px] text-slate-400 font-semibold mt-0.5">Durasi: {renewal.membership?.durationDays} hari</div>
                    </td>
                    <td className="px-6 py-4 text-left text-sm font-black text-indigo-600">
                      Rp {
                        (
                          (renewal.membership?.price || 0) +
                          (renewal.sessionWallets?.reduce((sum: number, w: SessionWallet) => sum + (w?.isPrivate ? (w?.package?.vipPrice || 0) : (w?.package?.memberPrice || 0)), 0) || 0)
                        ).toLocaleString('id-ID')
                      }
                    </td>
                    <td className="px-6 py-4 text-left">
                      {renewal.paymentProofUrl ? (
                        <a 
                          href={renewal.paymentProofUrl} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="inline-flex items-center text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50/50 hover:bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-xl transition-all shadow-sm"
                        >
                          Lihat Bukti Transfer
                        </a>
                      ) : (
                        <span className="text-xs font-bold text-rose-500 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-100">Belum ada bukti</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setConfirmModalConfig({
                              isOpen: true,
                              title: 'Setujui Perpanjangan',
                              message: `Apakah Anda yakin ingin menyetujui perpanjangan membership untuk ${renewal.user?.name}?`,
                              confirmText: 'Setujui',
                              onConfirm: async () => {
                                try {
                              const headers = getAuthHeaders();
                              const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/user-membership/approve/${renewal.id}?communityId=${community?.id}`, {
                                method: 'PATCH',
                                headers: {
                                  'Authorization': headers.Authorization || ''
                                }
                              });
                              if (!res.ok) throw new Error('Gagal menyetujui perpanjangan');
                              alert('Perpanjangan membership berhasil disetujui!');
                              fetchData();
                            } catch (err) {
                              alert(err instanceof Error ? err.message : 'Terjadi kesalahan');
                            }
                              }
                            });
                          }}
                          className="flex items-center px-4 py-2 bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl transition-colors font-bold text-xs shadow-lg shadow-emerald-500/20"
                        >
                          <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                          Setujui
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {pendingRenewals.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="text-slate-400 font-medium text-sm">Tidak ada permintaan perpanjangan membership pending saat ini.</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pending Session Packages Section */}
      <div className="bg-white rounded-[2rem] shadow-xl p-8 border border-slate-150 space-y-6 mt-8">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight text-left">Pending Session Packages</h2>
          <p className="text-sm text-slate-500 mt-1 text-left">Verify payment receipts and approve standalone session package purchases.</p>
        </div>

        <div className="overflow-x-auto rounded-3xl border border-slate-200">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Member Details</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Package</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Payment Receipt</th>
                <th scope="col" className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {pendingPackages.map((pkg) => (
                <tr key={pkg.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4 text-left">
                    <div className="text-sm font-bold text-slate-900">{pkg.user?.name}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{pkg.user?.email}</div>
                  </td>
                  <td className="px-6 py-4 text-left">
                    <div className="text-sm font-bold text-slate-800">{pkg.package?.name}</div>
                    <div className="text-[10px] text-slate-400 font-semibold mt-0.5">Total Sesi: {pkg.package?.totalSession}</div>
                  </td>
                  <td className="px-6 py-4 text-left">
                    {pkg.paymentProofUrl ? (
                      <a 
                        href={pkg.paymentProofUrl} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="inline-flex items-center text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50/50 hover:bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-xl transition-all shadow-sm"
                      >
                        Lihat Bukti Transfer
                      </a>
                    ) : (
                      <span className="text-xs font-bold text-rose-500 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-100">Belum ada bukti</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setConfirmModalConfig({
                            isOpen: true,
                            title: 'Setujui Pembelian',
                            message: `Apakah Anda yakin ingin menyetujui pembelian paket sesi untuk ${pkg.user?.name}?`,
                            confirmText: 'Setujui',
                            onConfirm: async () => {
                              try {
                            const headers = getAuthHeaders();
                            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/session-wallet/approve/${pkg.id}`, {
                              method: 'PATCH',
                              headers: {
                                'Authorization': headers.Authorization || ''
                              }
                            });
                            if (!res.ok) throw new Error('Gagal menyetujui paket');
                            alert('Pembelian paket sesi berhasil disetujui!');
                            fetchData();
                          } catch (err) {
                            alert(err instanceof Error ? err.message : 'Terjadi kesalahan');
                          }
                            }
                          });
                        }}
                        className="flex items-center px-4 py-2 bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl transition-colors font-bold text-xs shadow-lg shadow-emerald-500/20"
                      >
                        <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                        Setujui
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {pendingPackages.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <div className="text-slate-400 font-medium text-sm">Tidak ada permintaan pembelian paket sesi pending saat ini.</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmModal 
        isOpen={modalOpen}
        title={actionData?.status === 'APPROVED' ? 'Approve Member' : 'Reject Member'}
        message={`Are you sure you want to ${actionData?.status.toLowerCase()} ${actionData?.name}?`}
        confirmText={actionData?.status === 'APPROVED' ? 'Yes, Approve' : 'Yes, Reject'}
        isDestructive={actionData?.status === 'REJECTED'}
        onConfirm={handleUpdateStatus}
        onCancel={() => setModalOpen(false)}
      />

      <ConfirmModal 
        isOpen={deleteModalOpen}
        title="Remove Member"
        message={`Are you sure you want to remove ${deleteData?.name} from the community? This action cannot be undone.`}
        confirmText="Remove Member"
        isDestructive={true}
        onConfirm={handleDeleteMember}
        onCancel={() => setDeleteModalOpen(false)}
      />

      {/* Edit Role Modal */}
      {editModalOpen && editData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">Edit Member Role</h3>
              <p className="text-sm text-slate-500 mt-1">Update role for {editData.name}</p>
            </div>
            <form onSubmit={handleEditMember} className="p-8 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Name</label>
                <input
                  type="text"
                  value={editData.name}
                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Email</label>
                <input
                  type="email"
                  value={editData.email}
                  onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Role</label>
                <select
                  value={editData.role}
                  onChange={(e) => setEditData({ ...editData, role: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-medium text-slate-700"
                >
                  <option value="MEMBER">Member</option>
                  <option value="COMMUNITY_ADMIN">Community Admin</option>
                </select>
              </div>

              {/* Dynamic Custom Fields */}
              {Object.keys(editData.customFields).map(key => (
                <div key={key}>
                  <label className="block text-sm font-bold text-slate-700 mb-2 capitalize">{key.replace(/_/g, ' ')}</label>
                  <input
                    type="text"
                    value={editData.customFields[key]}
                    onChange={(e) => setEditData({ 
                      ...editData, 
                      customFields: { ...editData.customFields, [key]: e.target.value } 
                    })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>
              ))}
              
              <div className="mt-10 flex justify-end">
                <button type="button" onClick={() => setEditModalOpen(false)} className="px-6 py-3 font-bold text-slate-500 hover:bg-slate-100 rounded-xl mr-4 transition-colors">
                  Cancel
                </button>
                <button type="submit" className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-500/25 transition-all">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Member Profile Details Modal */}
      {selectedMember && (() => {
        let customAnswers: { label: string; value: string }[] = [];
        if (selectedMember.customFieldsData && community?.registrationFields) {
          try {
            const answers = JSON.parse(selectedMember.customFieldsData);
            const fields = JSON.parse(community.registrationFields) as { id: string; label: string }[];
            customAnswers = fields.map((f: { id: string; label: string }) => ({
              label: f.label,
              value: answers[f.id] || '-'
            }));
          } catch {
            try {
              const answers = JSON.parse(selectedMember.customFieldsData);
              customAnswers = Object.entries(answers).map(([key, val]) => ({
                label: key,
                value: String(val)
              }));
            } catch {}
          }
        }

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-[2rem] shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] border border-slate-200">
              
              {/* Header */}
              <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between border-slate-200">
                <div>
                  <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">Detail Profil Member</h3>
                  <p className="text-sm text-slate-500 mt-1">Data pendaftaran untuk {selectedMember.user?.name}</p>
                </div>
                <button 
                  onClick={() => setSelectedMember(null)}
                  className="p-2 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-700 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Body */}
              <div className="p-8 space-y-6 overflow-y-auto">
                
                {/* Fixed Fields */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Informasi Akun</h4>
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
                    <div className="flex justify-between items-center text-sm border-b border-slate-100 pb-2">
                      <span className="font-semibold text-slate-500">Nama Lengkap</span>
                      <span className="font-bold text-slate-900">{selectedMember.user?.name || '-'}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm border-b border-slate-100 pb-2">
                      <span className="font-semibold text-slate-500">Email</span>
                      <span className="font-bold text-slate-900">{selectedMember.user?.email || '-'}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm border-b border-slate-100 pb-2">
                      <span className="font-semibold text-slate-500">Membership Number</span>
                      <span className="font-mono bg-slate-200/80 px-2 py-0.5 rounded text-xs text-slate-700 font-bold">
                        {selectedMember.membershipNumber || 'Pending'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm border-b border-slate-100 pb-2">
                      <span className="font-semibold text-slate-500">Role</span>
                      <span className="font-semibold text-slate-700 bg-slate-200 px-2 py-0.5 rounded text-xs uppercase">{selectedMember.role}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-semibold text-slate-500">Status</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                        selectedMember.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                        selectedMember.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {selectedMember.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Custom Fields */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Informasi Pendaftaran Kustom</h4>
                  {customAnswers.length > 0 ? (
                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                      {customAnswers.map((ans, idx) => (
                        <div key={idx} className="space-y-1">
                          <label className="block text-xs font-bold text-slate-500">{ans.label}</label>
                          <p className="text-sm font-bold text-slate-900 whitespace-pre-wrap">{ans.value}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 font-medium text-sm">
                      Tidak ada data pendaftaran tambahan.
                    </div>
                  )}
                </div>

                {/* Bukti Pembayaran if community is PAID */}
                {community?.registrationMode === 'PAID' && (
                  <div className="space-y-4 pt-4 border-t border-slate-200 text-left">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Bukti Pembayaran Membership</h4>
                    {selectedMember.paymentProofUrl ? (
                      <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
                        <p className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 p-2.5 rounded-xl">
                          Bukti pembayaran telah diunggah oleh member. Silakan periksa kebenaran transfer di bawah ini.
                        </p>
                        <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-white p-2">
                          <img 
                            src={selectedMember.paymentProofUrl} 
                            alt="Bukti Transfer" 
                            className="w-full h-auto object-contain max-h-60 rounded-lg mx-auto"
                          />
                        </div>
                        <a 
                          href={selectedMember.paymentProofUrl} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="block text-center text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-white border border-slate-200 py-2.5 rounded-xl transition-colors shadow-sm"
                        >
                          Buka Gambar di Tab Baru
                        </a>
                      </div>
                    ) : (
                      <div className="text-center py-6 bg-slate-50 border-2 border-dashed border-rose-200 rounded-2xl text-rose-500 font-bold text-xs">
                        ⚠️ Member belum mengunggah bukti transfer pembayaran.
                      </div>
                    )}
                  </div>
                )}

              </div>

              {/* Footer */}
              <div className="px-8 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end border-slate-200">
                <button 
                  onClick={() => setSelectedMember(null)}
                  className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-lg transition-colors text-sm"
                >
                  Tutup
                </button>
              </div>

            </div>
          </div>
        );
      })()}
    </div>
  );
}
