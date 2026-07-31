'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAuthHeaders } from '../../lib/auth';
import Link from 'next/link';
import { ShieldAlert, Globe, ArrowRight, Play, Square, Plus, X, Pencil, RefreshCw } from 'lucide-react';
import ConfirmModal from '../../components/ui/ConfirmModal';
import { Community, CommunityMember } from '../../types';

export default function SuperAdminDashboard() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [actionData, setActionData] = useState<{ id: string, isActive: boolean, name: string } | null>(null);

  // Create & Edit Community State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newComm, setNewComm] = useState({ name: '', slug: '', adminEmail: '', adminName: '', adminPassword: '' });
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editComm, setEditComm] = useState({ id: '', name: '', slug: '', adminEmail: '', adminName: '', adminPassword: '' });

  // Reset Data State
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetDataId, setResetDataId] = useState<string | null>(null);
  const [resetDataName, setResetDataName] = useState<string>('');
  const [resetOptions, setResetOptions] = useState({
    TRANSACTIONS: false,
    EVENTS: false,
    GALLERY: false,
    MEMBERS: false,
    PACKAGES: false,
    MEMBERSHIPS: false,
  });

  const fetchCommunities = async () => {
    const headers = getAuthHeaders();
    if (!headers.Authorization) {
      router.push('/login');
      return;
    }

    try {
      const res = await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001') + '/communities', {
        headers: { ...headers },
      });

      if (!res.ok) {
        if (res.status === 403) throw new Error('Forbidden: Super Admin access required');
        throw new Error('Failed to fetch communities');
      }

      const data = await res.json();
      setCommunities(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommunities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const confirmAction = (id: string, isActive: boolean, name: string) => {
    setActionData({ id, isActive, name });
    setModalOpen(true);
  };

  const executeToggleStatus = async () => {
    if (!actionData) return;
    try {
      const headers = getAuthHeaders();
      const endpoint = actionData.isActive ? 'suspend' : 'activate';
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/communities/${actionData.id}/${endpoint}`, {
        method: 'PATCH',
        headers: { ...headers },
      });

      if (!res.ok) throw new Error(`Failed to ${endpoint} community`);
      
      fetchCommunities();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleCreateCommunity = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const headers = getAuthHeaders();
      const res = await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001') + '/communities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify(newComm),
      });

      if (!res.ok) throw new Error('Failed to create community');
      
      setCreateModalOpen(false);
      setNewComm({ name: '', slug: '', adminEmail: '', adminName: '', adminPassword: '' });
      fetchCommunities();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const openEditModal = (comm: Community & { members?: CommunityMember[] }) => {
    const adminMember = comm.members?.find((m) => m.role === 'COMMUNITY_ADMIN');
    setEditComm({
      id: comm.id,
      name: comm.name,
      slug: comm.slug,
      adminEmail: adminMember?.user?.email || '',
      adminName: adminMember?.user?.name || '',
      adminPassword: ''
    });
    setEditModalOpen(true);
  };

  const handleEditCommunity = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const headers = getAuthHeaders();
      const payload = {
        name: editComm.name,
        slug: editComm.slug,
        ...(editComm.adminEmail && { adminEmail: editComm.adminEmail, adminName: editComm.adminName, adminPassword: editComm.adminPassword })
      };
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/communities/${editComm.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Failed to update community');
      
      setEditModalOpen(false);
      fetchCommunities();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const openResetModal = (id: string, name: string) => {
    setResetDataId(id);
    setResetDataName(name);
    setResetOptions({
      TRANSACTIONS: false,
      EVENTS: false,
      GALLERY: false,
      MEMBERS: false,
      PACKAGES: false,
      MEMBERSHIPS: false,
    });
    setResetModalOpen(true);
  };

  const handleToggleResetOption = (key: keyof typeof resetOptions) => {
    setResetOptions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleResetData = async () => {
    if (!resetDataId) return;

    const selectedOptions = Object.entries(resetOptions)
      .filter(([_, isSelected]) => isSelected)
      .map(([key]) => key);

    if (selectedOptions.length === 0) {
      alert("Pilih minimal satu data yang ingin di-reset.");
      return;
    }

    try {
      const headers = getAuthHeaders();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/communities/${resetDataId}/reset-data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({ options: selectedOptions }),
      });

      if (!res.ok) throw new Error('Failed to reset community data');
      
      alert('Data komunitas berhasil di-reset!');
      setResetModalOpen(false);
      fetchCommunities();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="animate-pulse flex flex-col items-center">
        <div className="w-16 h-16 bg-indigo-100 rounded-[2rem] flex items-center justify-center mb-6">
          <ShieldAlert className="w-8 h-8 text-indigo-500" />
        </div>
        <div className="text-slate-400 font-bold tracking-widest uppercase text-xs">Initializing...</div>
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
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-2">Communities</h1>
          <p className="text-slate-500 text-lg">Manage all platform communities.</p>
        </div>
        <button 
          onClick={() => setCreateModalOpen(true)}
          className="flex items-center px-6 py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-indigo-600 hover:shadow-lg hover:shadow-indigo-500/25 transition-all duration-300"
        >
          <Plus className="w-5 h-5 mr-2" />
          Create Community
        </button>
      </div>

      {/* Cards Layout - One UI */}
      <div className="space-y-4">
        {communities.map((comm) => (
          <div key={comm.id} className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col sm:flex-row items-center justify-between hover:shadow-md transition-shadow group">
            <div className="flex items-center w-full sm:w-auto mb-4 sm:mb-0">
              <div className="w-16 h-16 rounded-[1.5rem] bg-indigo-50 flex items-center justify-center text-indigo-600 font-extrabold text-xl mr-5 group-hover:scale-105 transition-transform duration-300">
                {comm.name.charAt(0)}
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">{comm.name}</h3>
                <div className="flex items-center mt-1 text-slate-500 text-sm font-medium">
                  <Globe className="w-4 h-4 mr-1.5" />
                  /{comm.slug}
                  <span className="mx-3 text-slate-300">•</span>
                  {new Date(comm.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-6 w-full sm:w-auto justify-between sm:justify-end">
              <div className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider
                ${comm.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                {comm.isActive ? 'ACTIVE' : 'SUSPENDED'}
              </div>
              
              <button
                onClick={() => openEditModal(comm)}
                className="p-4 rounded-2xl transition-colors bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
                title="Edit Community"
              >
                <Pencil className="w-5 h-5" />
              </button>

              <button
                onClick={() => openResetModal(comm.id, comm.name)}
                className="p-4 rounded-2xl transition-colors bg-red-50 text-red-600 hover:bg-red-100"
                title="Reset Data Komunitas"
              >
                <RefreshCw className="w-5 h-5" />
              </button>

              <button
                onClick={() => confirmAction(comm.id, comm.isActive, comm.name)}
                className={`p-4 rounded-2xl transition-colors
                  ${comm.isActive 
                    ? 'bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-600' 
                    : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}
                title={comm.isActive ? "Suspend Community" : "Activate Community"}
              >
                {comm.isActive ? <Square className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </button>
            </div>
          </div>
        ))}

        {communities.length === 0 && (
          <div className="bg-white p-12 rounded-[2rem] border border-slate-100 text-center text-slate-500">
            No communities registered yet.
          </div>
        )}
      </div>

      <ConfirmModal 
        isOpen={modalOpen}
        title={actionData?.isActive ? 'Suspend Community' : 'Activate Community'}
        message={`Are you sure you want to ${actionData?.isActive ? 'suspend' : 'activate'} the community "${actionData?.name}"?`}
        confirmText={actionData?.isActive ? 'Yes, Suspend' : 'Yes, Activate'}
        isDestructive={actionData?.isActive}
        onConfirm={executeToggleStatus}
        onCancel={() => setModalOpen(false)}
      />

      {/* Create Community Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-2xl font-extrabold text-slate-900">Create New Community</h2>
              <button onClick={() => setCreateModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-200 rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleCreateCommunity} className="p-8 overflow-y-auto">
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-indigo-600 uppercase tracking-wider mb-4">Community Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Community Name</label>
                      <input 
                        required type="text" 
                        value={newComm.name} onChange={e => setNewComm({...newComm, name: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-shadow" 
                        placeholder="e.g. Jakarta Runners"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">URL Slug</label>
                      <input 
                        required type="text" 
                        value={newComm.slug} onChange={e => setNewComm({...newComm, slug: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-shadow" 
                        placeholder="e.g. jakartarunners"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100">
                  <h3 className="text-sm font-bold text-indigo-600 uppercase tracking-wider mb-4">Community Admin</h3>
                  <p className="text-sm text-slate-500 mb-6">Assign an existing user by email, or we&apos;ll create a new account for them automatically.</p>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Admin Email</label>
                      <input 
                        required type="email" 
                        value={newComm.adminEmail} onChange={e => setNewComm({...newComm, adminEmail: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-shadow" 
                        placeholder="admin@community.com"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Admin Name (Optional)</label>
                        <input 
                          type="text" 
                          value={newComm.adminName} onChange={e => setNewComm({...newComm, adminName: e.target.value})}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-shadow" 
                          placeholder="e.g. John Doe"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Temporary Password</label>
                        <input 
                          type="password" 
                          value={newComm.adminPassword} onChange={e => setNewComm({...newComm, adminPassword: e.target.value})}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-shadow" 
                          placeholder="Leave blank for 'password123'"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-10 flex justify-end">
                <button type="button" onClick={() => setCreateModalOpen(false)} className="px-6 py-3 font-bold text-slate-500 hover:bg-slate-100 rounded-xl mr-4 transition-colors">
                  Cancel
                </button>
                <button type="submit" className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-500/25 transition-all">
                  Create Community
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Community Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-2xl font-extrabold text-slate-900">Edit Community</h2>
              <button onClick={() => setEditModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-200 rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleEditCommunity} className="p-8 overflow-y-auto">
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-indigo-600 uppercase tracking-wider mb-4">Community Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Community Name</label>
                      <input 
                        required type="text" 
                        value={editComm.name} onChange={e => setEditComm({...editComm, name: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-shadow" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">URL Slug</label>
                      <input 
                        required type="text" 
                        value={editComm.slug} onChange={e => setEditComm({...editComm, slug: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-shadow" 
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100">
                  <h3 className="text-sm font-bold text-indigo-600 uppercase tracking-wider mb-4">Re-assign Admin (Optional)</h3>
                  <p className="text-sm text-slate-500 mb-6">Leave these fields blank if you do not wish to change the community admin.</p>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Admin Email</label>
                      <input 
                        type="email" 
                        value={editComm.adminEmail} onChange={e => setEditComm({...editComm, adminEmail: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-shadow" 
                        placeholder="admin@community.com"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Admin Name (Optional)</label>
                        <input 
                          type="text" 
                          value={editComm.adminName} onChange={e => setEditComm({...editComm, adminName: e.target.value})}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-shadow" 
                          placeholder="e.g. John Doe"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Temporary Password</label>
                        <input 
                          type="password" 
                          value={editComm.adminPassword} onChange={e => setEditComm({...editComm, adminPassword: e.target.value})}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-shadow" 
                          placeholder="Leave blank for 'password123'"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
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
        </div>
      )}

      {/* Reset Data Modal */}
      {resetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setResetModalOpen(false)}></div>
          <div className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden">
            <div className="p-8 md:p-10">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight">Reset Data Komunitas</h2>
                  <p className="text-slate-500 mt-2 text-sm font-medium">Pilih data milik <span className="font-bold text-slate-900">{resetDataName}</span> yang ingin Anda hapus.</p>
                </div>
                <button onClick={() => setResetModalOpen(false)} className="p-2 bg-slate-100 text-slate-400 hover:text-slate-600 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl mb-6">
                <p className="text-sm font-bold text-amber-800">
                  ⚠️ Peringatan: Tindakan ini permanen. Data yang dihapus tidak dapat dipulihkan.
                </p>
              </div>

              <div className="space-y-4">
                <label className="flex items-start p-4 border border-slate-200 rounded-2xl cursor-pointer hover:bg-slate-50 transition-colors">
                  <input type="checkbox" className="mt-1 w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300" 
                    checked={resetOptions.TRANSACTIONS} onChange={() => handleToggleResetOption('TRANSACTIONS')} />
                  <div className="ml-3">
                    <span className="block text-sm font-bold text-slate-900">Riwayat Transaksi & Dompet Sesi</span>
                    <span className="block text-xs text-slate-500 mt-1">Menghapus riwayat transaksi pembelian dan penggunaan sesi anggota.</span>
                  </div>
                </label>

                <label className="flex items-start p-4 border border-slate-200 rounded-2xl cursor-pointer hover:bg-slate-50 transition-colors">
                  <input type="checkbox" className="mt-1 w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300" 
                    checked={resetOptions.EVENTS} onChange={() => handleToggleResetOption('EVENTS')} />
                  <div className="ml-3">
                    <span className="block text-sm font-bold text-slate-900">Event & Pendaftar</span>
                    <span className="block text-xs text-slate-500 mt-1">Menghapus daftar event yang dibuat dan peserta yang mendaftar.</span>
                  </div>
                </label>

                <label className="flex items-start p-4 border border-slate-200 rounded-2xl cursor-pointer hover:bg-slate-50 transition-colors">
                  <input type="checkbox" className="mt-1 w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300" 
                    checked={resetOptions.GALLERY} onChange={() => handleToggleResetOption('GALLERY')} />
                  <div className="ml-3">
                    <span className="block text-sm font-bold text-slate-900">Galeri Foto</span>
                    <span className="block text-xs text-slate-500 mt-1">Menghapus foto-foto galeri komunitas.</span>
                  </div>
                </label>

                <label className="flex items-start p-4 border border-slate-200 rounded-2xl cursor-pointer hover:bg-slate-50 transition-colors">
                  <input type="checkbox" className="mt-1 w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300" 
                    checked={resetOptions.MEMBERS} onChange={() => handleToggleResetOption('MEMBERS')} />
                  <div className="ml-3">
                    <span className="block text-sm font-bold text-slate-900">Daftar Anggota (Kecuali Admin)</span>
                    <span className="block text-xs text-slate-500 mt-1">Mengeluarkan anggota komunitas. Juga otomatis akan menghapus seluruh langganan dan transaksi dompet anggotanya.</span>
                  </div>
                </label>

                <label className="flex items-start p-4 border border-slate-200 rounded-2xl cursor-pointer hover:bg-slate-50 transition-colors">
                  <input type="checkbox" className="mt-1 w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300" 
                    checked={resetOptions.PACKAGES} onChange={() => handleToggleResetOption('PACKAGES')} />
                  <div className="ml-3">
                    <span className="block text-sm font-bold text-slate-900">Konfigurasi Paket Sesi, Kategori, & Aktivitas</span>
                    <span className="block text-xs text-slate-500 mt-1">Menghapus paket yang dijual. Juga otomatis akan menghapus transaksi paket tersebut.</span>
                  </div>
                </label>

                <label className="flex items-start p-4 border border-slate-200 rounded-2xl cursor-pointer hover:bg-slate-50 transition-colors">
                  <input type="checkbox" className="mt-1 w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300" 
                    checked={resetOptions.MEMBERSHIPS} onChange={() => handleToggleResetOption('MEMBERSHIPS')} />
                  <div className="ml-3">
                    <span className="block text-sm font-bold text-slate-900">Konfigurasi Membership Tiers</span>
                    <span className="block text-xs text-slate-500 mt-1">Menghapus tingkatan langganan yang ada. Juga otomatis mencabut langganan aktif anggota.</span>
                  </div>
                </label>
              </div>

              <div className="mt-10 flex justify-end">
                <button type="button" onClick={() => setResetModalOpen(false)} className="px-6 py-3 font-bold text-slate-500 hover:bg-slate-100 rounded-xl mr-4 transition-colors">
                  Batal
                </button>
                <button type="button" onClick={handleResetData} className="px-8 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 shadow-lg shadow-red-500/25 transition-all">
                  Eksekusi Reset
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
