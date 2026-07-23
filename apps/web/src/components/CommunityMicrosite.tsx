/* eslint-disable @next/next/no-img-element */
'use client';

import { useState, useEffect } from 'react';
import JoinButton from './JoinButton';
import ProfileSettings from './ProfileSettings';
import { Home, Info, Phone, Calendar, Clock, MapPin, CheckCircle, Image as ImageIcon, Users, Trophy, Sun, ArrowRight, X, LayoutGrid, Shield, CreditCard, Activity, Zap, Plus, LogOut } from 'lucide-react';
import { getAuthHeaders, removeToken } from '../lib/auth';
import { useRouter } from 'next/navigation';
import { Community, SessionPackage, GalleryImage, CommunityMember, SessionWallet, UserMembershipWithMembership, Membership, User, Event } from '../types';

interface ActiveWalletView {
  packageName: string;
  totalSession: number;
  remainingSession: number;
  expiredDate: string | null;
  status: string;
}

interface HistoryItem {
  type: string;
  change: number;
  date: Date;
  remarks: string;
}

export default function CommunityMicrosite({ community, slug }: { community: Community, slug: string }) {
  const [activeTab, setActiveTab] = useState('home');
  const [sessions, setSessions] = useState<SessionPackage[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [loadingGallery, setLoadingGallery] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [purchasingMap, setPurchasingMap] = useState<Record<string, boolean>>({});
  const [selectedPackage, setSelectedPackage] = useState<SessionPackage | null>(null);
  const router = useRouter();

  // Dashboard states
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [status, setStatus] = useState<CommunityMember | null>(null);
  const [activeWallet, setActiveWallet] = useState<ActiveWalletView | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loadingDashboard, setLoadingDashboard] = useState(false);
  const [errorDashboard, setErrorDashboard] = useState('');
  const [dashboardSubTab, setDashboardSubTab] = useState('wallet');
  const [userMemberships, setUserMemberships] = useState<UserMembershipWithMembership[]>([]);
  const [showRenewalModal, setShowRenewalModal] = useState(false);
  const [selectedRenewalTierId, setSelectedRenewalTierId] = useState('');
  const [renewalProofUrl, setRenewalProofUrl] = useState('');
  const [submittingRenewal, setSubmittingRenewal] = useState(false);
  const [checkingInOut, setCheckingInOut] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Bundle checkout states
  const [showBundleModal, setShowBundleModal] = useState(false);
  const [bundlePackage, setBundlePackage] = useState<SessionPackage | null>(null);
  const [selectedBundleTierId, setSelectedBundleTierId] = useState('');
  const [bundleProofUrl, setBundleProofUrl] = useState('');
  const [submittingBundle, setSubmittingBundle] = useState(false);

  const getMembershipRemainingDays = () => {
    if (!userMemberships || userMemberships.length === 0) return 0;
    const dates = userMemberships.map((m: UserMembershipWithMembership) => new Date(m.endDate).getTime());
    const maxDate = Math.max(...dates);
    const diffTime = maxDate - Date.now();
    if (diffTime <= 0) return 0;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const fetchDashboardData = async () => {
    const headers = getAuthHeaders();
    if (!headers.Authorization) return;
    setLoadingDashboard(true);
    setErrorDashboard('');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/memberships/my-status/${slug}`, {
        headers: { ...headers },
      });
      if (!res.ok) throw new Error('Failed to fetch membership status');
      const data = await res.json();
      setStatus(data);

      const meRes = await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001') + '/auth/me', { headers });
      if (meRes.ok) {
        const meData = await meRes.json();
        setCurrentUser(meData);
      }

      if (data && data.userId && data.communityId) {
        const activeMembershipsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/user-membership/active/${data.userId}?communityId=${data.communityId}`, {
          headers: { ...headers }
        });
        if (activeMembershipsRes.ok) {
          const membershipsData = await activeMembershipsRes.json();
          setUserMemberships(membershipsData);
        }
        const walletRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/session-wallet/user/${data.userId}?communityId=${data.communityId}`, {
          headers: { ...headers }
        });
        if (walletRes.ok) {
          const walletData = await walletRes.json();
          const active = (walletData as SessionWallet[]).find((w) => w.walletStatus === 'ACTIVE' && w.remainingSession > 0);
          if (active) {
            setActiveWallet({
              packageName: active.package?.name || 'Session Package',
              totalSession: active.totalSession,
              remainingSession: active.remainingSession,
              expiredDate: active.expiredDate || null,
              status: active.walletStatus
            });
          } else {
            const waiting = (walletData as SessionWallet[]).find((w) => w.walletStatus === 'WAITING');
            if (waiting) {
              setActiveWallet({
                packageName: waiting.package?.name || 'Session Package',
                totalSession: waiting.totalSession,
                remainingSession: waiting.remainingSession,
                expiredDate: waiting.expiredDate || null,
                status: waiting.walletStatus
              });
            } else {
              setActiveWallet(null);
            }
          }

          const allTransactions: HistoryItem[] = [];
          (walletData as SessionWallet[]).forEach((w) => {
            allTransactions.push({
              type: 'PURCHASE',
              change: w.totalSession,
              date: w.purchaseDate ? new Date(w.purchaseDate) : new Date(),
              remarks: `Purchased ${w.package?.name || 'Package'}`
            });
            if (w.transactions && Array.isArray(w.transactions)) {
              w.transactions.forEach((tx) => {
                allTransactions.push({
                  type: tx.transactionType,
                  change: tx.changeSession,
                  date: new Date(tx.createdAt),
                  remarks: tx.remarks || (tx.transactionType === 'ATTENDANCE' ? 'Check-in' : tx.transactionType)
                });
              });
            }
          });
          allTransactions.sort((a, b) => b.date.getTime() - a.date.getTime());
          setHistory(allTransactions);
        }
      }
    } catch (err) {
      setErrorDashboard(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoadingDashboard(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'sessions' || activeTab === 'home') {
      fetchSessions();
    } 
    if (activeTab === 'gallery') {
      fetchGallery();
    }
    if (activeTab === 'home' || activeTab === 'events') {
      fetchEvents();
    }
    if (activeTab === 'dashboard') {
      fetchDashboardData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  useEffect(() => {
    const headers = getAuthHeaders();
    const tokenExists = !!headers.Authorization;
    setIsLoggedIn(tokenExists);

    if (tokenExists) {
      const fetchStatus = async () => {
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/memberships/my-status/${slug}`, {
            headers: { ...headers },
          });
          if (res.ok) {
            const data = await res.json();
            setStatus(data);
          }
        } catch (e) {
          console.error(e);
        }
      };
      fetchStatus();
    }

    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const tab = searchParams.get('tab');
      if (tab) {
        setActiveTab(tab);
      }
    }
  }, [slug]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (tab === 'home') {
        url.searchParams.delete('tab');
      } else {
        url.searchParams.set('tab', tab);
      }
      window.history.pushState({}, '', url.toString());
    }
  };

  const fetchGallery = async () => {
    setLoadingGallery(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/gallery/community/${community.id}`);
      if (res.ok) {
        const data = await res.json();
        setGalleryImages(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingGallery(false);
    }
  };

  const fetchSessions = async () => {
    setLoadingSessions(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/session-package/community/${community.id}`);
      if (res.ok) {
        const data = await res.json();
        setSessions(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingSessions(false);
    }
  };

  const fetchEvents = async () => {
    setLoadingEvents(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/events/community/${community.id}`);
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingEvents(false);
    }
  };


  const handlePurchase = async (pkgId: string) => {
    const headers = getAuthHeaders();
    if (!headers.Authorization) {
      router.push(`/${slug}/login`);
      return;
    }

    // Check membership remaining duration (require renewal bundle if <= 2 days or empty)
    const days = getMembershipRemainingDays();
    if (days <= 2) {
      const pkg = sessions.find(p => p.id === pkgId) || selectedPackage;
      if (pkg) {
        setSelectedPackage(null);
        setBundlePackage(pkg);
        setSelectedBundleTierId(community.memberships && community.memberships.length > 0 ? community.memberships[0].id : '');
        setBundleProofUrl('');
        setShowBundleModal(true);
      } else {
        // Fetch packages and retry
        const pkgRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/session-package/community/${community.id}`);
        if (pkgRes.ok) {
          const list = await pkgRes.json();
          const target = list.find((p: SessionPackage) => p.id === pkgId);
          if (target) {
            setSelectedPackage(null);
            setBundlePackage(target);
            setSelectedBundleTierId(community.memberships && community.memberships.length > 0 ? community.memberships[0].id : '');
            setBundleProofUrl('');
            setShowBundleModal(true);
          }
        }
      }
      return;
    }

    setPurchasingMap(prev => ({ ...prev, [pkgId]: true }));
    try {
      // Get current user ID
      const meRes = await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001') + '/auth/me', { headers });
      if (!meRes.ok) throw new Error('Please login again');
      const meData = await meRes.json();

      // Purchase package
      const res = await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001') + '/session-wallet/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: JSON.stringify({
          userId: meData.id,
          communityId: community.id,
          packageId: pkgId
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to purchase package');
      }

      alert('Successfully purchased package!');
      handleTabChange('dashboard');
    } catch (e) {
      alert(e instanceof Error ? e.message : 'An error occurred');
    } finally {
      setPurchasingMap(prev => ({ ...prev, [pkgId]: false }));
    }
  };

  const handleCheckInOut = async () => {
    const headers = getAuthHeaders();
    if (!headers.Authorization || !status || !status.userId || !status.communityId) {
      alert('Authentication or membership status missing.');
      return;
    }
    
    const isCheckedIn = history[0] && history[0].remarks === 'Check-in';
    const endpoint = isCheckedIn ? 'member/check-out' : 'member/check-in';
    const actionName = isCheckedIn ? 'checking out' : 'checking in';
    
    if (!confirm(`Are you sure you want to ${isCheckedIn ? 'check out' : 'check in'}?`)) {
      return;
    }
    
    setCheckingInOut(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/session-wallet/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        body: JSON.stringify({
          userId: status.userId,
          communityId: status.communityId,
          remarks: isCheckedIn ? 'Check-out' : 'Check-in'
        })
      });
      
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || `Failed during ${actionName}`);
      }
      
      alert(`Successfully ${isCheckedIn ? 'checked out' : 'checked in'}!`);
      await fetchDashboardData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setCheckingInOut(false);
    }
  };

  const getTabIcon = (tab: string) => {
    switch (tab) {
      case 'home': return <Home className="w-4 h-4 mr-2" />;
      case 'sessions': return <Calendar className="w-4 h-4 mr-2" />;
      case 'gallery': return <ImageIcon className="w-4 h-4 mr-2" />;
      case 'about': return <Info className="w-4 h-4 mr-2" />;
      case 'contact': return <Phone className="w-4 h-4 mr-2" />;
      case 'dashboard': return <LayoutGrid className="w-4 h-4 mr-2" />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafc] font-sans">
      
      {/* Mobile Top Navigation (Mockup) */}
      <nav className="flex md:hidden items-center justify-between px-4 py-4 bg-white sticky top-0 z-[100] pointer-events-auto shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold shadow-md shrink-0">
            {community.logo ? (
              <img src={community.logo} alt="Logo" className="w-full h-full object-cover rounded-full" />
            ) : (
              <Users className="w-5 h-5" />
            )}
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-base text-slate-900 leading-tight">{community.name}</span>
            <span className="text-xs text-slate-500">Komunitas Bahasa Indonesia</span>
          </div>
        </div>
        {(!isLoggedIn || !status) ? (
          <JoinButton 
            communityId={community.id} 
            slug={slug} 
            registrationFields={community.registrationFields} 
            registrationMode={community.registrationMode}
            memberships={community.memberships}
            label="Gabung Komunitas"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-md transition-colors text-xs flex items-center gap-1"
            icon={<ArrowRight className="w-3 h-3 ml-1" />}
          />
        ) : (
          <button 
            onClick={() => handleTabChange('dashboard')}
            className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-2xl shadow-md text-xs"
          >
            Dashboard
          </button>
        )}
      </nav>

      {/* Desktop Top Navigation */}
      <nav className="hidden md:flex items-center justify-between px-8 py-4 bg-white/80 backdrop-blur-md sticky top-0 z-[100] border-b border-slate-100 pointer-events-auto">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-gradient-to-tr from-indigo-100 to-purple-100 text-indigo-600 flex items-center justify-center font-bold text-lg md:text-xl shadow-inner overflow-hidden border border-slate-100">
            {community.logo ? (
              <img src={community.logo} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <Users className="w-4 h-4 md:w-6 md:h-6" />
            )}
          </div>
          <span className="font-extrabold text-lg md:text-xl text-slate-900 tracking-tight truncate max-w-[120px] md:max-w-xs">{community.name}</span>
        </div>

        <div className="flex items-center gap-1 md:gap-2 bg-white rounded-full p-1.5 shadow-sm border border-slate-100 overflow-x-auto max-w-[55%] md:max-w-2xl scrollbar-none shrink-0">
          {(isLoggedIn ? ['home', 'about', 'sessions', 'gallery', 'contact', 'dashboard'] : ['home', 'about', 'sessions', 'gallery', 'contact']).map((tab) => {
            let label = tab;
            if (tab === 'home' && community.menuHomeLabel) label = community.menuHomeLabel;
            if (tab === 'about' && community.menuAboutLabel) label = community.menuAboutLabel;
            if (tab === 'sessions' && community.menuEventsLabel) label = community.menuEventsLabel;
            if (tab === 'gallery' && community.menuGalleryLabel) label = community.menuGalleryLabel;
            if (tab === 'contact' && community.menuContactLabel) label = community.menuContactLabel;
            if (tab === 'dashboard') label = 'My Hub';

            return (
              <button
                key={tab}
                type="button"
                onClick={() => handleTabChange(tab)}
                className={`
                  cursor-pointer flex items-center px-4 md:px-5 py-2 md:py-2.5 rounded-full text-xs md:text-sm font-semibold capitalize transition-all duration-300 whitespace-nowrap
                  ${activeTab === tab 
                    ? 'bg-indigo-50 text-indigo-700' 
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}
                `}
              >
                {getTabIcon(tab)}
                {label}
              </button>
            )
          })}
        </div>

        <div className="flex items-center gap-4">
          <button className="w-10 h-10 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors">
            <Sun className="w-5 h-5" />
          </button>
          {(!isLoggedIn || !status) && (
            <JoinButton 
              communityId={community.id} 
              slug={slug} 
              registrationFields={community.registrationFields} 
              registrationMode={community.registrationMode}
              memberships={community.memberships}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-full shadow-md transition-colors text-sm flex items-center gap-1"
            />
          )}
          {isLoggedIn && status && status.status === 'PENDING' && (
            <span className="px-4 py-2 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-bold">
              Menunggu Persetujuan
            </span>
          )}
          {isLoggedIn && status && status.status === 'REJECTED' && (
            <span className="px-4 py-2 bg-red-50 text-red-700 border border-red-200 rounded-full text-xs font-bold">
              Pendaftaran Ditolak
            </span>
          )}
        </div>
      </nav>

      {/* Mobile Layout (Mockup) */}
      {activeTab === 'home' && (
        <div className="md:hidden flex flex-col pb-24 animate-in fade-in">
          {/* Mobile Hero Card */}
          <div className="mx-4 mt-6 p-6 rounded-[32px] bg-gradient-to-br from-[#f8f9ff] to-white border border-indigo-50 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-100 rounded-bl-[100px] opacity-30 pointer-events-none"></div>
            
            <div className="w-12 h-12 bg-white rounded-2xl border border-indigo-100 flex items-center justify-center text-indigo-600 mb-6 shadow-sm">
              <Users className="w-6 h-6" />
            </div>
            
            <h1 className="text-2xl font-extrabold text-slate-900 leading-tight mb-3">
              Selamat datang di <br/>
              <span className="text-indigo-600">{community.name}</span>
            </h1>
            
            <p className="text-sm text-slate-500 leading-relaxed max-w-[200px] mb-6">
              {community.about || 'Komunitas yang menghubungkan orang, berbagi pengetahuan, menciptakan pengalaman bermakna, dan tumbuh bersama.'}
            </p>
            
            {(!isLoggedIn || !status) ? (
              <JoinButton 
                communityId={community.id} 
                slug={slug} 
                registrationFields={community.registrationFields} 
                registrationMode={community.registrationMode}
                memberships={community.memberships}
                label="Gabung Komunitas"
                className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-full shadow-md text-sm flex items-center justify-center w-max mb-4"
                icon={<ArrowRight className="w-4 h-4 ml-2" />}
              />
            ) : (
              <button 
                onClick={() => handleTabChange('dashboard')}
                className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-full shadow-md text-sm flex items-center justify-center w-max mb-4"
              >
                Dashboard <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            )}
            
            <button onClick={() => handleTabChange('sessions')} className="text-indigo-600 font-bold text-sm flex items-center">
              Lihat Paket <ArrowRight className="w-4 h-4 ml-1" />
            </button>
            
            {/* Illustration Placeholder */}
            {community.heroBanner && (
              <div className="absolute bottom-4 right-4 w-32 h-32 opacity-80 pointer-events-none">
                <img src={community.heroBanner} alt="Hero" className="w-full h-full object-contain" />
              </div>
            )}
          </div>

          {/* Mobile Stats Carousel */}
          <div className="flex overflow-x-auto gap-4 px-4 py-6 scrollbar-none snap-x snap-mandatory">
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex-shrink-0 w-28 flex flex-col items-center justify-center snap-center">
              <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mb-2">
                <Users className="w-5 h-5" />
              </div>
              <div className="text-lg font-black text-slate-900">{community.statMembersValue || '12.5K'}</div>
              <div className="text-[10px] text-slate-500 font-medium">Members</div>
            </div>
            
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex-shrink-0 w-28 flex flex-col items-center justify-center snap-center">
              <div className="w-10 h-10 rounded-full bg-pink-50 text-pink-600 flex items-center justify-center mb-2">
                <Calendar className="w-5 h-5" />
              </div>
              <div className="text-lg font-black text-slate-900">{community.statEventsValue || sessions.length || '256'}</div>
              <div className="text-[10px] text-slate-500 font-medium">Packages</div>
            </div>
            
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex-shrink-0 w-28 flex flex-col items-center justify-center snap-center">
              <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-2">
                <MapPin className="w-5 h-5" />
              </div>
              <div className="text-lg font-black text-slate-900">{community.statCitiesValue || '48'}</div>
              <div className="text-[10px] text-slate-500 font-medium">Cities</div>
            </div>
            
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex-shrink-0 w-28 flex flex-col items-center justify-center snap-center">
              <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mb-2">
                <Trophy className="w-5 h-5" />
              </div>
              <div className="text-lg font-black text-slate-900">{community.statAchievementsValue || '120'}</div>
              <div className="text-[10px] text-slate-500 font-medium">Achievements</div>
            </div>
          </div>

          {/* Event Terdekat */}
          <div className="mt-4">
            <div className="flex items-center justify-between px-4 mb-4">
              <h2 className="text-base font-bold text-slate-900">Event Terdekat</h2>
              <button onClick={() => handleTabChange('events')} className="text-indigo-600 text-xs font-semibold">Lihat semua</button>
            </div>
            
            {loadingEvents ? (
               <div className="px-4 py-8 flex justify-center"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div></div>
            ) : events.length > 0 ? (
              <div className="flex overflow-x-auto gap-4 px-4 pb-4 scrollbar-none snap-x snap-mandatory">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {events.slice(0, 3).map((event: any) => (
                  <div key={event.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 flex-shrink-0 w-[280px] snap-center overflow-hidden flex">
                    <div className="w-28 bg-slate-100 relative shrink-0">
                      {event.image ? (
                        <img src={event.image} alt={event.title || event.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-indigo-50 flex items-center justify-center"><Calendar className="w-8 h-8 text-indigo-300" /></div>
                      )}
                      <div className="absolute bottom-2 left-2 bg-slate-900/80 backdrop-blur-sm text-white text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center">
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full mr-1"></span> {event.isOnline || event.location === 'Online' ? 'Online' : 'Offline'}
                      </div>
                    </div>
                    <div className="p-3 flex flex-col justify-center flex-1">
                      <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full w-max mb-1.5">{event.category || 'Event'}</span>
                      <h3 className="font-bold text-slate-900 text-sm leading-tight mb-2 line-clamp-2">{event.title || event.name}</h3>
                      <div className="flex items-center text-[10px] text-slate-500 mb-1">
                        <Calendar className="w-3 h-3 mr-1" /> {new Date(event.date || event.startDate).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}
                      </div>
                      <div className="flex items-center text-[10px] text-slate-500">
                        <Clock className="w-3 h-3 mr-1" /> {new Date(event.date || event.startDate).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-4 py-6 mx-4 bg-slate-50 rounded-2xl text-center text-xs text-slate-400 border border-slate-100">Belum ada event terdekat.</div>
            )}
          </div>

          {/* Paket Populer */}
          <div className="mt-6 mb-8">
            <div className="flex items-center justify-between px-4 mb-4">
              <h2 className="text-base font-bold text-slate-900">Paket Populer</h2>
              <button onClick={() => handleTabChange('sessions')} className="text-indigo-600 text-xs font-semibold">Lihat semua</button>
            </div>
            
            {sessions.length > 0 ? (
              <div className="flex overflow-x-auto gap-4 px-4 pb-4 scrollbar-none snap-x snap-mandatory">
                {sessions.slice(0, 3).map(pkg => (
                  <div key={pkg.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 flex-shrink-0 w-[280px] snap-center p-4 flex gap-4">
                    <div className="w-14 h-14 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md">
                      <CreditCard className="w-6 h-6" />
                    </div>
                    <div className="flex flex-col justify-center">
                      <h3 className="font-bold text-slate-900 text-sm leading-tight mb-1">{pkg.name}</h3>
                      <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full w-max">{pkg.totalSession} Materi</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-4 py-6 mx-4 bg-slate-50 rounded-2xl text-center text-xs text-slate-400 border border-slate-100">Belum ada paket tersedia.</div>
            )}
          </div>
        </div>
      )}

      {/* Desktop Hero Section */}
      {activeTab === 'home' && (
        <div className="hidden md:block relative pt-16 md:pt-24 pb-20 md:pb-32 px-4 overflow-hidden z-0">
          {/* Subtle Background Elements */}
          {community.heroBanner ? (
            <div className="absolute inset-0 -z-10 pointer-events-none">
              <img src={community.heroBanner} alt="Hero Banner" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-white/80 to-[#fafafc] pointer-events-none"></div>
            </div>
          ) : (
            <>
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-b from-indigo-50/80 to-transparent rounded-full blur-3xl -z-10 pointer-events-none"></div>
              <div className="absolute top-20 left-20 w-32 h-32 bg-[radial-gradient(#e5e7eb_2px,transparent_2px)] [background-size:16px_16px] opacity-50 -z-10 pointer-events-none"></div>
              <div className="absolute bottom-20 right-20 w-64 h-64 bg-purple-50 rounded-full blur-3xl -z-10 opacity-60 pointer-events-none"></div>
            </>
          )}
          
          <div className="relative z-10 max-w-4xl mx-auto text-center animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="inline-flex items-center justify-center w-20 h-20 md:w-24 md:h-24 rounded-3xl md:rounded-[32px] bg-white shadow-xl shadow-indigo-900/5 border border-slate-100 mb-6 md:mb-8 relative">
              {community.logo ? (
                <img src={community.logo} alt="Logo" className="w-12 h-12 md:w-14 md:h-14 object-cover rounded-xl" />
              ) : (
                <Users className="w-8 h-8 md:w-10 md:h-10 text-indigo-600" />
              )}
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold text-slate-900 tracking-tight leading-[1.15] md:leading-[1.1] mb-6">
              {community.welcomeMessage || 'Welcome to'} <br/>
              <span className="text-indigo-600">{community.name}</span>
            </h1>
            
            <p className="text-base sm:text-lg lg:text-xl text-slate-500 max-w-2xl mx-auto mb-8 md:mb-10 leading-relaxed px-2">
              {community.about ? community.about : 'We are a community that connects people, shares knowledge, creates meaningful experiences, and grows together.'}
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {(!isLoggedIn || !status) ? (
                <JoinButton 
                  communityId={community.id} 
                  slug={slug} 
                  registrationFields={community.registrationFields} 
                  registrationMode={community.registrationMode}
                  memberships={community.memberships}
                  label="Pelajari Selengkapnya"
                  className="w-full sm:w-auto px-8 py-4 bg-indigo-600 text-white font-bold rounded-full shadow-lg shadow-indigo-600/30 hover:bg-indigo-700 hover:scale-105 transition-all flex items-center justify-center gap-2"
                />
              ) : status.status === 'PENDING' ? (
                <div className="w-full sm:w-auto px-8 py-4 bg-amber-50 text-amber-800 font-bold rounded-full border border-amber-200 flex items-center justify-center gap-2 text-sm shadow-sm">
                  <span className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-ping"></span>
                  Pendaftaran Menunggu Persetujuan
                </div>
              ) : status.status === 'REJECTED' ? (
                <div className="w-full sm:w-auto px-8 py-4 bg-red-50 text-red-800 font-bold rounded-full border border-red-200 flex items-center justify-center gap-2 text-sm shadow-sm">
                  Pendaftaran Ditolak
                </div>
              ) : (
                <button 
                  onClick={() => handleTabChange('dashboard')}
                  className="w-full sm:w-auto px-8 py-4 bg-indigo-600 text-white font-bold rounded-full shadow-lg shadow-indigo-600/30 hover:bg-indigo-700 hover:scale-105 transition-all flex items-center justify-center"
                >
                  Buka Dashboard <ArrowRight className="w-5 h-5 ml-2" />
                </button>
              )}
              <button 
                onClick={() => handleTabChange('sessions')}
                className="w-full sm:w-auto px-8 py-4 bg-white text-slate-700 font-bold rounded-full border border-slate-200 shadow-sm hover:bg-slate-50 hover:scale-105 transition-all flex items-center justify-center"
              >
                <Calendar className="w-5 h-5 mr-2 text-slate-400" /> Lihat Paket
              </button>
            </div>
          </div>

          {/* Floating Stats Bar */}
          <div className="max-w-5xl mx-auto mt-16 md:mt-24 px-4 sm:px-0">
            <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-6 md:p-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-0 md:divide-x divide-slate-100">
                
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4 text-center sm:text-left">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                    <Users className="w-5 h-5 md:w-6 md:h-6" />
                  </div>
                  <div>
                    <div className="text-xl md:text-2xl font-black text-slate-900">{community.statMembersValue || '0'}</div>
                    <div className="text-xs md:text-sm font-medium text-slate-500">Members</div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4 text-center sm:text-left">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600">
                    <Calendar className="w-5 h-5 md:w-6 md:h-6" />
                  </div>
                  <div>
                    <div className="text-xl md:text-2xl font-black text-slate-900">{community.statEventsValue || (sessions.length > 0 ? sessions.length : '0')}</div>
                    <div className="text-xs md:text-sm font-medium text-slate-500">Packages</div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4 text-center sm:text-left">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                    <MapPin className="w-5 h-5 md:w-6 md:h-6" />
                  </div>
                  <div>
                    <div className="text-xl md:text-2xl font-black text-slate-900">{community.statCitiesValue || '0'}</div>
                    <div className="text-xs md:text-sm font-medium text-slate-500">Cities</div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4 text-center sm:text-left">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                    <Trophy className="w-5 h-5 md:w-6 md:h-6" />
                  </div>
                  <div>
                    <div className="text-xl md:text-2xl font-black text-slate-900">{community.statAchievementsValue || '0'}</div>
                    <div className="text-xs md:text-sm font-medium text-slate-500">Achievements</div>
                  </div>
                </div>

              </div>
            </div>
          </div>
          
          {/* Available Packages Section (Preview) */}
          <div className="max-w-6xl mx-auto mt-24 md:mt-32">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 md:mb-8 px-4 gap-4 sm:gap-0">
              <h2 className="text-xl md:text-2xl font-extrabold text-slate-900">{community.packagesHeadingLabel || 'Available Packages'}</h2>
              <button 
                onClick={() => setActiveTab('sessions')}
                className="text-indigo-600 font-bold flex items-center hover:text-indigo-700 transition-colors text-sm md:text-base"
              >
                Lihat Semua Paket <ArrowRight className="w-4 h-4 ml-1" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 px-4">
              {sessions.slice(0, 3).length > 0 ? sessions.slice(0, 3).map((pkg) => (
                <div key={pkg.id} className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group flex flex-col relative overflow-hidden">
                  {pkg.image ? (
                    <div className="relative h-32 -mx-5 -mt-5 mb-5 bg-slate-100 shrink-0 border-b border-slate-100">
                      <img src={pkg.image} alt={pkg.name} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-full blur-3xl -z-10 group-hover:scale-150 transition-transform duration-700"></div>
                  )}
                  
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className="bg-indigo-50 text-indigo-700 text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider">
                      {pkg.activity?.name || 'Activity'} • {pkg.category?.name || 'General'}
                    </span>
                    {pkg.accessRule === 'MEMBER_ONLY' && (
                      <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider">
                        Member Only
                      </span>
                    )}
                    {pkg.accessRule === 'PAID_MEMBERSHIP_ONLY' && (
                      <span className="bg-rose-100 text-rose-800 text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider">
                        Paid Member Only
                      </span>
                    )}
                  </div>
                  
                  <h3 className="font-extrabold text-xl text-slate-900 mb-1">{pkg.name}</h3>
                  <div className="text-2xl font-black text-slate-900 mb-5 flex items-end gap-1">
                    Rp {(pkg.memberPrice || 0).toLocaleString('id-ID')}
                  </div>

                  <div className="space-y-2 mb-6 mt-auto">
                    <div className="flex items-center text-xs font-bold text-slate-600 bg-slate-50 p-2.5 rounded-xl">
                      <CheckCircle className="w-4 h-4 mr-2 text-emerald-500" />
                      {pkg.totalSession} Sessions
                    </div>
                    <div className="flex items-center text-xs font-bold text-slate-600 bg-slate-50 p-2.5 rounded-xl">
                      <Clock className="w-4 h-4 mr-2 text-amber-500" />
                      Valid for {pkg.validDays} Days
                    </div>
                  </div>

                  <div className="mt-auto grid grid-cols-2 gap-2">
                    <button 
                      onClick={() => setSelectedPackage(pkg)}
                      className="w-full py-2 bg-white text-slate-900 border-2 border-slate-900 font-bold rounded-xl hover:bg-slate-50 transition-colors text-sm"
                    >
                      Detail
                    </button>
                    <button 
                      onClick={() => handlePurchase(pkg.id)}
                      disabled={purchasingMap[pkg.id]}
                      className="w-full py-2 bg-slate-900 text-white font-bold rounded-xl hover:bg-indigo-600 transition-colors shadow-sm text-sm disabled:opacity-50"
                    >
                      {purchasingMap[pkg.id] ? 'Processing...' : 'Beli'}
                    </button>
                  </div>
                </div>
              )) : (
                <div className="col-span-full py-12 text-center text-slate-400 font-medium bg-white rounded-3xl border border-slate-100">
                  No packages available yet.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Other Tabs Wrapper */}
      {activeTab !== 'home' && (
        <div className="max-w-6xl mx-auto w-full p-4 sm:p-6 lg:p-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {activeTab === 'sessions' && (
            <div className="bg-white p-6 md:p-8 lg:p-12 rounded-3xl md:rounded-[2.5rem] shadow-sm border border-slate-100">
              <h3 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-8 flex items-center">
                <Calendar className="w-6 h-6 md:w-8 md:h-8 mr-3 md:mr-4 text-indigo-500" />
                {community.packagesHeadingLabel || 'Available Session Packages'}
              </h3>
              
              {loadingSessions ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
              ) : sessions.length === 0 ? (
                <div className="bg-slate-50 p-12 rounded-3xl border border-slate-100 text-center text-slate-500 font-medium">
                  No session packages available at the moment. Check back later!
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {sessions.map((pkg) => (
                    <div key={pkg.id} className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group flex flex-col relative overflow-hidden">
                      {pkg.image ? (
                        <div className="relative h-36 -mx-5 -mt-5 mb-5 bg-slate-100 shrink-0 border-b border-slate-100">
                          <img src={pkg.image} alt={pkg.name} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-50/80 to-purple-50/80 rounded-full blur-3xl -z-10 group-hover:scale-150 transition-transform duration-700"></div>
                      )}
                      
                      <div className="flex flex-wrap items-center gap-2 mb-4">
                        <span className="bg-indigo-50 text-indigo-700 text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider">
                          {pkg.activity?.name || 'Activity'} • {pkg.category?.name || 'General'}
                        </span>
                        {pkg.accessRule === 'MEMBER_ONLY' && (
                          <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider">
                            Member Only
                          </span>
                        )}
                        {pkg.accessRule === 'PAID_MEMBERSHIP_ONLY' && (
                          <span className="bg-rose-100 text-rose-800 text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider">
                            Paid Member Only
                          </span>
                        )}
                      </div>
                      
                      <h3 className="font-extrabold text-xl text-slate-900 mb-1">{pkg.name}</h3>
                      
                      <div className="text-2xl font-black text-slate-900 mb-1 flex items-end gap-1">
                        Rp {(pkg.memberPrice || 0).toLocaleString('id-ID')}
                      </div>
                      
                      {pkg.vipPrice ? (
                        <div className="text-xs font-bold text-amber-500 mb-6">
                          Private: Rp {pkg.vipPrice.toLocaleString('id-ID')}
                        </div>
                      ) : (
                        <div className="mb-6 h-4"></div>
                      )}

                      <div className="space-y-2 mb-6 mt-auto border-t border-slate-100 pt-4">
                        <div className="flex items-center text-xs font-bold text-slate-600">
                          <CheckCircle className="w-4 h-4 mr-2 text-emerald-500" />
                          {pkg.totalSession} Sessions Total
                        </div>
                        <div className="flex items-center text-xs font-bold text-slate-600">
                          <Clock className="w-4 h-4 mr-2 text-amber-500" />
                          Valid for {pkg.validDays} Days
                        </div>
                      </div>

                      <div className="mt-auto grid grid-cols-2 gap-2">
                        <button 
                          onClick={() => setSelectedPackage(pkg)}
                          className="w-full py-2 bg-white text-slate-900 border-2 border-slate-900 font-bold rounded-xl hover:bg-slate-50 transition-colors text-sm"
                        >
                          Detail
                        </button>
                        <button 
                          onClick={() => handlePurchase(pkg.id)}
                          disabled={purchasingMap[pkg.id]}
                          className="w-full py-2 bg-slate-900 text-white font-bold rounded-xl hover:bg-indigo-600 transition-colors shadow-sm text-sm disabled:opacity-50"
                        >
                          {purchasingMap[pkg.id] ? 'Processing...' : 'Beli'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'gallery' && (
            <div className="bg-white p-6 md:p-8 lg:p-12 rounded-3xl md:rounded-[2.5rem] shadow-sm border border-slate-100">
              <h3 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-8 flex items-center">
                <ImageIcon className="w-6 h-6 md:w-8 md:h-8 mr-3 md:mr-4 text-indigo-500" />
                Photo Gallery
              </h3>
              
              {loadingGallery ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
              ) : galleryImages.length === 0 ? (
                <div className="bg-slate-50 p-12 rounded-3xl border border-slate-100 text-center text-slate-500 font-medium">
                  No photos uploaded to this community yet.
                </div>
              ) : (
                <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
                  {galleryImages.map((image) => (
                    <div key={image.id} className="break-inside-avoid relative group rounded-3xl overflow-hidden bg-white shadow-sm border border-slate-200">
                      <img 
                        src={image.url} 
                        alt={image.caption || 'Gallery Image'} 
                        className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&q=80&w=400'; }}
                      />
                      
                      {image.caption && (
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-900/90 to-transparent p-6 pt-12 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <p className="text-white font-medium text-sm leading-tight">{image.caption}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'about' && (
            <div className="bg-white p-6 md:p-8 lg:p-12 rounded-3xl md:rounded-[2.5rem] shadow-sm border border-slate-100 max-w-4xl mx-auto">
              <h3 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-8 flex items-center">
                <Info className="w-6 h-6 md:w-8 md:h-8 mr-3 md:mr-4 text-indigo-500" />
                About Us
              </h3>
              <div className="prose prose-base md:prose-lg prose-indigo text-slate-600 max-w-none">
                {community.about ? (
                  <p className="whitespace-pre-wrap leading-relaxed text-lg">{community.about}</p>
                ) : (
                  <div className="bg-slate-50 p-12 rounded-3xl border border-slate-100 text-center text-slate-500 font-medium">
                    No description provided by the community administrators yet.
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'contact' && (
            <div className="bg-white p-6 md:p-8 lg:p-12 rounded-3xl md:rounded-[2.5rem] shadow-sm border border-slate-100 max-w-4xl mx-auto">
              <h3 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-8 flex items-center">
                <Phone className="w-6 h-6 md:w-8 md:h-8 mr-3 md:mr-4 text-cyan-500" />
                Contact Information
              </h3>
              {community.contactInfo ? (
                <div className="bg-slate-50 p-6 md:p-8 rounded-2xl md:rounded-3xl border border-slate-100">
                  <p className="whitespace-pre-wrap text-slate-700 text-lg leading-relaxed">{community.contactInfo}</p>
                </div>
              ) : (
                <div className="bg-slate-50 p-12 rounded-3xl border border-slate-100 text-center text-slate-500 font-medium">
                  No contact information provided.
                </div>
              )}
            </div>
          )}

          {activeTab === 'dashboard' && (
            <div className="max-w-6xl mx-auto space-y-8">
              {/* Premium Dashboard Header Banner */}
              <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-indigo-900 rounded-[2.5rem] p-8 md:p-10 text-white relative overflow-hidden shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-6 text-left">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 rounded-full blur-3xl opacity-[0.08] -mr-16 -mt-16"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-500 rounded-full blur-3xl opacity-[0.05] -ml-16 -mb-16"></div>
                
                <div className="relative z-10 text-left">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white/10 backdrop-blur-md rounded-full text-xs font-bold text-indigo-200 border border-white/5 mb-4">
                    <Shield className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Member Dashboard Hub</span>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white">Selamat Datang, {currentUser?.name || 'Member'}! 👋</h2>
                  <p className="text-sm text-indigo-200/80 mt-1.5 font-medium max-w-lg">
                    Kelola paket membership aktif, sisa sesi latihan kelas, dan riwayat check-in kehadiran di sini.
                  </p>
                </div>
                
                {/* Segmented Tab Controls */}
                <div className="relative z-10 shrink-0 bg-white/5 backdrop-blur-md p-1.5 rounded-2xl border border-white/10 flex gap-1">
                  <button
                    type="button"
                    onClick={() => setDashboardSubTab('wallet')}
                    className={`px-5 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                      dashboardSubTab === 'wallet'
                        ? 'bg-white text-slate-900 shadow-md'
                        : 'text-indigo-200 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Activity className="w-4 h-4" />
                    <span>My Hub</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDashboardSubTab('profile')}
                    className={`px-5 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                      dashboardSubTab === 'profile'
                        ? 'bg-white text-slate-900 shadow-md'
                        : 'text-indigo-200 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    <span>Settings</span>
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      removeToken();
                      setIsLoggedIn(false);
                      router.push(`/${slug}`);
                    }}
                    className="px-4 py-3 rounded-xl text-xs font-bold text-rose-300 hover:text-rose-100 hover:bg-white/5 transition-all flex items-center gap-1.5"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>

              {/* Dashboard Content Container */}
              <div className="w-full">
                {loadingDashboard ? (
                  <div className="flex items-center justify-center py-20 bg-white rounded-[2rem] border border-slate-100 shadow-sm">
                    <div className="animate-pulse flex flex-col items-center">
                      <div className="w-12 h-12 bg-indigo-200 rounded-full mb-4"></div>
                      <div className="text-slate-400 font-medium">Loading details...</div>
                    </div>
                  </div>
                ) : errorDashboard ? (
                  <div className="p-8 text-center text-red-500 bg-white rounded-[2rem] border border-slate-100 shadow-sm">
                    {errorDashboard}
                  </div>
                ) : !status ? (
                  <div className="text-center py-12 bg-white rounded-[2rem] border border-slate-100 shadow-sm">
                    <p className="text-slate-500 font-medium">You are not registered in this community.</p>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {dashboardSubTab === 'wallet' && (
                      (status.status === 'APPROVED' || status.role === 'COMMUNITY_ADMIN') ? (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                          {/* Left Column: Active Classes, Sessions & Membership details */}
                          <div className="lg:col-span-2 space-y-8">
                            {/* Active Session Wallet Card (Main Stage!) */}
                            {activeWallet ? (
                              <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-8 relative overflow-hidden text-left">
                                <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-50 rounded-full blur-3xl opacity-40 -mr-10 -mt-10"></div>
                                
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 relative z-10">
                                  <div className="space-y-1">
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-full text-[10px] font-black text-emerald-700 uppercase tracking-wider">
                                      <Activity className="w-3.5 h-3.5" />
                                      <span>Sesi Aktif</span>
                                    </div>
                                    <h3 className="text-2xl font-black text-slate-900 tracking-tight mt-2">{activeWallet.packageName}</h3>
                                    <p className="text-xs text-slate-400 font-semibold flex items-center gap-1">
                                      <Clock className="w-3.5 h-3.5 text-slate-350" />
                                      <span>Berlaku s/d: {activeWallet.expiredDate ? new Date(activeWallet.expiredDate).toLocaleDateString() : 'N/A'}</span>
                                    </p>
                                  </div>

                                  <div className="shrink-0 flex items-center gap-4">
                                    <div className="text-right">
                                      <div className="text-4xl font-black text-emerald-500 tracking-tighter">{activeWallet.remainingSession}</div>
                                      <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mt-0.5">Sisa dari {activeWallet.totalSession} Sesi</div>
                                    </div>
                                    <div className="w-px h-10 bg-slate-150"></div>
                                    <button
                                      onClick={handleCheckInOut}
                                      disabled={checkingInOut}
                                      className={`px-8 py-4 font-bold rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2.5 active:scale-[0.97] ${
                                        history[0] && history[0].remarks === 'Check-in'
                                          ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20'
                                          : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                                      }`}
                                    >
                                      <Zap className="w-4 h-4 fill-current" />
                                      <span>{checkingInOut
                                        ? 'Processing...'
                                        : (history[0] && history[0].remarks === 'Check-in')
                                          ? 'Check Out Sesi'
                                          : 'Check In Sesi'}</span>
                                    </button>
                                  </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="mt-8 h-3 w-full bg-slate-100 rounded-full overflow-hidden relative z-10">
                                  <div 
                                    className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full transition-all duration-500" 
                                    style={{ width: `${(activeWallet.remainingSession / activeWallet.totalSession) * 100}%` }}
                                  ></div>
                                </div>
                              </div>
                            ) : (
                              <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-150 p-8 text-center space-y-4 text-left flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                                <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center shrink-0 border border-slate-100">
                                    <Activity className="w-6 h-6" />
                                  </div>
                                  <div>
                                    <h4 className="text-md font-bold text-slate-850">Belum Ada Paket Sesi Aktif</h4>
                                    <p className="text-xs text-slate-450 leading-relaxed mt-0.5">Anda tidak memiliki paket sesi kelas yang dapat digunakan.</p>
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleTabChange('sessions')}
                                  className="inline-flex justify-center items-center py-3.5 px-5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl text-xs transition-colors shadow-md shadow-indigo-600/15 active:scale-[0.98] shrink-0"
                                >
                                  <span>Beli Paket Sesi</span>
                                  <Plus className="w-3.5 h-3.5 ml-1.5" />
                                </button>
                              </div>
                            )}

                            {/* Membership Details Card */}
                            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-6 text-left">
                              <h3 className="text-sm font-extrabold text-slate-800 flex items-center tracking-tight mb-4">
                                <Shield className="w-4 h-4 mr-2 text-indigo-500" />
                                Detail Membership
                              </h3>
                              
                              <div className="space-y-4">
                                {community.registrationMode === 'PAID' && (
                                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                    <div>
                                      <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Paket Membership Aktif</h4>
                                      {userMemberships.length > 0 ? (
                                        <div className="mt-1.5">
                                          <div className="text-sm font-bold text-slate-800">{userMemberships[0].membership?.name}</div>
                                          <div className="text-xs text-slate-400 font-semibold mt-0.5">
                                            Masa Berlaku s/d: <span className="text-slate-700 font-bold">{new Date(userMemberships[0].endDate).toLocaleDateString()}</span>
                                          </div>
                                        </div>
                                      ) : (
                                        <p className="text-xs text-rose-500 font-bold mt-1">⚠️ Belum ada paket membership aktif.</p>
                                      )}
                                    </div>
                                    
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedRenewalTierId(community.memberships?.[0]?.id || '');
                                        setRenewalProofUrl('');
                                        setShowRenewalModal(true);
                                      }}
                                      className="py-3 px-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/10 flex items-center justify-center gap-1.5 active:scale-[0.98] shrink-0"
                                    >
                                      <span>Perpanjang</span>
                                      <Plus className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Right Column: NFC Card Pass & Activity Timeline */}
                          <div className="lg:col-span-1 space-y-8">
                            {/* Digital Membership Pass Card (Vertical card!) */}
                            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100/80 p-1.5 overflow-hidden">
                              <div className="bg-gradient-to-tr from-slate-900 via-indigo-950 to-indigo-900 rounded-[2rem] shadow-xl p-6 text-white relative overflow-hidden group border border-slate-800 text-left">
                                <div className="absolute top-0 right-0 -mr-6 -mt-6 w-32 h-32 rounded-full bg-white opacity-[0.03] group-hover:scale-125 transition-transform duration-700"></div>
                                <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-indigo-500 opacity-[0.08] blur-2xl group-hover:scale-110 transition-transform duration-700"></div>
                                
                                <div className="relative z-10 flex justify-between items-start">
                                  <div>
                                    <p className="text-[9px] font-black tracking-widest text-indigo-200 uppercase">{community.name}</p>
                                    <CreditCard className="w-6 h-6 mt-3 opacity-60 text-indigo-300" />
                                  </div>
                                  <div className="w-9 h-9 bg-white/10 backdrop-blur-md rounded-xl border border-white/10 flex items-center justify-center font-black text-sm text-indigo-200 shadow-inner">
                                    OS
                                  </div>
                                </div>
                                
                                <div className="relative z-10 mt-10">
                                  <p className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider mb-0.5">Member ID</p>
                                  <p className="font-mono text-lg tracking-widest font-black text-white">{status.id.split('-')[0].toUpperCase()}</p>
                                </div>
                                
                                <div className="relative z-10 mt-8 flex justify-between items-end border-t border-white/10 pt-4">
                                  <div>
                                    <p className="text-[9px] text-indigo-300 font-bold uppercase tracking-wider">Joined Date</p>
                                    <p className="text-xs font-extrabold text-white mt-0.5">{new Date(status.createdAt).toLocaleDateString()}</p>
                                  </div>
                                  <div className="bg-indigo-500/20 border border-indigo-400/20 px-3 py-1 rounded-xl text-[9px] font-extrabold tracking-wider uppercase text-indigo-200 backdrop-blur-md">
                                    {status.role}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Riwayat Aktivitas & Sesi */}
                            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100/80 p-6">
                              <h3 className="text-sm font-black text-slate-800 mb-4 tracking-tight text-left">Riwayat Aktivitas</h3>
                              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                                {history.map((item, idx) => (
                                  <div key={idx} className="flex justify-between items-center py-2.5 border-b border-slate-50 last:border-0">
                                    <div className="flex items-center">
                                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-2.5 font-black text-[9px]
                                        ${item.type === 'PURCHASE' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' :
                                          item.type === 'FREEZE' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                                          'bg-rose-50 text-rose-600 border border-rose-100'}`}>
                                        {item.type === 'PURCHASE' ? 'IN' : 'OUT'}
                                      </div>
                                      <div className="text-left">
                                        <p className="text-xs font-bold text-slate-800 leading-snug">{item.remarks}</p>
                                        <p className="text-[9px] text-slate-400 font-semibold mt-0.5">{new Date(item.date).toLocaleDateString()}</p>
                                      </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                      <span className={`text-xs font-black tracking-tight
                                        ${item.type === 'PURCHASE' ? 'text-indigo-600' :
                                          item.type === 'FREEZE' ? 'text-amber-500' :
                                          'text-rose-500'}`}>
                                        {item.type === 'PURCHASE' ? `+${item.change}` : `-${item.change}`}
                                      </span>
                                    </div>
                                  </div>
                                ))}

                                {history.length === 0 && (
                                  <p className="text-center py-6 text-[10px] text-slate-400 font-bold">Belum ada riwayat.</p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="max-w-2xl mx-auto bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-8 md:p-10 space-y-8 text-left relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-full blur-3xl opacity-50 -mr-8 -mt-8"></div>
                          
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
                              status.status === 'REJECTED' 
                                ? 'bg-rose-50 text-rose-500 border-rose-100' 
                                : 'bg-amber-50 text-amber-500 border-amber-100'
                            }`}>
                              {status.status === 'REJECTED' ? <X className="w-6 h-6" /> : <Clock className="w-6 h-6 animate-pulse" />}
                            </div>
                            <div>
                              <h3 className="text-xl font-black text-slate-900 tracking-tight">
                                {status.status === 'REJECTED' ? 'Pendaftaran Membership Ditolak' : 'Menunggu Persetujuan Membership'}
                              </h3>
                              <p className="text-xs text-slate-400 font-semibold mt-0.5">
                                Status pendaftaran Anda saat ini adalah <span className={`font-black ${status.status === 'REJECTED' ? 'text-rose-500' : 'text-amber-500'}`}>{status.status}</span>
                              </p>
                            </div>
                          </div>

                          {/* Stepper Progress Bar */}
                          {community.registrationMode === 'PAID' && status.status === 'PENDING' && (
                            <div className="grid grid-cols-3 gap-2 pt-2">
                              <div className="space-y-2 text-left">
                                <div className="h-1.5 w-full bg-indigo-600 rounded-full"></div>
                                <span className="text-[10px] font-black text-indigo-700 block">1. Daftar Akun</span>
                              </div>
                              <div className="space-y-2 text-left">
                                <div className={`h-1.5 w-full rounded-full ${status.paymentProofUrl ? 'bg-indigo-600' : 'bg-slate-200'}`}></div>
                                <span className={`text-[10px] font-black block ${status.paymentProofUrl ? 'text-indigo-700' : 'text-slate-450'}`}>2. Upload Bukti</span>
                              </div>
                              <div className="space-y-2 text-left">
                                <div className="h-1.5 w-full bg-slate-100 rounded-full"></div>
                                <span className="text-[10px] font-black text-slate-400 block">3. Verifikasi Admin</span>
                              </div>
                            </div>
                          )}

                          {status.status === 'REJECTED' ? (
                            <div className="p-5 bg-rose-50/50 border border-rose-150 rounded-3xl space-y-2">
                              <p className="text-xs text-slate-700 leading-relaxed font-medium">
                                Pengelola komunitas menolak pendaftaran atau bukti pembayaran Anda. Silakan hubungi admin di tab **Kontak** untuk rincian penolakan atau unggah ulang bukti yang benar di bawah.
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-6">
                              <p className="text-xs text-slate-550 leading-relaxed font-medium">
                                Pengelola komunitas sedang meninjau pendaftaran Anda. Jika Anda memilih paket berbayar, silakan selesaikan transfer pembayaran ke rekening di bawah ini dan unggah resinya.
                              </p>

                              {community.registrationMode === 'PAID' && (
                                <div className="space-y-6 pt-4 border-t border-slate-100">
                                  <div className="space-y-3">
                                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Langkah Pembayaran & Transfer</h4>
                                    <div className="p-5 bg-slate-50/50 rounded-2xl border border-slate-150/70 space-y-3 text-xs text-slate-650 font-medium">
                                      <p className="font-bold text-slate-800">Silakan lakukan transfer ke salah satu rekening pengelola:</p>
                                      <div className="space-y-2 bg-white p-4 rounded-xl border border-slate-100">
                                        <div className="flex justify-between items-center">
                                          <span className="text-slate-550">Bank BCA:</span>
                                          <span className="font-extrabold text-slate-800 font-mono bg-slate-50 px-2.5 py-1 rounded border border-slate-150">8002931293</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                          <span className="text-slate-550">Bank Mandiri:</span>
                                          <span className="font-extrabold text-slate-800 font-mono bg-slate-50 px-2.5 py-1 rounded border border-slate-150">120001828828</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {status.paymentProofUrl ? (
                                    <div className="space-y-4">
                                      <div className="p-4 bg-emerald-50 border border-emerald-150 rounded-2xl text-emerald-850 text-xs font-bold flex items-center gap-2.5">
                                        <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                                        <span>Bukti transfer berhasil diunggah! Hub Anda akan aktif setelah diverifikasi oleh admin.</span>
                                      </div>
                                      <div className="flex flex-col sm:flex-row gap-3">
                                        <a 
                                          href={status.paymentProofUrl} 
                                          target="_blank" 
                                          rel="noreferrer" 
                                          className="flex-1 text-center text-xs font-bold text-indigo-700 bg-white border border-slate-200 py-3.5 rounded-2xl transition-colors hover:bg-slate-50 shadow-sm"
                                        >
                                          Lihat Bukti yang Dikirim
                                        </a>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setStatus({ ...status, paymentProofUrl: undefined });
                                          }}
                                          className="flex-1 text-center text-xs font-bold text-slate-500 bg-slate-50 hover:bg-slate-100 py-3.5 rounded-2xl transition-colors border border-slate-200"
                                        >
                                          Ganti Bukti Transfer
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="space-y-3">
                                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        Unggah Bukti Transfer / Resi
                                      </label>
                                      <div className="p-6 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center hover:bg-slate-100/50 transition-colors relative">
                                        <input
                                          type="file"
                                          accept="image/*"
                                          onChange={async (e) => {
                                            if (e.target.files && e.target.files[0]) {
                                              const file = e.target.files[0];
                                              try {
                                                const formData = new FormData();
                                                formData.append('file', file);
                                                const headers = getAuthHeaders();
                                                const uploadRes = await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001') + '/upload', {
                                                  method: 'POST',
                                                  headers: {
                                                    'Authorization': headers.Authorization || ''
                                                  },
                                                  body: formData
                                                });
                                                if (!uploadRes.ok) throw new Error('Gagal mengunggah bukti pembayaran');
                                                const uploadData = await uploadRes.json();
                                                const fileUrl = uploadData.url;

                                                const confirmRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/memberships/confirm-payment/${status.id}`, {
                                                  method: 'PATCH',
                                                  headers: {
                                                    'Content-Type': 'application/json',
                                                    'Authorization': headers.Authorization || ''
                                                  },
                                                  body: JSON.stringify({ paymentProofUrl: fileUrl })
                                                });
                                                if (!confirmRes.ok) throw new Error('Gagal memperbarui status konfirmasi');
                                                
                                                const updatedStatus = await confirmRes.json();
                                                setStatus(updatedStatus);
                                              } catch (err) {
                                                alert(err instanceof Error ? err.message : 'Terjadi kesalahan');
                                              }
                                            }
                                          }}
                                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        />
                                        <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-3">
                                          <Plus className="w-5 h-5" />
                                        </div>
                                        <p className="text-xs font-bold text-slate-800">Pilih berkas bukti bayar Anda</p>
                                        <p className="text-[10px] text-slate-450 font-semibold mt-1">Mendukung format gambar (JPG, PNG, WEBP)</p>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    )}

                    {dashboardSubTab === 'profile' && (
                      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-6 md:p-8">
                        <h3 className="text-xl font-extrabold text-slate-900 mb-6">Account Settings</h3>
                        <ProfileSettings />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Package Details Modal */}
      {selectedPackage && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200 overflow-hidden relative">
            
            {/* Modal Header with Background Image */}
            <div className="relative shrink-0 flex flex-col justify-end p-8 pt-12 min-h-[200px]">
              {selectedPackage.image ? (
                <div className="absolute inset-0">
                  <img src={selectedPackage.image} alt={selectedPackage.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 to-transparent"></div>
                </div>
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-purple-50"></div>
              )}
              
              <button 
                onClick={() => setSelectedPackage(null)} 
                className="absolute top-4 right-4 p-2 bg-white/70 hover:bg-white text-slate-900 rounded-full backdrop-blur-md transition-colors shadow-sm z-10"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="relative z-10">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <div className="inline-block bg-indigo-100/80 backdrop-blur-md text-indigo-800 text-xs font-black px-3 py-1.5 rounded-xl uppercase tracking-wider border border-indigo-200/50">
                    {selectedPackage.category?.activity?.name || selectedPackage.activity?.name || 'Activity'} • {selectedPackage.category?.name || 'General'}
                  </div>
                  {selectedPackage.accessRule === 'MEMBER_ONLY' && (
                    <div className="inline-block bg-amber-100/90 backdrop-blur-md text-amber-800 text-xs font-black px-3 py-1.5 rounded-xl uppercase tracking-wider border border-amber-200/50">
                      Member Only
                    </div>
                  )}
                  {selectedPackage.accessRule === 'PAID_MEMBERSHIP_ONLY' && (
                    <div className="inline-block bg-rose-100/90 backdrop-blur-md text-rose-800 text-xs font-black px-3 py-1.5 rounded-xl uppercase tracking-wider border border-rose-200/50">
                      Paid Member Only
                    </div>
                  )}
                </div>
                <h2 className="text-3xl font-extrabold text-slate-900 mb-1 leading-tight">{selectedPackage.name}</h2>
                <div className="text-3xl font-black text-slate-900 flex items-end gap-2">
                  Rp {(selectedPackage.memberPrice || 0).toLocaleString('id-ID')}
                </div>
                {selectedPackage.vipPrice && (
                  <div className="text-sm font-bold text-amber-600 mt-1">
                    Private: Rp {selectedPackage.vipPrice.toLocaleString('id-ID')}
                  </div>
                )}
              </div>
            </div>

            <div className="px-8 pt-6 relative shrink-0">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-slate-50 rounded-2xl p-4 flex flex-col justify-center items-center text-center border border-slate-100">
                  <CheckCircle className="w-6 h-6 text-emerald-500 mb-2" />
                  <span className="text-xl font-bold text-slate-900">{selectedPackage.totalSession}</span>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Sesi</span>
                </div>
                <div className="bg-slate-50 rounded-2xl p-4 flex flex-col justify-center items-center text-center border border-slate-100">
                  <Clock className="w-6 h-6 text-amber-500 mb-2" />
                  <span className="text-xl font-bold text-slate-900">{selectedPackage.validDays}</span>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Hari Aktif</span>
                </div>
              </div>
            </div>

            <div className="px-8 overflow-y-auto overflow-x-hidden min-h-[100px] mb-4 custom-scrollbar">
              <div className="mb-4">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Deskripsi Paket</h3>
                <div className="text-slate-600 text-sm">
                  {selectedPackage.description ? (
                    <p className="whitespace-pre-wrap leading-relaxed break-words">{selectedPackage.description}</p>
                  ) : (
                    <p className="italic text-slate-400">Tidak ada detail tambahan untuk paket ini.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="p-8 pt-0 mt-auto shrink-0 border-t border-slate-50">
              <button 
                onClick={() => {
                  handlePurchase(selectedPackage.id);
                  setSelectedPackage(null);
                }}
                disabled={purchasingMap[selectedPackage.id]}
                className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-600/30 text-base mt-6 disabled:opacity-50"
              >
                {purchasingMap[selectedPackage.id] ? 'Processing...' : 'Beli Paket Ini'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Membership Renewal Request Modal */}
      {showRenewalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 flex flex-col max-h-[90vh]">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Perpanjang Membership</h3>
                <p className="text-xs text-slate-500 mt-1">Pilih paket membership dan unggah bukti transfer.</p>
              </div>
              <button 
                type="button"
                onClick={() => setShowRenewalModal(false)}
                className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form 
              onSubmit={async (e) => {
                e.preventDefault();
                if (!selectedRenewalTierId) {
                  alert('Silakan pilih paket membership terlebih dahulu');
                  return;
                }
                if (!renewalProofUrl) {
                  alert('Silakan unggah bukti transfer pembayaran Anda');
                  return;
                }
                
                setSubmittingRenewal(true);
                try {
                  const headers = getAuthHeaders();
                  const res = await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001') + '/user-membership', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': headers.Authorization || ''
                    },
                    body: JSON.stringify({
                      userId: status?.userId,
                      communityId: status?.communityId,
                      membershipId: selectedRenewalTierId,
                      status: 'PENDING',
                      paymentProofUrl: renewalProofUrl
                    })
                  });
                  if (!res.ok) throw new Error('Gagal mengirim permintaan perpanjangan');
                  
                  alert('Permintaan perpanjangan membership berhasil dikirim! Menunggu persetujuan admin.');
                  setShowRenewalModal(false);
                  fetchDashboardData();
                } catch (err) {
                  alert(err instanceof Error ? err.message : 'Terjadi kesalahan');
                } finally {
                  setSubmittingRenewal(false);
                }
              }} 
              className="p-6 space-y-4 overflow-y-auto"
            >
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Pilih Paket Membership</label>
                <div className="space-y-2">
                  {(community.memberships || []).map((m: Membership) => (
                    <label 
                      key={m.id}
                      className={`flex items-center justify-between p-3.5 bg-slate-50 border rounded-xl cursor-pointer transition-all hover:border-indigo-400 ${
                        selectedRenewalTierId === m.id ? 'border-indigo-500 ring-2 ring-indigo-500/10' : 'border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <input 
                          type="radio"
                          name="renewalTier"
                          checked={selectedRenewalTierId === m.id}
                          onChange={() => setSelectedRenewalTierId(m.id)}
                          className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-slate-300"
                        />
                        <div className="text-left">
                          <div className="font-bold text-slate-800 text-xs">{m.name}</div>
                          <div className="text-[10px] text-slate-400 font-semibold mt-0.5">Durasi: {m.durationDays} hari</div>
                        </div>
                      </div>
                      <div className="font-black text-indigo-600 text-xs">
                        Rp {m.price?.toLocaleString('id-ID') || 0}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl text-xs space-y-2 text-slate-600 font-medium">
                <p className="font-bold text-slate-800">Silakan lakukan transfer ke salah satu rekening:</p>
                <div className="space-y-1 text-slate-500">
                  <div>• Bank BCA: <span className="font-extrabold text-slate-700">8002931293</span> a/n Kas Komunitas</div>
                  <div>• Bank Mandiri: <span className="font-extrabold text-slate-700">120001828828</span> a/n Kas Komunitas</div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">Unggah Bukti Transfer (Image)</label>
                {renewalProofUrl ? (
                  <div className="space-y-2">
                    <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-white p-2">
                      <img src={renewalProofUrl} alt="Bukti Transfer" className="w-full h-auto object-contain max-h-32 rounded-lg mx-auto" />
                    </div>
                    <button 
                      type="button"
                      onClick={() => setRenewalProofUrl('')}
                      className="text-[10px] text-red-500 hover:text-red-700 font-bold"
                    >
                      Hapus Gambar & Ganti
                    </button>
                  </div>
                ) : (
                  <input 
                    type="file"
                    accept="image/*"
                    required
                    onChange={async (e) => {
                      if (e.target.files && e.target.files[0]) {
                        const file = e.target.files[0];
                        try {
                          const formData = new FormData();
                          formData.append('file', file);
                          const headers = getAuthHeaders();
                          const uploadRes = await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001') + '/upload', {
                            method: 'POST',
                            headers: {
                              'Authorization': headers.Authorization || ''
                            },
                            body: formData
                          });
                          if (!uploadRes.ok) throw new Error('Gagal mengunggah gambar');
                          const uploadData = await uploadRes.json();
                          setRenewalProofUrl(uploadData.url);
                        } catch (err) {
                          alert(err instanceof Error ? err.message : 'Gagal mengunggah');
                        }
                      }
                    }}
                    className="w-full text-xs font-semibold text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-[11px] file:font-extrabold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                  />
                )}
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-slate-100 mt-6">
                <button
                  type="button"
                  onClick={() => setShowRenewalModal(false)}
                  className="px-4 py-2 font-bold text-slate-500 hover:bg-slate-100 rounded-xl text-xs transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingRenewal}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50"
                >
                  {submittingRenewal ? 'Mengirim...' : 'Kirim Permintaan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Membership & Session Bundle Checkout Modal */}
      {showBundleModal && bundlePackage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 flex flex-col max-h-[90vh]">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Pembayaran Bundling Keanggotaan & Paket</h3>
                <p className="text-xs text-rose-500 font-semibold mt-1">Keanggotaan Anda hampir berakhir/sudah habis. Wajib perpanjang untuk membeli paket sesi.</p>
              </div>
              <button 
                type="button"
                onClick={() => {
                  setShowBundleModal(false);
                  setBundlePackage(null);
                }}
                className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form 
              onSubmit={async (e) => {
                e.preventDefault();
                if (!bundleProofUrl) {
                  alert('Silakan unggah bukti transfer pembayaran Anda');
                  return;
                }
                if (!selectedBundleTierId) {
                  alert('Silakan pilih tipe membership perpanjangan terlebih dahulu');
                  return;
                }
                
                setSubmittingBundle(true);
                try {
                  const headers = getAuthHeaders();
                  const res = await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001') + '/session-wallet/purchase-bundle', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': headers.Authorization || ''
                    },
                    body: JSON.stringify({
                      userId: status?.userId,
                      communityId: status?.communityId,
                      packageId: bundlePackage.id,
                      membershipId: selectedBundleTierId,
                      paymentProofUrl: bundleProofUrl
                    })
                  });
                  if (!res.ok) throw new Error('Gagal mengirim pembelian bundling');
                  
                  alert('Permintaan bundling membership dan paket sesi berhasil dikirim! Menunggu verifikasi pembayaran oleh admin.');
                  setShowBundleModal(false);
                  setBundlePackage(null);
                  fetchDashboardData();
                } catch (err) {
                  alert(err instanceof Error ? err.message : 'Terjadi kesalahan');
                } finally {
                  setSubmittingBundle(false);
                }
              }} 
              className="p-6 space-y-4 overflow-y-auto"
            >
              {/* Detail Paket Sesi */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-150 flex justify-between items-center text-xs">
                <div>
                  <div className="font-bold text-slate-800">Paket Sesi Pilihan:</div>
                  <div className="text-slate-600 font-semibold mt-0.5">{bundlePackage.name} ({bundlePackage.totalSession} Sesi)</div>
                </div>
                <div className="font-black text-slate-900">
                  Rp {bundlePackage.memberPrice?.toLocaleString('id-ID') || 0}
                </div>
              </div>

              {/* Tipe Membership */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Pilih Paket Perpanjangan Membership</label>
                <div className="space-y-2">
                  {(community.memberships || []).map((m: Membership) => (
                    <label 
                      key={m.id}
                      className={`flex items-center justify-between p-3.5 bg-slate-50 border rounded-xl cursor-pointer transition-all hover:border-indigo-400 ${
                        selectedBundleTierId === m.id ? 'border-indigo-500 ring-2 ring-indigo-500/10' : 'border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <input 
                          type="radio"
                          name="bundleTier"
                          checked={selectedBundleTierId === m.id}
                          onChange={() => setSelectedBundleTierId(m.id)}
                          className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-slate-300"
                        />
                        <div className="text-left">
                          <div className="font-bold text-slate-800 text-xs">{m.name}</div>
                          <div className="text-[10px] text-slate-400 font-semibold mt-0.5">Durasi: {m.durationDays} hari</div>
                        </div>
                      </div>
                      <div className="font-black text-indigo-600 text-xs">
                        Rp {m.price?.toLocaleString('id-ID') || 0}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Rincian Total Pembayaran */}
              {selectedBundleTierId && (
                <div className="p-4 bg-indigo-50/50 border border-indigo-150 rounded-2xl space-y-2 text-xs">
                  <div className="flex justify-between items-center text-slate-600 font-bold">
                    <span>Harga Paket Sesi:</span>
                    <span>Rp {bundlePackage.memberPrice?.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600 font-bold">
                    <span>Harga Membership:</span>
                    <span>
                      Rp {(community.memberships || []).find((m: Membership) => m.id === selectedBundleTierId)?.price?.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-indigo-900 font-extrabold pt-2 border-t border-indigo-150">
                    <span>Total Transfer:</span>
                    <span className="text-sm">
                      Rp {(
                        bundlePackage.memberPrice + 
                        ((community.memberships || []).find((m: Membership) => m.id === selectedBundleTierId)?.price || 0)
                      ).toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              )}

              {/* Rekening Transfer */}
              <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl text-xs space-y-2 text-slate-600 font-medium">
                <p className="font-bold text-slate-800">Silakan lakukan transfer ke salah satu rekening pengelola:</p>
                <div className="space-y-1 text-slate-500">
                  <div>• Bank BCA: <span className="font-extrabold text-slate-700">8002931293</span> a/n Kas Komunitas</div>
                  <div>• Bank Mandiri: <span className="font-extrabold text-slate-700">120001828828</span> a/n Kas Komunitas</div>
                </div>
              </div>

              {/* Bukti Transfer */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">Unggah Bukti Transfer (Image)</label>
                {bundleProofUrl ? (
                  <div className="space-y-2">
                    <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-white p-2">
                      <img src={bundleProofUrl} alt="Bukti Transfer" className="w-full h-auto object-contain max-h-32 rounded-lg mx-auto" />
                    </div>
                    <button 
                      type="button"
                      onClick={() => setBundleProofUrl('')}
                      className="text-[10px] text-red-500 hover:text-red-700 font-bold"
                    >
                      Hapus Gambar & Ganti
                    </button>
                  </div>
                ) : (
                  <input 
                    type="file"
                    accept="image/*"
                    required
                    onChange={async (e) => {
                      if (e.target.files && e.target.files[0]) {
                        const file = e.target.files[0];
                        try {
                          const formData = new FormData();
                          formData.append('file', file);
                          const headers = getAuthHeaders();
                          const uploadRes = await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001') + '/upload', {
                            method: 'POST',
                            headers: {
                              'Authorization': headers.Authorization || ''
                            },
                            body: formData
                          });
                          if (!uploadRes.ok) throw new Error('Gagal mengunggah gambar');
                          const uploadData = await uploadRes.json();
                          setBundleProofUrl(uploadData.url);
                        } catch (err) {
                          alert(err instanceof Error ? err.message : 'Gagal mengunggah');
                        }
                      }
                    }}
                    className="w-full text-xs font-semibold text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-[11px] file:font-extrabold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                  />
                )}
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-slate-100 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowBundleModal(false);
                    setBundlePackage(null);
                  }}
                  className="px-4 py-2 font-bold text-slate-500 hover:bg-slate-100 rounded-xl text-xs transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingBundle}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50"
                >
                  {submittingBundle ? 'Mengirim...' : 'Kirim Permintaan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Mobile Floating Bottom Navigation */}
      <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-[400px] bg-white rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-100 flex items-center justify-between px-6 py-3 z-[100] animate-in slide-in-from-bottom-8">
        {[
          { id: 'home', label: 'Home', icon: Home },
          { id: 'sessions', label: 'Paket', icon: CreditCard },
          { id: 'events', label: 'Event', icon: Calendar },
          { id: 'dashboard', label: 'Profil', icon: Users }
        ].map(item => (
          <button 
            key={item.id}
            onClick={() => handleTabChange(item.id)}
            className="flex flex-col items-center justify-center relative w-12"
          >
            <item.icon className={`w-6 h-6 mb-1 transition-colors ${activeTab === item.id ? 'text-indigo-600' : 'text-slate-400'}`} />
            <span className={`text-[10px] font-bold transition-colors ${activeTab === item.id ? 'text-indigo-600' : 'text-slate-400'}`}>
              {item.label}
            </span>
            {activeTab === item.id && (
              <span className="absolute -bottom-2 w-1 h-1 bg-indigo-600 rounded-full"></span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
