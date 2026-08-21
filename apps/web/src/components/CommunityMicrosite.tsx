'use client';
import { getApiUrl } from '../lib/api';
/* eslint-disable @next/next/no-img-element */

import { useState, useEffect } from 'react';
import JoinButton from './JoinButton';
import ProfileSettings from './ProfileSettings';
import { Home, Info, Phone, Calendar, Clock, MapPin, CheckCircle, Image as ImageIcon, Users, Trophy, Sun, ArrowRight, X, LayoutGrid, Shield, CreditCard, Activity, Zap, Plus, LogOut, Tag, Check, Loader2 } from 'lucide-react';
import { toPng } from 'html-to-image';
import ConfirmModal from './ui/ConfirmModal';
import imageCompression from 'browser-image-compression';
import { getAuthHeaders, removeToken } from '../lib/auth';
import { useParams, useRouter } from 'next/navigation';
import { Community, SessionPackage, GalleryImage, CommunityMember, SessionWallet, UserMembershipWithMembership, Membership, User, Event } from '../types';

interface ActiveWalletView {
  packageId: string;
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
  packageId?: string;
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
  
  // Confirm Check-In/Out Modal State
  const [isCheckInConfirmOpen, setIsCheckInConfirmOpen] = useState(false);
  const [checkInActionData, setCheckInActionData] = useState<{packageId: string, isCheckedIn: boolean} | null>(null);
  
  const router = useRouter();

  // Dashboard states
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [status, setStatus] = useState<CommunityMember | null>(null);
  const [activeWallets, setActiveWallets] = useState<ActiveWalletView[]>([]);
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

  // Voucher states
  const [voucherCodeInput, setVoucherCodeInput] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState<{
    code: string;
    voucherId?: string;
    discountAmount: number;
    message: string;
  } | null>(null);
  const [validatingVoucher, setValidatingVoucher] = useState(false);
  const [voucherError, setVoucherError] = useState('');
  const [isPrivateSession, setIsPrivateSession] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [purchasePackage, setPurchasePackage] = useState<SessionPackage | null>(null);
  const [purchaseProofUrl, setPurchaseProofUrl] = useState('');

  // Guest RSVP Modal
  const [showGuestRsvpModal, setShowGuestRsvpModal] = useState(false);
  const [guestRsvpPackage, setGuestRsvpPackage] = useState<SessionPackage | null>(null);
  const [guestForm, setGuestForm] = useState({ name: '', email: '', phone: '', address: '', acceptedTnC: false });
  const [submittingGuest, setSubmittingGuest] = useState(false);

  // Theme state
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Check local storage for theme preference
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme === 'dark') {
      setIsDarkMode(true);
    } else if (!storedTheme && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDarkMode(true);
    }
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    localStorage.setItem('theme', !isDarkMode ? 'dark' : 'light');
  };

  const getMembershipRemainingDays = () => {
    if (!userMemberships || userMemberships.length === 0) return 0;
    const activeMemberships = userMemberships.filter((m: UserMembershipWithMembership) => m.status === 'ACTIVE');
    if (activeMemberships.length === 0) return 0;
    const dates = activeMemberships.map((m: UserMembershipWithMembership) => new Date(m.endDate).getTime());
    const maxDate = Math.max(...dates);
    const diffTime = maxDate - Date.now();
    if (diffTime <= 0) return 0;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const downloadCard = async () => {
    const cardElement = document.getElementById('member-card');
    const bgElement = document.getElementById('member-card-bg');
    if (!cardElement) return;
    
    let originalBg = '';
    // If there is a logo, try to convert it to base64 so html2canvas doesn't fail on CORS
    if (bgElement && community.logo) {
      originalBg = bgElement.style.backgroundImage;
      try {
        const res = await fetch(community.logo, { mode: 'cors' });
        if (res.ok) {
           const blob = await res.blob();
           const reader = new FileReader();
           const base64 = await new Promise<string>((resolve) => {
             reader.onloadend = () => resolve(reader.result as string);
             reader.readAsDataURL(blob);
           });
           bgElement.style.backgroundImage = `url(${base64})`;
        } else {
           bgElement.style.backgroundImage = 'none'; // Fallback
        }
      } catch (e) {
        bgElement.style.backgroundImage = 'none'; // Fallback
      }
    }
    
    // Give DOM a tiny moment to update background if changed
    await new Promise(r => setTimeout(r, 50));

    try {
      const dataUrl = await toPng(cardElement, {
        pixelRatio: 3, 
        cacheBust: true,
        backgroundColor: 'transparent',
      });
      
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `Membership-Card-${status?.membershipNumber || 'Draft'}.png`;
      link.click();
    } catch (err) {
      console.error('Failed to download card:', err);
      let errorMessage = 'Unknown error';
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      } else {
        errorMessage = String(err);
      }
      alert('Gagal mengunduh kartu. Error: ' + errorMessage);
    } finally {
      if (bgElement && originalBg) {
        bgElement.style.backgroundImage = originalBg;
      }
    }
  };

  const fetchDashboardData = async () => {
    const headers = getAuthHeaders();
    if (!headers.Authorization) return;
    setLoadingDashboard(true);
    setErrorDashboard('');
    try {
      const res = await fetch(`${getApiUrl()}/memberships/my-status/${slug}`, {
        headers: { ...headers },
      });
      if (!res.ok) throw new Error('Failed to fetch membership status');
      const data = await res.json();
      setStatus(data);

      const meRes = await fetch(getApiUrl() + '/auth/me', { headers });
      if (meRes.ok) {
        const meData = await meRes.json();
        setCurrentUser(meData);
      }

      if (data && data.userId && data.communityId) {
        const activeMembershipsRes = await fetch(`${getApiUrl()}/user-membership/active/${data.userId}?communityId=${data.communityId}`, {
          headers: { ...headers }
        });
        if (activeMembershipsRes.ok) {
          const membershipsData = await activeMembershipsRes.json();
          setUserMemberships(membershipsData);
        }
        const walletRes = await fetch(`${getApiUrl()}/session-wallet/user/${data.userId}?communityId=${data.communityId}`, {
          headers: { ...headers }
        });
        if (walletRes.ok) {
          const walletData = await walletRes.json();
          const wallets = walletData as SessionWallet[];
          const groupedWallets = new Map<string, ActiveWalletView>();

          wallets.forEach((w) => {
            if (w.walletStatus === 'ACTIVE' || w.walletStatus === 'WAITING' || w.walletStatus === 'PENDING' || w.walletStatus === 'WAITLIST' || w.walletStatus === 'COMPLETED') {
              const pid = w.packageId;
              if (!groupedWallets.has(pid)) {
                groupedWallets.set(pid, {
                  packageId: pid,
                  packageName: w.package?.name || 'Session Package',
                  totalSession: 0,
                  remainingSession: 0,
                  expiredDate: w.expiredDate ? w.expiredDate.toString() : null,
                  status: w.walletStatus
                });
              }
              const group = groupedWallets.get(pid)!;
              group.totalSession += w.totalSession;
              group.remainingSession += w.remainingSession;
              // If the current wallet has an earlier active expiration, we could use it, 
              // but we'll stick to the ACTIVE one's expiration if available
              if (w.walletStatus === 'ACTIVE' && w.expiredDate) {
                group.expiredDate = w.expiredDate.toString();
                group.status = 'ACTIVE';
              }
            }
          });

          setActiveWallets(Array.from(groupedWallets.values()));

          const allTransactions: HistoryItem[] = [];
          (walletData as SessionWallet[]).forEach((w) => {
            allTransactions.push({
              type: 'PURCHASE',
              change: w.totalSession,
              date: w.purchaseDate ? new Date(w.purchaseDate) : new Date(),
              remarks: `Purchased ${w.package?.name || 'Package'}`,
              packageId: w.packageId
            });
            if (w.transactions && Array.isArray(w.transactions)) {
              w.transactions.forEach((tx) => {
                allTransactions.push({
                  type: tx.transactionType,
                  change: tx.changeSession,
                  date: new Date(tx.createdAt),
                  remarks: tx.remarks || (tx.transactionType === 'ATTENDANCE' ? 'Check-in' : tx.transactionType),
                  packageId: w.packageId
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
    if (activeTab === 'dashboard' || activeTab === 'sessions' || activeTab === 'home') {
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
          const res = await fetch(`${getApiUrl()}/memberships/my-status/${slug}`, {
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
      const res = await fetch(`${getApiUrl()}/gallery/community/${community.id}`);
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
      const res = await fetch(`${getApiUrl()}/session-package/community/${community.id}`);
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
      const res = await fetch(`${getApiUrl()}/events/community/${community.id}`);
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
    const pkg = sessions.find(p => p.id === pkgId) || selectedPackage;
    if (!pkg) {
      alert('Paket tidak ditemukan');
      return;
    }

    const headers = getAuthHeaders();
    if (!headers.Authorization) {
      if (pkg.accessRule === 'PUBLIC') {
        setGuestRsvpPackage(pkg);
        setGuestForm({ name: '', email: '', phone: '', address: '', acceptedTnC: false });
        setShowGuestRsvpModal(true);
        return;
      } else {
        router.push(`/${slug}/login`);
        return;
      }
    }

    if (!status && pkg.accessRule !== 'PUBLIC') {
      alert("Silakan daftar/gabung komunitas terlebih dahulu sebelum membeli paket khusus member.");
      return;
    }

    // Check membership remaining duration (require renewal bundle if <= 2 days or empty)
    const days = getMembershipRemainingDays();
    const requiresPaidMembership = community.registrationMode === 'PAID' || pkg.accessRule === 'MEMBER_ONLY' || pkg.accessRule === 'PAID_MEMBERSHIP_ONLY';

    if (requiresPaidMembership && days <= 2) {
      if (!selectedPackage) setIsPrivateSession(pkg.vipPrice && !pkg.memberPrice ? true : false);
      setSelectedPackage(null);
      setBundlePackage(pkg);
      setSelectedBundleTierId(community.memberships && community.memberships.length > 0 ? community.memberships[0].id : '');
      setBundleProofUrl('');
      setShowBundleModal(true);
      return;
    }

    setPurchasingMap(prev => ({ ...prev, [pkgId]: true }));
    try {
      // Get current user ID
      const meRes = await fetch(getApiUrl() + '/auth/me', { headers });
      if (!meRes.ok) throw new Error('Please login again');
      const meData = await meRes.json();

      // Store selected package and open purchase modal
      if (!selectedPackage) setIsPrivateSession(pkg.vipPrice && !pkg.memberPrice ? true : false);
      setPurchasePackage(pkg);
      setPurchaseProofUrl('');
      setAppliedVoucher(null);
      setVoucherCodeInput('');
      setVoucherError('');
      setShowPurchaseModal(true);
      // No need to continue purchase here; submission will happen in modal
      return;
    } catch (e) {
      alert(e instanceof Error ? e.message : 'An error occurred');
    } finally {
      setPurchasingMap(prev => ({ ...prev, [pkgId]: false }));
    }
  };

  const handleCheckInOut = async (packageId: string) => {
    const headers = getAuthHeaders();
    if (!headers.Authorization || !status || !status.userId || !status.communityId) {
      alert('Authentication or membership status missing.');
      return;
    }
    
    // Check if the latest history for THIS package is a check-in.
    const packageHistory = history.filter(h => h.packageId === packageId);
    const isCheckedIn = packageHistory.length > 0 && packageHistory[0].remarks === 'Check-in';
    
    setCheckInActionData({ packageId, isCheckedIn });
    setIsCheckInConfirmOpen(true);
  };

  const executeCheckInOut = async () => {
    if (!checkInActionData || !status) return;
    const { packageId, isCheckedIn } = checkInActionData;
    const headers = getAuthHeaders();
    const endpoint = isCheckedIn ? 'member/check-out' : 'member/check-in';
    
    setCheckingInOut(true);
    try {
      const res = await fetch(`${getApiUrl()}/session-wallet/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        body: JSON.stringify({
          userId: status.userId,
          communityId: status.communityId,
          packageId,
          remarks: isCheckedIn ? 'Check-out' : 'Check-in'
        })
      });
      
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || `Failed to perform action`);
      }
      
      alert(`Successfully ${isCheckedIn ? 'checked out' : 'checked in'}!`);
      await fetchDashboardData();
    } catch (err) {
      alert(err instanceof Error ? err.message : `Failed to perform action`);
    } finally {
      setCheckingInOut(false);
      setIsCheckInConfirmOpen(false);
      setCheckInActionData(null);
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
    <div 
      className={isDarkMode ? 'dark' : ''} 
      style={community.theme ? { '--primary': community.theme, '--color-primary': community.theme } as React.CSSProperties : undefined}
    >
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans selection:bg-primary selection:text-white transition-colors duration-300">
      
      {/* Mobile Top Navigation (Mockup) */}
      <nav className="flex md:hidden items-center justify-between px-3.5 py-3.5 bg-white dark:bg-slate-950 sticky top-0 z-[100] pointer-events-auto shadow-sm gap-2">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="w-9 h-9 rounded-xl overflow-hidden bg-primary text-white flex items-center justify-center font-bold shadow-md shrink-0 border border-slate-100 dark:border-slate-800">
            {community.logo ? (
              <img src={community.logo} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <Users className="w-4 h-4" />
            )}
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="font-extrabold text-sm text-slate-900 dark:text-slate-50 leading-tight truncate">{community.name}</span>
            {community.tagline && <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{community.tagline}</span>}
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button 
            onClick={toggleDarkMode}
            className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-colors shrink-0"
            title="Toggle Dark Mode"
          >
            <Sun className="w-4 h-4" />
          </button>
          {(!isLoggedIn || !status) ? (
            <JoinButton 
              communityId={community.id} 
              slug={slug} 
              registrationFields={community.registrationFields} 
              registrationMode={community.registrationMode}
              memberships={community.memberships}
              label={community.joinCtaLabel || undefined}
              className="px-3.5 py-1.5 bg-primary hover:opacity-90 text-white font-bold rounded-xl shadow-md transition-colors text-xs flex items-center gap-1 shrink-0"
              icon={<ArrowRight className="w-3 h-3 ml-1" />}
            />
          ) : (
            <button 
              onClick={() => handleTabChange('dashboard')}
              className="px-3 py-1.5 bg-primary text-white font-bold rounded-xl shadow-md text-xs shrink-0"
            >
              Dashboard
            </button>
          )}
        </div>
      </nav>

      {/* Desktop Top Navigation */}
      <nav className="hidden md:flex items-center justify-between px-8 py-4 bg-white dark:bg-slate-950/80 backdrop-blur-md sticky top-0 z-[100] border-b border-slate-100 dark:border-slate-800 pointer-events-auto">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-gradient-to-tr from-indigo-100 to-purple-100 text-primary flex items-center justify-center font-bold text-lg md:text-xl shadow-inner overflow-hidden border border-slate-100 dark:border-slate-800 shrink-0">
            {community.logo ? (
              <img src={community.logo} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <Users className="w-4 h-4 md:w-6 md:h-6" />
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-extrabold text-base md:text-lg text-slate-900 dark:text-slate-50 tracking-tight truncate max-w-[150px] md:max-w-xs leading-tight">{community.name}</span>
            {community.tagline && <span className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[150px] md:max-w-xs">{community.tagline}</span>}
          </div>
        </div>

        <div className="flex items-center gap-1 md:gap-4 shrink-0">
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
                  cursor-pointer flex items-center px-3 py-2 md:px-4 md:py-2 rounded-xl text-xs md:text-sm font-semibold capitalize transition-all duration-300 whitespace-nowrap
                  ${activeTab === tab 
                    ? 'bg-primary/5 text-primary' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-50 dark:text-slate-50 hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-900'}
                `}
              >
                {getTabIcon(tab)}
                {label}
              </button>
            )
          })}
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={toggleDarkMode}
            className="w-10 h-10 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
            title="Toggle Dark Mode"
          >
            <Sun className="w-5 h-5" />
          </button>
          {(!isLoggedIn || !status) && (
            <JoinButton 
              communityId={community.id} 
              slug={slug} 
              registrationFields={community.registrationFields} 
              registrationMode={community.registrationMode}
              memberships={community.memberships}
              label={community.joinCtaLabel || undefined}
              className="px-5 py-2.5 bg-primary hover:opacity-90 text-white font-bold rounded-full shadow-md transition-colors text-sm flex items-center gap-1"
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
        <div className="md:hidden flex flex-col pb-24 animate-in fade-in relative">
          
          {/* Mobile Background Banner */}
          {community.heroBanner && (
            <div className="absolute top-0 left-0 right-0 h-64 -z-10 pointer-events-none">
              <img src={community.heroBanner} alt="Hero Banner" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-b from-slate-50/10 via-slate-50/80 to-slate-50 dark:from-slate-950/10 dark:via-slate-950/80 dark:to-slate-950 pointer-events-none"></div>
            </div>
          )}

          {/* Mobile Hero Card */}
          <div className="mx-4 mt-6 p-6 rounded-[32px] bg-gradient-to-br from-[#f8f9ff]/90 to-white/90 dark:from-slate-900/90 dark:to-slate-900/90 backdrop-blur-sm border border-indigo-50 dark:border-slate-800 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-bl-[100px] opacity-30 pointer-events-none"></div>
            
            <div className="w-12 h-12 bg-white dark:bg-slate-950 rounded-2xl border border-primary/20 flex items-center justify-center text-primary mb-6 shadow-sm">
              <Users className="w-6 h-6" />
            </div>
            
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-50 leading-tight mb-3">
              {community.welcomeMessage || 'Selamat datang di'} <br/>
              <span className="text-primary">{community.name}</span>
            </h1>
            
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-[200px] mb-6">
              {community.shortDescription || 'Komunitas yang menghubungkan orang, berbagi pengetahuan, menciptakan pengalaman bermakna, dan tumbuh bersama.'}
            </p>
            
            {(!isLoggedIn || !status) ? (
              <JoinButton 
                communityId={community.id} 
                slug={slug} 
                registrationFields={community.registrationFields} 
                registrationMode={community.registrationMode}
                memberships={community.memberships}
                label={community.joinCtaLabel || undefined}
                className="px-6 py-3 bg-primary text-white font-bold rounded-full shadow-md text-sm flex items-center justify-center w-max mb-4"
                icon={<ArrowRight className="w-4 h-4 ml-2" />}
              />
            ) : (
              <button 
                onClick={() => handleTabChange('dashboard')}
                className="px-6 py-3 bg-primary text-white font-bold rounded-full shadow-md text-sm flex items-center justify-center w-max mb-4"
              >
                Dashboard <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            )}
            
            <button onClick={() => handleTabChange('sessions')} className="text-primary font-bold text-sm flex items-center">
              Lihat Paket <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </div>

          {/* Mobile Stats Carousel */}
          <div className="flex overflow-x-auto gap-4 px-4 py-6 scrollbar-none snap-x snap-mandatory">
            <div className="bg-white dark:bg-slate-950 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex-shrink-0 w-28 flex flex-col items-center justify-center snap-center">
              <div className="w-10 h-10 rounded-full bg-primary/5 text-primary flex items-center justify-center mb-2">
                <Users className="w-5 h-5" />
              </div>
              <div className="text-lg font-black text-slate-900 dark:text-slate-50">{community.statMembersValue || '12.5K'}</div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Members</div>
            </div>
            
            <div className="bg-white dark:bg-slate-950 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex-shrink-0 w-28 flex flex-col items-center justify-center snap-center">
              <div className="w-10 h-10 rounded-full bg-pink-50 text-pink-600 flex items-center justify-center mb-2">
                <Calendar className="w-5 h-5" />
              </div>
              <div className="text-lg font-black text-slate-900 dark:text-slate-50">{community.statEventsValue || sessions.length || '256'}</div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Packages</div>
            </div>
            
            <div className="bg-white dark:bg-slate-950 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex-shrink-0 w-28 flex flex-col items-center justify-center snap-center">
              <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-2">
                <MapPin className="w-5 h-5" />
              </div>
              <div className="text-lg font-black text-slate-900 dark:text-slate-50">{community.statCitiesValue || '48'}</div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Cities</div>
            </div>
            
            <div className="bg-white dark:bg-slate-950 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex-shrink-0 w-28 flex flex-col items-center justify-center snap-center">
              <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mb-2">
                <Trophy className="w-5 h-5" />
              </div>
              <div className="text-lg font-black text-slate-900 dark:text-slate-50">{community.statAchievementsValue || '120'}</div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Achievements</div>
            </div>
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
              <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-white/80 to-[#fafafc] dark:from-slate-950/40 dark:via-slate-950/80 dark:to-slate-950 pointer-events-none"></div>
            </div>
          ) : (
            <>
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-b from-indigo-50/80 to-transparent dark:from-indigo-900/20 rounded-full blur-3xl -z-10 pointer-events-none"></div>
              <div className="absolute top-20 left-20 w-32 h-32 bg-[radial-gradient(#e5e7eb_2px,transparent_2px)] dark:bg-[radial-gradient(#1e293b_2px,transparent_2px)] [background-size:16px_16px] opacity-50 -z-10 pointer-events-none"></div>
              <div className="absolute bottom-20 right-20 w-64 h-64 bg-purple-50 dark:bg-purple-900/20 rounded-full blur-3xl -z-10 opacity-60 pointer-events-none"></div>
            </>
          )}
          
          <div className="relative z-10 max-w-4xl mx-auto text-center animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="inline-flex items-center justify-center w-20 h-20 md:w-24 md:h-24 rounded-3xl md:rounded-[32px] bg-white dark:bg-slate-950 shadow-xl shadow-indigo-900/5 border border-slate-100 dark:border-slate-800 mb-6 md:mb-8 relative">
              {community.logo ? (
                <img src={community.logo} alt="Logo" className="w-12 h-12 md:w-14 md:h-14 object-cover rounded-xl" />
              ) : (
                <Users className="w-8 h-8 md:w-10 md:h-10 text-primary" />
              )}
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight leading-[1.15] md:leading-[1.1] mb-6">
              {community.welcomeMessage || 'Welcome to'} <br/>
              <span className="text-primary">{community.name}</span>
            </h1>
            
            <p className="text-base sm:text-lg lg:text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto mb-8 md:mb-10 leading-relaxed px-2">
              {community.shortDescription ? community.shortDescription : 'We are a community that connects people, shares knowledge, creates meaningful experiences, and grows together.'}
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {(!isLoggedIn || !status) ? (
                <JoinButton 
                  communityId={community.id} 
                  slug={slug} 
                  registrationFields={community.registrationFields} 
                  registrationMode={community.registrationMode}
                  memberships={community.memberships}
                  label={community.joinCtaLabel || undefined}
                  className="w-full sm:w-auto px-8 py-4 bg-primary text-white font-bold rounded-full shadow-lg shadow-primary/30 hover:opacity-90 hover:scale-105 transition-all flex items-center justify-center gap-2"
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
                  className="w-full sm:w-auto px-8 py-4 bg-primary text-white font-bold rounded-full shadow-lg shadow-primary/30 hover:opacity-90 hover:scale-105 transition-all flex items-center justify-center"
                >
                  Buka Dashboard <ArrowRight className="w-5 h-5 ml-2" />
                </button>
              )}
              <button 
                onClick={() => handleTabChange('sessions')}
                className="w-full sm:w-auto px-8 py-4 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 font-bold rounded-full border border-slate-200 dark:border-slate-700 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-900 hover:scale-105 transition-all flex items-center justify-center"
              >
                <Calendar className="w-5 h-5 mr-2 text-slate-400" /> Lihat Paket
              </button>
            </div>
          </div>

          {/* Floating Stats Bar */}
          <div className="max-w-5xl mx-auto mt-16 md:mt-24 px-4 sm:px-0">
            <div className="bg-white dark:bg-slate-950 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 dark:border-slate-800 p-6 md:p-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-0 md:divide-x divide-slate-100 dark:divide-slate-800">
                
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4 text-center sm:text-left">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary">
                    <Users className="w-5 h-5 md:w-6 md:h-6" />
                  </div>
                  <div>
                    <div className="text-xl md:text-2xl font-black text-slate-900 dark:text-slate-50">{community.statMembersValue || '0'}</div>
                    <div className="text-xs md:text-sm font-medium text-slate-500 dark:text-slate-400">Members</div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4 text-center sm:text-left">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-600">
                    <Calendar className="w-5 h-5 md:w-6 md:h-6" />
                  </div>
                  <div>
                    <div className="text-xl md:text-2xl font-black text-slate-900 dark:text-slate-50">{community.statEventsValue || (sessions.length > 0 ? sessions.length : '0')}</div>
                    <div className="text-xs md:text-sm font-medium text-slate-500 dark:text-slate-400">Packages</div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4 text-center sm:text-left">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600">
                    <MapPin className="w-5 h-5 md:w-6 md:h-6" />
                  </div>
                  <div>
                    <div className="text-xl md:text-2xl font-black text-slate-900 dark:text-slate-50">{community.statCitiesValue || '0'}</div>
                    <div className="text-xs md:text-sm font-medium text-slate-500 dark:text-slate-400">Cities</div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4 text-center sm:text-left">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary">
                    <Trophy className="w-5 h-5 md:w-6 md:h-6" />
                  </div>
                  <div>
                    <div className="text-xl md:text-2xl font-black text-slate-900 dark:text-slate-50">{community.statAchievementsValue || '0'}</div>
                    <div className="text-xs md:text-sm font-medium text-slate-500 dark:text-slate-400">Achievements</div>
                  </div>
                </div>

              </div>
            </div>
          </div>
          
          {/* Available Packages Section (Preview) */}
          <div className="max-w-6xl mx-auto mt-24 md:mt-32">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 md:mb-8 px-4 gap-4 sm:gap-0">
              <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-slate-50">{community.packagesHeadingLabel || 'Available Packages'}</h2>
              <button 
                onClick={() => setActiveTab('sessions')}
                className="text-primary font-bold flex items-center hover:opacity-80 transition-colors text-sm md:text-base"
              >
                Lihat Semua Paket <ArrowRight className="w-4 h-4 ml-1" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 px-4">
              {sessions.slice(0, 3).length > 0 ? sessions.slice(0, 3).map((pkg) => (
                <div key={pkg.id} className="bg-white dark:bg-slate-950 rounded-3xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group flex flex-col relative overflow-hidden">
                  {pkg.image ? (
                    <div className="relative h-32 -mx-5 -mt-5 mb-5 bg-slate-100 shrink-0 border-b border-slate-100 dark:border-slate-800">
                      <img src={pkg.image} alt={pkg.name} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-full blur-3xl -z-10 group-hover:scale-150 transition-transform duration-700"></div>
                  )}
                  
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className="bg-primary/5 text-primary text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider">
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
                  
                  <h3 className="font-extrabold text-xl text-slate-900 dark:text-slate-50 mb-1">{pkg.name}</h3>
                  
                  {pkg.memberPrice && pkg.vipPrice ? (
                    <>
                      <div className="text-2xl font-black text-slate-900 dark:text-slate-50 mb-1 flex items-end gap-1">
                        Rp {pkg.memberPrice.toLocaleString('id-ID')}
                      </div>
                      <div className="text-xs font-bold text-amber-500 mb-5">
                        Private: Rp {pkg.vipPrice.toLocaleString('id-ID')}
                      </div>
                    </>
                  ) : pkg.vipPrice && !pkg.memberPrice ? (
                    <div className="text-2xl font-black text-amber-500 mb-6 flex items-end gap-1">
                      Private: Rp {pkg.vipPrice.toLocaleString('id-ID')}
                    </div>
                  ) : pkg.memberPrice && !pkg.vipPrice ? (
                    <div className="text-2xl font-black text-slate-900 dark:text-slate-50 mb-6 flex items-end gap-1">
                      Rp {pkg.memberPrice.toLocaleString('id-ID')}
                    </div>
                  ) : (
                    <div className="text-2xl font-black text-slate-900 dark:text-slate-50 mb-6 flex items-end gap-1">
                      Gratis
                    </div>
                  )}

                  <div className="space-y-2 mb-6 mt-auto">
                    <div className="flex items-center text-xs font-bold text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 px-3 py-2 rounded-xl">
                      <CheckCircle className="w-4 h-4 mr-2 text-emerald-500 shrink-0" />
                      {pkg.totalSession} Sessions
                    </div>
                    <div className="flex items-center text-xs font-bold text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 px-3 py-2 rounded-xl">
                      <Clock className="w-4 h-4 mr-2 text-amber-500 shrink-0" />
                      Valid for {pkg.validDays} Days
                    </div>
                    {pkg.quota !== null && pkg.quota !== undefined && (
                      <div className="flex items-center text-[11px] sm:text-xs font-bold text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 px-3 py-2 rounded-xl">
                        <Users className="w-4 h-4 mr-2 text-indigo-500 shrink-0" />
                        Kuota Terisi: {pkg.currentParticipants || 0}/{pkg.quota}
                      </div>
                    )}
                    {pkg.privateQuota !== null && pkg.privateQuota !== undefined && (
                      <div className="flex items-center text-[11px] sm:text-xs font-bold text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 px-3 py-2 rounded-xl">
                        <Users className="w-4 h-4 mr-2 text-amber-500 shrink-0" />
                        Privat Terisi: {pkg.currentPrivateParticipants || 0}/{pkg.privateQuota}
                      </div>
                    )}
                  </div>

                  <div className="mt-auto grid grid-cols-2 gap-2">
                    <button 
                      onClick={() => { setSelectedPackage(pkg); setIsPrivateSession(pkg.vipPrice && !pkg.memberPrice ? true : false); }}
                      className="w-full py-2 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-50 border-2 border-slate-900 font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-900 transition-colors text-sm"
                    >
                      Detail
                    </button>
                    <button 
                      onClick={() => pkg.vipPrice ? (setSelectedPackage(pkg), setIsPrivateSession(pkg.vipPrice && !pkg.memberPrice ? true : false)) : handlePurchase(pkg.id)}
                      disabled={purchasingMap[pkg.id]}
                      className="w-full py-2 bg-slate-900 text-white font-bold rounded-xl hover:bg-primary transition-colors shadow-sm text-sm disabled:opacity-50"
                    >
                      {purchasingMap[pkg.id] ? 'Processing...' : 'Beli'}
                    </button>
                  </div>
                </div>
              )) : (
                <div className="col-span-full py-12 text-center text-slate-400 font-medium bg-white dark:bg-slate-950 rounded-3xl border border-slate-100 dark:border-slate-800">
                  No packages available yet.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Other Tabs Wrapper */}
      {activeTab !== 'home' && (
        <div className="max-w-6xl mx-auto w-full p-4 pb-32 md:p-6 lg:p-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {activeTab === 'sessions' && (
            <div className="bg-white dark:bg-slate-950 p-6 md:p-8 lg:p-12 rounded-3xl md:rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800">
              <h3 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-slate-50 mb-8 flex items-center">
                <Calendar className="w-6 h-6 md:w-8 md:h-8 mr-3 md:mr-4 text-primary" />
                {community.packagesHeadingLabel || 'Available Session Packages'}
              </h3>
              
              {loadingSessions ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : sessions.length === 0 ? (
                <div className="bg-slate-50 dark:bg-slate-900 p-12 rounded-3xl border border-slate-100 dark:border-slate-800 text-center text-slate-500 dark:text-slate-400 font-medium">
                  No session packages available at the moment. Check back later!
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {sessions.map((pkg) => (
                    <div key={pkg.id} className="bg-white dark:bg-slate-950 rounded-3xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group flex flex-col relative overflow-hidden">
                      {pkg.image ? (
                        <div className="relative h-36 -mx-5 -mt-5 mb-5 bg-slate-100 shrink-0 border-b border-slate-100 dark:border-slate-800">
                          <img src={pkg.image} alt={pkg.name} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-50/80 to-purple-50/80 rounded-full blur-3xl -z-10 group-hover:scale-150 transition-transform duration-700"></div>
                      )}
                      
                      <div className="flex flex-wrap items-center gap-2 mb-4">
                        <span className="bg-primary/5 text-primary text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider">
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
                      
                      <h3 className="font-extrabold text-xl text-slate-900 dark:text-slate-50 mb-1">{pkg.name}</h3>
                      
                      {pkg.memberPrice && pkg.vipPrice ? (
                        <>
                          <div className="text-2xl font-black text-slate-900 dark:text-slate-50 mb-1 flex items-end gap-1">
                            Rp {pkg.memberPrice.toLocaleString('id-ID')}
                          </div>
                          <div className="text-xs font-bold text-amber-500 mb-6">
                            Private: Rp {pkg.vipPrice.toLocaleString('id-ID')}
                          </div>
                        </>
                      ) : pkg.vipPrice && !pkg.memberPrice ? (
                        <div className="text-2xl font-black text-amber-500 mb-6 flex items-end gap-1">
                          Private: Rp {pkg.vipPrice.toLocaleString('id-ID')}
                        </div>
                      ) : pkg.memberPrice && !pkg.vipPrice ? (
                        <div className="text-2xl font-black text-slate-900 dark:text-slate-50 mb-6 flex items-end gap-1">
                          Rp {pkg.memberPrice.toLocaleString('id-ID')}
                        </div>
                      ) : (
                        <div className="text-2xl font-black text-slate-900 dark:text-slate-50 mb-6 flex items-end gap-1">
                          Gratis
                        </div>
                      )}

                      <div className="space-y-2 mb-6 mt-auto border-t border-slate-100 dark:border-slate-800 pt-4">
                        <div className="flex items-center text-xs font-bold text-slate-600 dark:text-slate-400">
                          <CheckCircle className="w-4 h-4 mr-2 text-emerald-500 shrink-0" />
                          {pkg.totalSession} Sessions Total
                        </div>
                        <div className="flex items-center text-xs font-bold text-slate-600 dark:text-slate-400">
                          <Clock className="w-4 h-4 mr-2 text-amber-500 shrink-0" />
                          Valid for {pkg.validDays} Days
                        </div>
                        {pkg.quota !== null && pkg.quota !== undefined && (
                          <div className="flex items-center text-[11px] sm:text-xs font-bold text-slate-600 dark:text-slate-400">
                            <Users className="w-4 h-4 mr-2 text-indigo-500 shrink-0" />
                            Kuota Terisi: {pkg.currentParticipants || 0}/{pkg.quota}
                          </div>
                        )}
                        {pkg.privateQuota !== null && pkg.privateQuota !== undefined && (
                          <div className="flex items-center text-[11px] sm:text-xs font-bold text-slate-600 dark:text-slate-400">
                            <Users className="w-4 h-4 mr-2 text-amber-500 shrink-0" />
                            Privat Terisi: {pkg.currentPrivateParticipants || 0}/{pkg.privateQuota}
                          </div>
                        )}
                      </div>

                      <div className="mt-auto grid grid-cols-2 gap-2">
                        <button 
                          onClick={() => { setSelectedPackage(pkg); setIsPrivateSession(pkg.vipPrice && !pkg.memberPrice ? true : false); }}
                          className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-50 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-sm"
                        >
                          Detail
                        </button>
                        <button 
                          onClick={() => pkg.vipPrice ? (setSelectedPackage(pkg), setIsPrivateSession(pkg.vipPrice && !pkg.memberPrice ? true : false)) : handlePurchase(pkg.id)}
                          disabled={purchasingMap[pkg.id]}
                          className="w-full py-2.5 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-colors shadow-md shadow-primary/20 text-sm disabled:opacity-50"
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
            <div className="bg-white dark:bg-slate-950 p-6 md:p-8 lg:p-12 rounded-3xl md:rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800">
              <h3 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-slate-50 mb-8 flex items-center">
                <ImageIcon className="w-6 h-6 md:w-8 md:h-8 mr-3 md:mr-4 text-primary" />
                Photo Gallery
              </h3>
              
              {loadingGallery ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : galleryImages.length === 0 ? (
                <div className="bg-slate-50 dark:bg-slate-900 p-12 rounded-3xl border border-slate-100 dark:border-slate-800 text-center text-slate-500 dark:text-slate-400 font-medium">
                  No photos uploaded to this community yet.
                </div>
              ) : (
                <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
                  {galleryImages.map((image) => (
                    <div key={image.id} className="break-inside-avoid relative group rounded-3xl overflow-hidden bg-white dark:bg-slate-950 shadow-sm border border-slate-200 dark:border-slate-700">
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
            <div className="bg-white dark:bg-slate-950 p-6 md:p-8 lg:p-12 rounded-3xl md:rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 max-w-4xl mx-auto">
              <h3 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-slate-50 mb-8 flex items-center">
                <Info className="w-6 h-6 md:w-8 md:h-8 mr-3 md:mr-4 text-primary" />
                About Us
              </h3>
              <div className="prose prose-base md:prose-lg prose-indigo text-slate-600 dark:text-slate-400 max-w-none">
                {community.about ? (
                  <p className="whitespace-pre-wrap leading-relaxed text-lg">{community.about}</p>
                ) : (
                  <div className="bg-slate-50 dark:bg-slate-900 p-12 rounded-3xl border border-slate-100 dark:border-slate-800 text-center text-slate-500 dark:text-slate-400 font-medium">
                    No description provided by the community administrators yet.
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'contact' && (
            <div className="bg-white dark:bg-slate-950 p-6 md:p-8 lg:p-12 rounded-3xl md:rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 max-w-4xl mx-auto">
              <h3 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-slate-50 mb-8 flex items-center">
                <Phone className="w-6 h-6 md:w-8 md:h-8 mr-3 md:mr-4 text-cyan-500" />
                Contact Information
              </h3>
              {community.contactInfo || community.whatsappNumber ? (
                <div className="bg-slate-50 dark:bg-slate-900 p-6 md:p-8 rounded-2xl md:rounded-3xl border border-slate-100 dark:border-slate-800 space-y-6">
                  {community.contactInfo && (
                    <p className="whitespace-pre-wrap text-slate-700 dark:text-slate-300 text-lg leading-relaxed">{community.contactInfo}</p>
                  )}
                  
                  {community.whatsappNumber && (
                    <div>
                      <a 
                        href={`https://wa.me/${community.whatsappNumber}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl transition-colors shadow-sm"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                        </svg>
                        Hubungi WhatsApp
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-slate-50 dark:bg-slate-900 p-12 rounded-3xl border border-slate-100 dark:border-slate-800 text-center text-slate-500 dark:text-slate-400 font-medium">
                  No contact information provided.
                </div>
              )}
            </div>
          )}

          {activeTab === 'dashboard' && (
            <div className="max-w-6xl mx-auto space-y-8">
              {/* Premium Dashboard Header Banner */}
              <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-indigo-900 rounded-[2.5rem] p-8 md:p-10 text-white relative overflow-hidden shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-6 text-left">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary rounded-full blur-3xl opacity-[0.08] -mr-16 -mt-16"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-500 rounded-full blur-3xl opacity-[0.05] -ml-16 -mb-16"></div>
                
                <div className="relative z-10 text-left">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white dark:bg-slate-950/10 backdrop-blur-md rounded-full text-xs font-bold text-indigo-200 border border-white/5 mb-4">
                    <Shield className="w-3.5 h-3.5 text-primary" />
                    <span>Member Dashboard Hub</span>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white">Selamat Datang, {currentUser?.name || 'Member'}! 👋</h2>
                  <p className="text-sm text-indigo-200/80 mt-1.5 font-medium max-w-lg">
                    Kelola paket membership aktif, sisa sesi latihan kelas, dan riwayat check-in kehadiran di sini.
                  </p>
                </div>
                
                {/* Segmented Tab Controls */}
                <div className="relative z-10 w-full sm:w-auto bg-white/95 dark:bg-slate-950/40 backdrop-blur-md p-1.5 rounded-2xl border border-white/20 grid grid-cols-3 sm:flex gap-1 shadow-md">
                  <button
                    type="button"
                    onClick={() => setDashboardSubTab('wallet')}
                    className={`px-2 sm:px-5 py-2.5 sm:py-3 rounded-xl text-[11px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1 sm:gap-2 whitespace-nowrap min-w-0 ${
                      dashboardSubTab === 'wallet'
                        ? 'bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-50 shadow-md'
                        : 'text-indigo-200 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                    <span className="truncate">My Hub</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDashboardSubTab('profile')}
                    className={`px-2 sm:px-5 py-2.5 sm:py-3 rounded-xl text-[11px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1 sm:gap-2 whitespace-nowrap min-w-0 ${
                      dashboardSubTab === 'profile'
                        ? 'bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-50 shadow-md'
                        : 'text-indigo-200 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                    <span className="truncate">Settings</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      removeToken();
                      setIsLoggedIn(false);
                      setStatus(null);
                      setActiveWallets([]);
                      setHistory([]);
                      handleTabChange('home');
                    }}
                    className="px-2 sm:px-4 py-2.5 sm:py-3 rounded-xl text-[11px] sm:text-xs font-bold text-rose-300 hover:text-rose-100 hover:bg-rose-500/20 transition-all flex items-center justify-center gap-1 sm:gap-1.5 whitespace-nowrap min-w-0"
                  >
                    <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                    <span className="truncate">Logout</span>
                  </button>
                </div>
              </div>

              {/* Dashboard Content Container */}
              <div className="w-full">
                {loadingDashboard ? (
                  <div className="flex items-center justify-center py-20 bg-white dark:bg-slate-950 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm">
                    <div className="animate-pulse flex flex-col items-center">
                      <div className="w-12 h-12 bg-indigo-200 rounded-full mb-4"></div>
                      <div className="text-slate-400 font-medium">Loading details...</div>
                    </div>
                  </div>
                ) : errorDashboard ? (
                  <div className="p-8 text-center text-red-500 bg-white dark:bg-slate-950 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm">
                    {errorDashboard}
                  </div>
                ) : !status ? (
                  <div className="text-center py-12 bg-white dark:bg-slate-950 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm">
                    <p className="text-slate-500 dark:text-slate-400 font-medium">You are not registered in this community.</p>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {dashboardSubTab === 'wallet' && (
                      (status.status === 'APPROVED' || status.role === 'COMMUNITY_ADMIN') ? (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                          {/* Left Column: Active Classes, Sessions & Membership details */}
                          <div className="lg:col-span-2 space-y-8">
                            {/* Active Session Wallet Card (Main Stage!) */}
                            {activeWallets.length > 0 ? (
                              <div className="space-y-6">
                                {activeWallets.map((wallet) => (
                                  <div key={wallet.packageId} className="bg-white dark:bg-slate-950 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 p-8 relative overflow-hidden text-left">
                                    <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-50 rounded-full blur-3xl opacity-40 -mr-10 -mt-10"></div>
                                    
                                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 relative z-10">
                                      <div className="space-y-1">
                                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 border rounded-full text-[10px] font-black uppercase tracking-wider ${
                                          wallet.status === 'ACTIVE' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-amber-50 border-amber-100 text-amber-700'
                                        }`}>
                                          <Activity className="w-3.5 h-3.5" />
                                          <span>{wallet.status === 'ACTIVE' ? 'Sesi Aktif' : 'Menunggu Approval'}</span>
                                        </div>
                                        <h3 className="text-2xl font-black text-slate-900 dark:text-slate-50 tracking-tight mt-2">{wallet.packageName}</h3>
                                        <p className="text-xs text-slate-400 font-semibold flex items-center gap-1">
                                          <Clock className="w-3.5 h-3.5 text-slate-350" />
                                          <span>Berlaku s/d: {wallet.expiredDate ? new Date(wallet.expiredDate).toLocaleDateString() : (wallet.status === 'ACTIVE' ? 'N/A' : (wallet.status === 'COMPLETED' ? 'Selesai' : 'Menunggu Aktif'))}</span>
                                        </p>
                                      </div>

                                      <div className="shrink-0 flex items-center gap-4">
                                        <div className="text-right">
                                          <div className="text-4xl font-black text-emerald-500 tracking-tighter">{wallet.remainingSession}</div>
                                          <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mt-0.5">Sisa dari {wallet.totalSession} Sesi</div>
                                        </div>
                                        <div className="w-px h-10 bg-slate-150"></div>
                                        <button
                                          onClick={() => handleCheckInOut(wallet.packageId)}
                                          disabled={checkingInOut || (wallet.status !== 'ACTIVE' && !(wallet.status === 'COMPLETED' && history.find(h => h.packageId === wallet.packageId)?.remarks === 'Check-in'))}
                                          className={`px-8 py-4 font-bold rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2.5 active:scale-[0.97] ${
                                            (wallet.status !== 'ACTIVE' && !(wallet.status === 'COMPLETED' && history.find(h => h.packageId === wallet.packageId)?.remarks === 'Check-in')) 
                                              ? 'bg-slate-300 text-slate-500 shadow-none cursor-not-allowed opacity-70'
                                              : history.find(h => h.packageId === wallet.packageId)?.remarks === 'Check-in'
                                                ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20'
                                                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                                          }`}
                                        >
                                          <Zap className="w-4 h-4 fill-current" />
                                          <span>{checkingInOut
                                            ? 'Processing...'
                                            : wallet.status === 'COMPLETED' && history.find(h => h.packageId === wallet.packageId)?.remarks !== 'Check-in'
                                              ? 'Selesai'
                                              : wallet.status !== 'ACTIVE' && wallet.status !== 'COMPLETED'
                                                ? 'Belum Aktif'
                                                : (history.find(h => h.packageId === wallet.packageId)?.remarks === 'Check-in')
                                                  ? 'Check Out Sesi'
                                                  : 'Check In Sesi'}</span>
                                        </button>
                                      </div>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="mt-8 h-3 w-full bg-slate-100 rounded-full overflow-hidden relative z-10">
                                      <div 
                                        className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full transition-all duration-500" 
                                        style={{ width: `${(wallet.remainingSession / wallet.totalSession) * 100}%` }}
                                      ></div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="bg-white dark:bg-slate-950 rounded-[2.5rem] shadow-sm border border-slate-150 p-8 text-center space-y-4 text-left flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                                <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 bg-slate-50 dark:bg-slate-900 text-slate-400 rounded-2xl flex items-center justify-center shrink-0 border border-slate-100 dark:border-slate-800">
                                    <Activity className="w-6 h-6" />
                                  </div>
                                  <div>
                                    <h4 className="text-md font-bold text-slate-850">Belum Ada Paket Sesi Aktif</h4>
                                    <p className="text-xs text-slate-450 leading-relaxed mt-0.5">Anda tidak memiliki paket sesi kelas yang dapat digunakan.</p>
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleTabChange('sessions')}
                                  className="inline-flex justify-center items-center py-3.5 px-5 bg-primary hover:opacity-90 text-white font-bold rounded-2xl text-xs transition-colors shadow-md shadow-indigo-600/15 active:scale-[0.98] shrink-0"
                                >
                                  <span>Beli Paket Sesi</span>
                                  <Plus className="w-3.5 h-3.5 ml-1.5" />
                                </button>
                              </div>
                            )}

                            {/* Membership Details Card */}
                            <div className="bg-white dark:bg-slate-950 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 p-6 text-left">
                              <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 flex items-center tracking-tight mb-4">
                                <Shield className="w-4 h-4 mr-2 text-primary" />
                                Detail Membership
                              </h3>
                              <div className="space-y-4">
                                <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                    <div>
                                      <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Paket Membership</h4>
                                      {userMemberships.length > 0 ? (
                                        (() => {
                                          const activeMem = userMemberships.find((m) => m.status === 'ACTIVE' && new Date(m.endDate) >= new Date());
                                          const displayMem = activeMem || userMemberships.find((m) => m.status === 'ACTIVE') || userMemberships[0];
                                          const isExpired = displayMem.status === 'ACTIVE' && new Date(displayMem.endDate) < new Date();
                                          const isActive = displayMem.status === 'ACTIVE' && !isExpired;

                                          return (
                                            <div className="mt-1.5">
                                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                <div className="text-sm font-bold text-slate-800 dark:text-slate-200">{displayMem.membership?.name}</div>
                                                <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-md ${
                                                  isActive ? 'bg-emerald-100 text-emerald-700' : isExpired ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                                                }`}>
                                                  {isActive ? 'Aktif' : isExpired ? 'Kedaluwarsa' : 'Menunggu Approval'}
                                                </span>
                                              </div>
                                              <div className="text-xs text-slate-400 font-semibold mt-0.5">
                                                Masa Berlaku s/d: <span className="text-slate-700 dark:text-slate-300 font-bold">{new Date(displayMem.endDate).toLocaleDateString()}</span>
                                              </div>
                                              {isExpired && (
                                                <p className="text-[11px] text-rose-500 font-bold mt-1">⚠️ Membership Anda telah berakhir. Klik &quot;Perpanjang&quot; untuk memperbarui.</p>
                                              )}
                                            </div>
                                          );
                                        })()
                                      ) : community.registrationMode === 'FREE' ? (
                                        <div className="mt-1.5">
                                          <div className="flex items-center gap-2 mb-1">
                                            <div className="text-sm font-bold text-slate-800 dark:text-slate-200">Gratis</div>
                                            <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-md bg-emerald-100 text-emerald-700">
                                              Akun Basic
                                            </span>
                                          </div>
                                        </div>
                                      ) : (
                                        <p className="text-xs text-rose-500 font-bold mt-1">⚠️ Belum ada paket membership aktif.</p>
                                      )}
                                    </div>
                                    
                                    {(community.memberships && community.memberships.length > 0) && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (userMemberships.length > 0) {
                                          const activeMem = userMemberships.find((m) => m.status === 'ACTIVE' && new Date(m.endDate) >= new Date());
                                          const displayMem = activeMem || userMemberships.find((m) => m.status === 'ACTIVE') || userMemberships[0];
                                          const end = new Date(displayMem.endDate);
                                          const now = new Date();
                                          const isExpired = end < now;
                                          const diffTime = end.getTime() - now.getTime();
                                          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                          if (!isExpired && diffDays > 7 && displayMem.status === 'ACTIVE') {
                                            alert(`Anda baru bisa memperpanjang membership 7 hari sebelum masa berlaku habis. (Sisa: ${diffDays} hari)`);
                                            return;
                                          }
                                        }
                                        setSelectedRenewalTierId(community.memberships?.[0]?.id || '');
                                        setRenewalProofUrl('');
                                        setShowRenewalModal(true);
                                      }}
                                      className="py-3 px-5 bg-primary hover:opacity-90 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/10 flex items-center justify-center gap-1.5 active:scale-[0.98] shrink-0"
                                    >
                                      <span>{userMemberships.length > 0 ? 'Perpanjang' : 'Beli Membership'}</span>
                                      <Plus className="w-3.5 h-3.5" />
                                    </button>
                                    )}
                                  </div>
                              </div>
                            </div>
                          </div>

                          {/* Right Column: NFC Card Pass & Activity Timeline */}
                          <div className="lg:col-span-1 space-y-8">
                            {/* Digital Membership Pass Card (Vertical card!) */}
                            <div>
                              <div id="member-card" className="bg-white dark:bg-slate-950 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800/80 p-1.5 overflow-hidden">
                                <div className="relative rounded-[2rem] shadow-xl p-6 text-white overflow-hidden group border border-slate-800 text-left bg-slate-900 min-h-[200px] flex flex-col justify-between">
                                  {community.logo ? (
                                    <div 
                                      id="member-card-bg"
                                      className="absolute inset-0 opacity-40 group-hover:scale-105 group-hover:opacity-50 transition-all duration-700 pointer-events-none bg-center bg-cover"
                                      style={{ backgroundImage: `url(${community.logo})` }}
                                    ></div>
                                  ) : (
                                    <div className="absolute inset-0 bg-gradient-to-tr from-slate-900 via-indigo-950 to-indigo-900 pointer-events-none"></div>
                                  )}
                                  
                                  {/* Gradient overlay to ensure text is always readable over any logo */}
                                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/80 to-slate-900/30 pointer-events-none"></div>

                                  <div className="absolute top-0 right-0 -mr-6 -mt-6 w-32 h-32 rounded-full bg-white opacity-[0.03] group-hover:scale-125 transition-transform duration-700 pointer-events-none"></div>
                                  <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-primary opacity-[0.15] blur-2xl group-hover:scale-110 transition-transform duration-700 pointer-events-none"></div>
                                
                                <div className="relative z-10 flex justify-between items-start">
                                  <div>
                                    <p className="text-[9px] font-black tracking-widest text-indigo-200 uppercase">{community.name}</p>
                                    <CreditCard className="w-6 h-6 mt-3 opacity-60 text-indigo-300" />
                                  </div>
                                  <div className="w-9 h-9 bg-white dark:bg-slate-950/10 backdrop-blur-md rounded-xl border border-white/10 flex items-center justify-center font-black text-sm text-indigo-200 shadow-inner">
                                    {status?.user?.name ? status.user.name.substring(0, 2).toUpperCase() : 'MB'}
                                  </div>
                                </div>
                                
                                <div className="relative z-10 mt-10 flex flex-col">
                                  <p className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider mb-0.5">Member ID</p>
                                  <p className="font-mono text-lg tracking-widest font-black text-white">{status.membershipNumber || 'PENDING'}</p>
                                  {status?.user?.name && <p className="text-xs font-bold text-indigo-100 mt-1 truncate">{status.user.name}</p>}
                                </div>
                                
                                <div className="relative z-10 mt-6 flex justify-between items-end border-t border-white/10 pt-4">
                                  <div>
                                    <p className="text-[9px] text-indigo-300 font-bold uppercase tracking-wider">Joined Date</p>
                                    <p className="text-xs font-extrabold text-white mt-0.5">{new Date(status.createdAt).toLocaleDateString()}</p>
                                  </div>
                                  <div className="bg-primary/20 border border-indigo-400/20 px-3 py-1 rounded-xl text-[9px] font-extrabold tracking-wider uppercase text-indigo-200 backdrop-blur-md">
                                    {status.role}
                                  </div>
                                </div>
                                </div>
                              </div>
                              <button 
                                onClick={downloadCard}
                                className="mt-4 w-full py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                                Download Kartu
                              </button>
                            </div>

                            {/* Riwayat Aktivitas & Sesi */}
                            <div className="bg-white dark:bg-slate-950 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800/80 p-6">
                              <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 mb-4 tracking-tight text-left">Riwayat Aktivitas</h3>
                              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                                {history.map((item, idx) => (
                                  <div key={idx} className="flex justify-between items-center py-2.5 border-b border-slate-50 last:border-0">
                                    <div className="flex items-center">
                                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-2.5 font-black text-[9px]
                                        ${item.type === 'PURCHASE' ? 'bg-primary/5 text-primary border border-primary/20' :
                                          item.type === 'FREEZE' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                                          'bg-rose-50 text-rose-600 border border-rose-100'}`}>
                                        {item.type === 'PURCHASE' ? 'IN' : 'OUT'}
                                      </div>
                                      <div className="text-left min-w-0 pr-2">
                                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-snug truncate" title={item.remarks}>{item.remarks}</p>
                                        <p className="text-[9px] text-slate-400 font-semibold mt-0.5">{new Date(item.date).toLocaleDateString()}</p>
                                      </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                      <span className={`text-xs font-black tracking-tight
                                        ${item.type === 'PURCHASE' ? 'text-primary' :
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
                        <div className="max-w-2xl mx-auto bg-white dark:bg-slate-950 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 p-8 md:p-10 space-y-8 text-left relative overflow-hidden">
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
                              <h3 className="text-xl font-black text-slate-900 dark:text-slate-50 tracking-tight">
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
                                <div className="h-1.5 w-full bg-primary rounded-full"></div>
                                <span className="text-[10px] font-black text-primary block">1. Daftar Akun</span>
                              </div>
                              <div className="space-y-2 text-left">
                                <div className={`h-1.5 w-full rounded-full ${status.paymentProofUrl ? 'bg-primary' : 'bg-slate-200'}`}></div>
                                <span className={`text-[10px] font-black block ${status.paymentProofUrl ? 'text-primary' : 'text-slate-450'}`}>2. Upload Bukti</span>
                              </div>
                              <div className="space-y-2 text-left">
                                <div className="h-1.5 w-full bg-slate-100 rounded-full"></div>
                                <span className="text-[10px] font-black text-slate-400 block">3. Verifikasi Admin</span>
                              </div>
                            </div>
                          )}

                          {status.status === 'REJECTED' ? (
                            <div className="p-5 bg-rose-50/50 border border-rose-150 rounded-3xl space-y-2">
                              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                                Pengelola komunitas menolak pendaftaran atau bukti pembayaran Anda. Silakan hubungi admin di tab **Kontak** untuk rincian penolakan atau unggah ulang bukti yang benar di bawah.
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-6">
                              <p className="text-xs text-slate-550 leading-relaxed font-medium">
                                Pengelola komunitas sedang meninjau pendaftaran Anda. Jika Anda memilih paket berbayar, silakan selesaikan transfer pembayaran ke rekening di bawah ini dan unggah resinya.
                              </p>

                              {community.registrationMode === 'PAID' && (
                                <div className="space-y-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                                  <div className="space-y-3">
                                    <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">Langkah Pembayaran & Transfer</h4>
                                    <div className="p-5 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-150/70 space-y-3 text-xs text-slate-650 font-medium">
                                      {community.qrisImageUrl && (
                                        <div className="mb-4">
                                          <p className="font-bold text-slate-800 dark:text-slate-200 mb-2">Scan QRIS:</p>
                                          <div className="bg-white dark:bg-slate-950 p-2 rounded-xl border border-slate-200 dark:border-slate-800 inline-block">
                                            <img src={community.qrisImageUrl} alt="QRIS" className="max-h-40 object-contain rounded-lg" />
                                          </div>
                                        </div>
                                      )}
                                      <p className="font-bold text-slate-800 dark:text-slate-200">
                                        {community.paymentInstructions ? 'Instruksi Pembayaran:' : 'Silakan lakukan transfer ke salah satu rekening pengelola:'}
                                      </p>
                                      {community.paymentInstructions ? (
                                        <div className="whitespace-pre-wrap text-slate-700 dark:text-slate-300">
                                          {community.paymentInstructions}
                                        </div>
                                      ) : (
                                        <div className="space-y-2 bg-white dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                                          <div className="flex justify-between items-center">
                                            <span className="text-slate-550">Bank BCA:</span>
                                            <span className="font-extrabold text-slate-800 dark:text-slate-200 font-mono bg-slate-50 dark:bg-slate-900 px-2.5 py-1 rounded border border-slate-150">8002931293</span>
                                          </div>
                                          <div className="flex justify-between items-center">
                                            <span className="text-slate-550">Bank Mandiri:</span>
                                            <span className="font-extrabold text-slate-800 dark:text-slate-200 font-mono bg-slate-50 dark:bg-slate-900 px-2.5 py-1 rounded border border-slate-150">120001828828</span>
                                          </div>
                                        </div>
                                      )}
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
                                          className="flex-1 text-center text-xs font-bold text-primary bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 py-3.5 rounded-2xl transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-900 shadow-sm"
                                        >
                                          Lihat Bukti yang Dikirim
                                        </a>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setStatus({ ...status, paymentProofUrl: undefined });
                                          }}
                                          className="flex-1 text-center text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 py-3.5 rounded-2xl transition-colors border border-slate-200 dark:border-slate-700"
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
                                      <div className="p-6 bg-slate-50 dark:bg-slate-900 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center text-center hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors relative">
                                        <input
                                          type="file"
                                          accept="image/*"
                                          onChange={async (e) => {
                                            if (e.target.files && e.target.files[0]) {
                                              const file = e.target.files[0];
                                              try {
                                                const options = { maxSizeMB: 1, maxWidthOrHeight: 1920, useWebWorker: true };
                                                const compressedFile = await imageCompression(file, options);
                                                const formData = new FormData();
                                                formData.append('file', compressedFile);
                                                const headers = getAuthHeaders();
                                                const uploadRes = await fetch(getApiUrl() + '/upload', {
                                                  method: 'POST',
                                                  headers: {
                                                    'Authorization': headers.Authorization || ''
                                                  },
                                                  body: formData
                                                });
                                                if (!uploadRes.ok) throw new Error('Gagal mengunggah bukti pembayaran');
                                                const uploadData = await uploadRes.json();
                                                const fileUrl = uploadData.url;

                                                const confirmRes = await fetch(`${getApiUrl()}/memberships/confirm-payment/${status.id}`, {
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
                                        <div className="w-10 h-10 bg-primary/5 text-primary rounded-xl flex items-center justify-center mb-3">
                                          <Plus className="w-5 h-5" />
                                        </div>
                                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Pilih berkas bukti bayar Anda</p>
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
                      <div className="bg-white dark:bg-slate-950 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800 p-6 md:p-8">
                        <h3 className="text-xl font-extrabold text-slate-900 dark:text-slate-50 mb-6">Account Settings</h3>
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
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-950 rounded-[2rem] shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200 overflow-hidden relative">
            
            {/* Modal Header with Background Image */}
            <div className="relative shrink-0 flex flex-col justify-end p-6 md:p-8 pt-10 md:pt-12 min-h-[160px] md:min-h-[200px]">
              {selectedPackage.image ? (
                <div className="absolute inset-0">
                  <img src={selectedPackage.image} alt={selectedPackage.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 to-transparent dark:from-slate-950 dark:via-slate-950/80"></div>
                </div>
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-slate-900 dark:to-slate-800"></div>
              )}
              
              <button 
                onClick={() => setSelectedPackage(null)} 
                className="absolute top-4 right-4 p-2 bg-white dark:bg-slate-950/70 hover:bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-50 rounded-full backdrop-blur-md transition-colors shadow-sm z-10"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="relative z-10">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <div className="inline-block bg-primary/20/80 backdrop-blur-md text-primary text-xs font-black px-3 py-1.5 rounded-xl uppercase tracking-wider border border-primary/30/50">
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
                <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-slate-50 mb-1 leading-tight">{selectedPackage.name}</h2>
                {selectedPackage.memberPrice && selectedPackage.vipPrice ? (
                  <>
                    <div className="text-2xl md:text-3xl font-black text-slate-900 dark:text-slate-50 flex items-end gap-2">
                      Rp {(isPrivateSession ? selectedPackage.vipPrice : selectedPackage.memberPrice).toLocaleString('id-ID')}
                    </div>
                    <div className="text-sm font-bold text-amber-600 mt-1">
                      Private: Rp {selectedPackage.vipPrice.toLocaleString('id-ID')}
                    </div>
                  </>
                ) : selectedPackage.vipPrice && !selectedPackage.memberPrice ? (
                  <div className="text-2xl md:text-3xl font-black text-amber-500 flex items-end gap-2">
                    Private: Rp {selectedPackage.vipPrice.toLocaleString('id-ID')}
                  </div>
                ) : selectedPackage.memberPrice && !selectedPackage.vipPrice ? (
                  <div className="text-2xl md:text-3xl font-black text-slate-900 dark:text-slate-50 flex items-end gap-2">
                    Rp {selectedPackage.memberPrice.toLocaleString('id-ID')}
                  </div>
                ) : (
                  <div className="text-2xl md:text-3xl font-black text-slate-900 dark:text-slate-50 flex items-end gap-2">
                    Gratis
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0 custom-scrollbar flex flex-col py-2">
              {!!selectedPackage.memberPrice && !!selectedPackage.vipPrice && (
                <div className="px-6 md:px-8 pt-4 pb-2 shrink-0">
                  <label className="flex items-center gap-3 p-3 border border-amber-200 bg-amber-50 dark:bg-amber-900/20 rounded-xl cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isPrivateSession}
                      onChange={(e) => setIsPrivateSession(e.target.checked)}
                      className="w-5 h-5 text-amber-600 border-amber-300 rounded focus:ring-amber-500"
                    />
                    <div>
                      <div className="font-bold text-amber-800 dark:text-amber-400 text-sm">Gunakan Harga Private</div>
                      <div className="text-xs text-amber-700 dark:text-amber-500/80">Saya ingin mengambil sesi secara private</div>
                    </div>
                  </label>
                </div>
              )}

              <div className="px-6 md:px-8 pt-4 shrink-0">
                <div className="grid grid-cols-2 gap-3 md:gap-4 mb-4">
                  <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-3 md:p-4 flex flex-col justify-center items-center text-center border border-slate-100 dark:border-slate-800">
                    <CheckCircle className="w-5 h-5 md:w-6 md:h-6 text-emerald-500 mb-1.5 md:mb-2" />
                    <span className="text-lg md:text-xl font-bold text-slate-900 dark:text-slate-50">{selectedPackage.totalSession}</span>
                    <span className="text-[10px] md:text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Sesi</span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-3 md:p-4 flex flex-col justify-center items-center text-center border border-slate-100 dark:border-slate-800">
                    <Clock className="w-5 h-5 md:w-6 md:h-6 text-amber-500 mb-1.5 md:mb-2" />
                    <span className="text-lg md:text-xl font-bold text-slate-900 dark:text-slate-50">{selectedPackage.validDays}</span>
                    <span className="text-[10px] md:text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Hari Aktif</span>
                  </div>
                </div>
              </div>

              <div className="px-6 md:px-8 mb-4 mt-2 shrink-0">
                <h3 className="text-xs md:text-sm font-bold text-slate-900 dark:text-slate-50 uppercase tracking-wider mb-2 md:mb-3">Deskripsi Paket</h3>
                <div className="text-slate-600 dark:text-slate-400 text-xs md:text-sm">
                  {selectedPackage.description ? (
                    <p className="whitespace-pre-wrap leading-relaxed break-words">{selectedPackage.description}</p>
                  ) : (
                    <p className="italic text-slate-400">Tidak ada detail tambahan untuk paket ini.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 md:p-8 pt-4 md:pt-4 mt-auto shrink-0 border-t border-slate-50 dark:border-slate-800 bg-white dark:bg-slate-950 z-10">
              <button 
                onClick={() => {
                  handlePurchase(selectedPackage.id);
                  setSelectedPackage(null);
                }}
                disabled={purchasingMap[selectedPackage.id]}
                className="w-full py-3 md:py-4 bg-primary text-white font-bold rounded-2xl hover:opacity-90 transition-colors shadow-lg shadow-primary/30 text-sm md:text-base mt-2 md:mt-4 disabled:opacity-50"
              >
                {purchasingMap[selectedPackage.id] ? 'Processing...' : 'Beli Paket Ini'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Membership Renewal Request Modal */}
      {showRenewalModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-950 rounded-[2rem] shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-700 flex flex-col max-h-[90vh]">
            <div className="px-6 py-5 shrink-0 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">Perpanjang Membership</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Pilih paket membership dan unggah bukti transfer.</p>
              </div>
              <button 
                type="button"
                onClick={() => setShowRenewalModal(false)}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 hover:text-slate-700 dark:text-slate-300 transition-colors"
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
                  const res = await fetch(getApiUrl() + '/user-membership', {
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
                  if (!res.ok) {
                    const errorData = await res.json().catch(() => null);
                    throw new Error(errorData?.message || 'Gagal mengirim permintaan perpanjangan');
                  }
                  
                  alert('Permintaan perpanjangan membership berhasil dikirim! Menunggu persetujuan admin.');
                  setShowRenewalModal(false);
                  fetchDashboardData();
                } catch (err) {
                  alert(err instanceof Error ? err.message : 'Terjadi kesalahan');
                } finally {
                  setSubmittingRenewal(false);
                }
              }} 
              className="flex flex-col flex-1 min-h-0"
            >
              <div className="p-6 space-y-4 overflow-y-auto flex-1 min-h-0 custom-scrollbar">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">Pilih Paket Membership</label>
                  <div className="space-y-2">
                    {(community.memberships || []).map((m: Membership) => (
                      <label 
                        key={m.id}
                        className={`flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-900 border rounded-xl cursor-pointer transition-all hover:border-primary/70 ${
                          selectedRenewalTierId === m.id ? 'border-primary ring-2 ring-primary/10' : 'border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <input 
                            type="radio"
                            name="renewalTier"
                            checked={selectedRenewalTierId === m.id}
                            onChange={() => setSelectedRenewalTierId(m.id)}
                            className="w-4 h-4 text-primary focus:ring-primary border-slate-300 dark:border-slate-600"
                          />
                          <div className="text-left">
                            <div className="font-bold text-slate-800 dark:text-slate-200 text-xs">{m.name}</div>
                            <div className="text-[10px] text-slate-400 font-semibold mt-0.5">Durasi: {m.durationDays} hari</div>
                          </div>
                        </div>
                        <div className="font-black text-primary text-xs">
                          Rp {m.price?.toLocaleString('id-ID') || 0}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {selectedRenewalTierId && (
                  <div className="space-y-3">
                    {/* Voucher Input Field */}
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-indigo-600" />
                        Punya Kode Promo / Voucher?
                      </label>
                      {appliedVoucher ? (
                        <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <div>
                              <div className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                                Kode: <span className="font-mono">{appliedVoucher.code}</span>
                              </div>
                              <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                                Hemat Rp {appliedVoucher.discountAmount.toLocaleString('id-ID')}
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setAppliedVoucher(null);
                              setVoucherCodeInput('');
                            }}
                            className="text-[11px] font-bold text-red-500 hover:underline px-2 py-1"
                          >
                            Hapus
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={voucherCodeInput}
                            onChange={(e) => {
                              setVoucherCodeInput(e.target.value.toUpperCase());
                              setVoucherError('');
                            }}
                            placeholder="Contoh: LATIHNEWBER"
                            className="flex-1 px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono uppercase font-bold text-indigo-600 outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                          <button
                            type="button"
                            disabled={validatingVoucher || !voucherCodeInput.trim()}
                            onClick={async () => {
                              const selectedMembership = (community.memberships || []).find((m: Membership) => m.id === selectedRenewalTierId);
                              const subtotal = selectedMembership?.price || 0;
                              setValidatingVoucher(true);
                              setVoucherError('');
                              try {
                                const res = await fetch(`${getApiUrl()}/promo-vouchers/validate`, {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    communityId: community.id,
                                    code: voucherCodeInput.trim(),
                                    purchaseAmount: subtotal,
                                  }),
                                });
                                const data = await res.json();
                                if (!res.ok) throw new Error(data.message || 'Voucher tidak valid');
                                setAppliedVoucher({
                                  code: data.code,
                                  voucherId: data.voucherId,
                                  discountAmount: data.discountAmount,
                                  message: data.message,
                                });
                              } catch (err) {
                                setAppliedVoucher(null);
                                setVoucherError(err instanceof Error ? err.message : 'Voucher tidak valid');
                              } finally {
                                setValidatingVoucher(false);
                              }
                            }}
                            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1 shrink-0"
                          >
                            {validatingVoucher ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Pasang'}
                          </button>
                        </div>
                      )}
                      {voucherError && (
                        <p className="text-[11px] text-rose-500 font-semibold mt-1.5">{voucherError}</p>
                      )}
                    </div>

                    {/* Total Price Calculation Summary */}
                    {(() => {
                      const selectedMembership = (community.memberships || []).find((m: Membership) => m.id === selectedRenewalTierId);
                      const original = selectedMembership?.price || 0;
                      const discount = appliedVoucher ? appliedVoucher.discountAmount : 0;
                      const finalTotal = Math.max(0, original - discount);

                      return (
                        <div className="p-3.5 bg-slate-900 text-white rounded-2xl flex items-center justify-between">
                          <div>
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Pembayaran</span>
                            {discount > 0 && (
                              <span className="text-[11px] text-slate-400 line-through mr-2">
                                Rp {original.toLocaleString('id-ID')}
                              </span>
                            )}
                            <span className="text-sm font-black text-emerald-400">
                              Rp {finalTotal.toLocaleString('id-ID')}
                            </span>
                          </div>
                          {discount > 0 && (
                            <span className="text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-1 rounded-lg">
                              Hemat Rp {discount.toLocaleString('id-ID')}
                            </span>
                          )}
                        </div>
                      );
                    })()}

                    <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl text-xs space-y-3 text-slate-600 dark:text-slate-400 font-medium">
                    {community.qrisImageUrl && (
                      <div className="mb-2">
                        <p className="font-bold text-slate-800 dark:text-slate-200 mb-2">Scan QRIS:</p>
                        <div className="bg-white dark:bg-slate-950 p-2 rounded-xl border border-slate-200 dark:border-slate-800 inline-block">
                          <img src={community.qrisImageUrl} alt="QRIS" className="max-h-40 object-contain rounded-lg" />
                        </div>
                      </div>
                    )}
                    <p className="font-bold text-slate-800 dark:text-slate-200">
                      {community.paymentInstructions ? 'Instruksi Pembayaran:' : 'Silakan lakukan transfer ke salah satu rekening:'}
                    </p>
                    {community.paymentInstructions ? (
                      <div className="whitespace-pre-wrap text-slate-700 dark:text-slate-300">
                        {community.paymentInstructions}
                      </div>
                    ) : (
                      <div className="space-y-1 text-slate-500 dark:text-slate-400">
                        <div>• Bank BCA: <span className="font-extrabold text-slate-700 dark:text-slate-300">8002931293</span> a/n Kas Komunitas</div>
                        <div>• Bank Mandiri: <span className="font-extrabold text-slate-700 dark:text-slate-300">120001828828</span> a/n Kas Komunitas</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Unggah Bukti Transfer (Image)</label>
                  {renewalProofUrl ? (
                    <div className="space-y-2">
                      <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm bg-white dark:bg-slate-950 p-2">
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
                          try {
                            const file = e.target.files[0];
                            const options = { maxSizeMB: 1, maxWidthOrHeight: 1920, useWebWorker: true };
                            const compressedFile = await imageCompression(file, options);
                            const formData = new FormData();
                            formData.append('file', compressedFile);
                            const headers = getAuthHeaders();
                            const uploadRes = await fetch(getApiUrl() + '/upload', {
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
                      className="w-full text-xs font-semibold text-slate-500 dark:text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-[11px] file:font-extrabold file:bg-primary/5 file:text-primary hover:file:bg-primary/20"
                    />
                  )}
                </div>
              </div>

              <div className="p-6 pt-4 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowRenewalModal(false)}
                  className="px-4 py-2 font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-xs transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingRenewal}
                  className="px-5 py-2 bg-primary hover:opacity-90 text-white font-bold rounded-xl text-xs shadow-lg shadow-primary/20 transition-all disabled:opacity-50"
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
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-950 rounded-[2rem] shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-700 flex flex-col max-h-[90vh]">
            <div className="px-6 py-5 shrink-0 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">Pembayaran Bundling Keanggotaan & Paket</h3>
                <p className="text-xs text-rose-500 font-semibold mt-1">Keanggotaan Anda hampir berakhir/sudah habis. Wajib perpanjang untuk membeli paket sesi.</p>
              </div>
              <button 
                type="button"
                onClick={() => {
                  setShowBundleModal(false);
                  setBundlePackage(null);
                }}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 hover:text-slate-700 dark:text-slate-300 transition-colors"
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
                  const res = await fetch(getApiUrl() + '/session-wallet/purchase-bundle', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': headers.Authorization || ''
                    },
                    body: JSON.stringify({
                      userId: status?.userId,
                      communityId: status?.communityId,
                      packageId: bundlePackage.id,
                      isPrivate: isPrivateSession,
                      membershipId: selectedBundleTierId,
                      paymentProofUrl: bundleProofUrl,
                      promoVoucherId: appliedVoucher?.voucherId
                    })
                  });
                  if (!res.ok) {
                    const errorData = await res.json().catch(() => null);
                    throw new Error(errorData?.message || 'Gagal mengirim pembelian bundling');
                  }
                  
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
              className="flex flex-col flex-1 min-h-0"
            >
              <div className="p-6 space-y-4 overflow-y-auto flex-1 min-h-0 custom-scrollbar">
                {/* Detail Paket Sesi */}
                <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-150 flex justify-between items-center text-xs">
                  <div>
                    <div className="font-bold text-slate-800 dark:text-slate-200">Paket Sesi Pilihan:</div>
                    <div className="text-slate-600 dark:text-slate-400 font-semibold mt-0.5">{bundlePackage.name} ({bundlePackage.totalSession} Sesi)</div>
                  </div>
                  <div className="font-black text-slate-900 dark:text-slate-50">
                    Rp {(isPrivateSession && bundlePackage.vipPrice ? bundlePackage.vipPrice : bundlePackage.memberPrice)?.toLocaleString('id-ID') || 0}
                  </div>
                </div>

                {!!bundlePackage.memberPrice && !!bundlePackage.vipPrice && (
                  <div className="mt-2">
                    <label className="flex items-center gap-3 p-3 border border-amber-200 bg-amber-50 dark:bg-amber-900/20 rounded-xl cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isPrivateSession}
                        onChange={(e) => setIsPrivateSession(e.target.checked)}
                        className="w-5 h-5 text-amber-600 border-amber-300 rounded focus:ring-amber-500"
                      />
                      <div>
                        <div className="font-bold text-amber-800 dark:text-amber-400 text-sm">Gunakan Harga Private</div>
                        <div className="text-xs text-amber-700 dark:text-amber-500/80">Saya ingin mengambil sesi secara private</div>
                      </div>
                    </label>
                  </div>
                )}

                {/* Tipe Membership */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">Pilih Paket Perpanjangan Membership</label>
                  <div className="space-y-2">
                    {(community.memberships || []).map((m: Membership) => (
                      <label 
                        key={m.id}
                        className={`flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-900 border rounded-xl cursor-pointer transition-all hover:border-primary/70 ${
                          selectedBundleTierId === m.id ? 'border-primary ring-2 ring-primary/10' : 'border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <input 
                            type="radio"
                            name="bundleTier"
                            checked={selectedBundleTierId === m.id}
                            onChange={() => setSelectedBundleTierId(m.id)}
                            className="w-4 h-4 text-primary focus:ring-primary border-slate-300 dark:border-slate-600"
                          />
                          <div className="text-left">
                            <div className="font-bold text-slate-800 dark:text-slate-200 text-xs">{m.name}</div>
                            <div className="text-[10px] text-slate-400 font-semibold mt-0.5">Durasi: {m.durationDays} hari</div>
                          </div>
                        </div>
                        <div className="font-black text-primary text-xs">
                          Rp {m.price?.toLocaleString('id-ID') || 0}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Voucher Input Field for Bundle */}
                <div className="p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl mt-4">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-indigo-600" />
                    Punya Kode Promo / Voucher?
                  </label>
                  {appliedVoucher ? (
                    <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <div>
                          <div className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                            Kode: <span className="font-mono">{appliedVoucher.code}</span>
                          </div>
                          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                            Hemat Rp {appliedVoucher.discountAmount.toLocaleString('id-ID')}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setAppliedVoucher(null);
                          setVoucherCodeInput('');
                        }}
                        className="text-[11px] font-bold text-red-500 hover:underline px-2 py-1"
                      >
                        Hapus
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={voucherCodeInput}
                          onChange={(e) => {
                            setVoucherCodeInput(e.target.value.toUpperCase());
                            setVoucherError('');
                          }}
                          placeholder="Contoh: PROMO123"
                          className="flex-1 px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono uppercase font-bold text-indigo-600 outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <button
                          type="button"
                          disabled={validatingVoucher || !voucherCodeInput.trim()}
                          onClick={async () => {
                            const packagePrice = (isPrivateSession && bundlePackage.vipPrice) ? (bundlePackage.vipPrice || 0) : (bundlePackage.memberPrice || 0);
                            const membershipPrice = (community.memberships || []).find((m: Membership) => m.id === selectedBundleTierId)?.price || 0;
                            const subtotal = packagePrice + membershipPrice;
                            
                            setValidatingVoucher(true);
                            setVoucherError('');
                            try {
                              const res = await fetch(`${getApiUrl()}/promo-vouchers/validate`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  communityId: community.id,
                                  code: voucherCodeInput.trim(),
                                  purchaseAmount: subtotal,
                                }),
                              });
                              const data = await res.json();
                              if (!res.ok) throw new Error(data.message || 'Voucher tidak valid');
                              setAppliedVoucher({
                                code: data.code,
                                voucherId: data.voucherId,
                                discountAmount: data.discountAmount,
                                message: data.message,
                              });
                            } catch (err) {
                              setAppliedVoucher(null);
                              setVoucherError(err instanceof Error ? err.message : 'Voucher tidak valid');
                            } finally {
                              setValidatingVoucher(false);
                            }
                          }}
                          className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1 shrink-0"
                        >
                          {validatingVoucher ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Pasang'}
                        </button>
                      </div>
                      {voucherError && <p className="text-[10px] font-bold text-red-500 ml-1 flex items-center gap-1"><X className="w-3 h-3" /> {voucherError}</p>}
                    </div>
                  )}
                </div>

                {/* Rincian Total Pembayaran */}
                {selectedBundleTierId && (
                  <div className="p-4 bg-primary/5 border border-indigo-150 rounded-2xl space-y-2 text-xs mt-4">
                    <div className="flex justify-between items-center text-slate-600 dark:text-slate-400 font-bold">
                      <span>Harga Paket Sesi:</span>
                      <span>Rp {(isPrivateSession && bundlePackage.vipPrice ? bundlePackage.vipPrice : bundlePackage.memberPrice)?.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-600 dark:text-slate-400 font-bold">
                      <span>Harga Membership:</span>
                      <span>
                        Rp {(community.memberships || []).find((m: Membership) => m.id === selectedBundleTierId)?.price?.toLocaleString('id-ID')}
                      </span>
                    </div>
                    
                    {appliedVoucher && (
                      <div className="flex justify-between items-center text-emerald-600 font-semibold pt-2 pb-2 border-t border-b border-indigo-150">
                        <span>Diskon (Voucher):</span>
                        <span>- Rp {appliedVoucher.discountAmount.toLocaleString('id-ID')}</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center text-primary font-extrabold pt-2">
                      <span>Total Transfer:</span>
                      <span className="text-sm">
                        Rp {Math.max(0, (
                          ((isPrivateSession && bundlePackage.vipPrice) ? (bundlePackage.vipPrice || 0) : (bundlePackage.memberPrice || 0)) + 
                          ((community.memberships || []).find((m: Membership) => m.id === selectedBundleTierId)?.price || 0)
                        ) - (appliedVoucher?.discountAmount || 0)).toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                )}

                {/* Waitlist Notice */}
                {(() => {
                  const isWaitlist = bundlePackage && (isPrivateSession 
                    ? bundlePackage.privateQuota !== null && bundlePackage.privateQuota !== undefined && (bundlePackage.currentPrivateParticipants || 0) >= bundlePackage.privateQuota 
                    : bundlePackage.quota !== null && bundlePackage.quota !== undefined && (bundlePackage.currentParticipants || 0) >= bundlePackage.quota);

                  if (isWaitlist) {
                    return (
                      <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs space-y-2 mb-2 mt-2">
                        <div className="font-bold text-amber-800">Kuota Penuh - Masuk Waiting List</div>
                        <div className="text-amber-700">Kuota untuk paket ini sudah penuh. Anda akan otomatis didaftarkan ke dalam Waiting List. Silakan selesaikan pembayaran untuk mengamankan posisi antrean Anda. Jika kuota tidak tersedia, pembayaran akan direfund.</div>
                      </div>
                    );
                  }
                  return null;
                })()}

                {/* Rekening Transfer */}
                <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-150 rounded-2xl text-xs space-y-3 text-slate-600 dark:text-slate-400 font-medium">
                  {community.qrisImageUrl && (
                    <div className="mb-2">
                      <p className="font-bold text-slate-800 dark:text-slate-200 mb-2">Scan QRIS:</p>
                      <div className="bg-white dark:bg-slate-950 p-2 rounded-xl border border-slate-200 dark:border-slate-800 inline-block">
                        <img src={community.qrisImageUrl} alt="QRIS" className="max-h-40 object-contain rounded-lg" />
                      </div>
                    </div>
                  )}
                  <p className="font-bold text-slate-800 dark:text-slate-200">
                    {community.paymentInstructions ? 'Instruksi Pembayaran:' : 'Silakan lakukan transfer ke salah satu rekening pengelola:'}
                  </p>
                  {community.paymentInstructions ? (
                    <div className="whitespace-pre-wrap text-slate-700 dark:text-slate-300">
                      {community.paymentInstructions}
                    </div>
                  ) : (
                    <div className="space-y-1 text-slate-500 dark:text-slate-400">
                      <div>• Bank BCA: <span className="font-extrabold text-slate-700 dark:text-slate-300">8002931293</span> a/n Kas Komunitas</div>
                      <div>• Bank Mandiri: <span className="font-extrabold text-slate-700 dark:text-slate-300">120001828828</span> a/n Kas Komunitas</div>
                    </div>
                  )}
                </div>

                {/* Bukti Transfer */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Unggah Bukti Transfer (Image)</label>
                  {bundleProofUrl ? (
                    <div className="space-y-2">
                      <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm bg-white dark:bg-slate-950 p-2">
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
                          try {
                            const file = e.target.files[0];
                            const options = { maxSizeMB: 1, maxWidthOrHeight: 1920, useWebWorker: true };
                            const compressedFile = await imageCompression(file, options);
                            const formData = new FormData();
                            formData.append('file', compressedFile);
                            const headers = getAuthHeaders();
                            const uploadRes = await fetch(getApiUrl() + '/upload', {
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
                      className="w-full text-xs font-semibold text-slate-500 dark:text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-[11px] file:font-extrabold file:bg-primary/5 file:text-primary hover:file:bg-primary/20"
                    />
                  )}
                </div>
              </div>

              <div className="p-6 pt-4 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setShowBundleModal(false);
                    setBundlePackage(null);
                  }}
                  className="px-4 py-2 font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-xs transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingBundle}
                  className="px-5 py-2 bg-primary hover:opacity-90 text-white font-bold rounded-xl text-xs shadow-lg shadow-primary/20 transition-all disabled:opacity-50"
                >
                  {submittingBundle ? 'Mengirim...' : 'Kirim Permintaan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPurchaseModal && purchasePackage && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-950 rounded-[2rem] shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-700 flex flex-col max-h-[90vh]">
            <div className="px-6 py-5 shrink-0 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">Pembelian Paket Sesi</h3>
                <p className="text-xs text-slate-500 font-semibold mt-1">Selesaikan pembayaran untuk membeli paket sesi ini.</p>
              </div>
              <button 
                type="button"
                onClick={() => {
                  setShowPurchaseModal(false);
                  setPurchasePackage(null);
                }}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 hover:text-slate-700 dark:text-slate-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form 
              onSubmit={async (e) => {
                e.preventDefault();
                const isWaitlist = purchasePackage && (isPrivateSession 
                  ? purchasePackage.privateQuota !== null && purchasePackage.privateQuota !== undefined && (purchasePackage.currentPrivateParticipants || 0) >= purchasePackage.privateQuota 
                  : purchasePackage.quota !== null && purchasePackage.quota !== undefined && (purchasePackage.currentParticipants || 0) >= purchasePackage.quota);

                if (!purchaseProofUrl) {
                  alert('Silakan unggah bukti transfer pembayaran Anda');
                  return;
                }
                
                setPurchasingMap(prev => ({ ...prev, [purchasePackage.id]: true }));
                try {
                  const headers = getAuthHeaders();
                  const meRes = await fetch(getApiUrl() + '/auth/me', { headers });
                  if (!meRes.ok) throw new Error('Please login again');
                  const meData = await meRes.json();

                  const res = await fetch(getApiUrl() + '/session-wallet/purchase', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': headers.Authorization || ''
                    },
                    body: JSON.stringify({
                      userId: meData.id,
                      communityId: community.id,
                      packageId: purchasePackage.id,
                      isPrivate: isPrivateSession,
                      paymentProofUrl: purchaseProofUrl,
                      promoVoucherId: appliedVoucher?.voucherId
                    })
                  });
                  if (!res.ok) {
                    const errorData = await res.json();
                    throw new Error(errorData.message || 'Gagal mengirim pembelian paket sesi');
                  }
                  
                  alert(isWaitlist ? 'Permintaan berhasil masuk ke dalam Waiting List!' : 'Permintaan pembelian paket sesi berhasil dikirim! Menunggu verifikasi pembayaran oleh admin.');
                  setShowPurchaseModal(false);
                  setPurchasePackage(null);
                  fetchDashboardData();
                  handleTabChange('dashboard');
                } catch (err) {
                  alert(err instanceof Error ? err.message : 'Terjadi kesalahan');
                } finally {
                  setPurchasingMap(prev => ({ ...prev, [purchasePackage.id]: false }));
                }
              }} 
              className="flex flex-col flex-1 min-h-0"
            >
              <div className="p-6 space-y-4 overflow-y-auto flex-1 min-h-0 custom-scrollbar">
                {/* Detail Paket Sesi */}
                <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-150 flex justify-between items-center text-xs">
                  <div>
                    <div className="font-bold text-slate-800 dark:text-slate-200">Paket Sesi Pilihan:</div>
                    <div className="text-slate-600 dark:text-slate-400 font-semibold mt-0.5">{purchasePackage.name} ({purchasePackage.totalSession} Sesi)</div>
                  </div>
                  <div className="font-black text-slate-900 dark:text-slate-50">
                    Rp {(isPrivateSession && purchasePackage.vipPrice ? purchasePackage.vipPrice : purchasePackage.memberPrice)?.toLocaleString('id-ID') || 0}
                  </div>
                </div>

                {!!purchasePackage.memberPrice && !!purchasePackage.vipPrice && (
                  <div className="mt-2">
                    <label className="flex items-center gap-3 p-3 border border-amber-200 bg-amber-50 dark:bg-amber-900/20 rounded-xl cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isPrivateSession}
                        onChange={(e) => setIsPrivateSession(e.target.checked)}
                        className="w-5 h-5 text-amber-600 border-amber-300 rounded focus:ring-amber-500"
                      />
                      <div>
                        <div className="font-bold text-amber-800 dark:text-amber-400 text-sm">Gunakan Harga Private</div>
                        <div className="text-xs text-amber-700 dark:text-amber-500/80">Saya ingin mengambil sesi secara private</div>
                      </div>
                    </label>
                  </div>
                )}

                {/* Voucher Input Field */}
                <div className="p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl mt-2">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-indigo-600" />
                    Punya Kode Promo / Voucher?
                  </label>
                  {appliedVoucher ? (
                    <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <div>
                          <div className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                            Kode: <span className="font-mono">{appliedVoucher.code}</span>
                          </div>
                          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                            Hemat Rp {appliedVoucher.discountAmount.toLocaleString('id-ID')}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setAppliedVoucher(null);
                          setVoucherCodeInput('');
                        }}
                        className="text-[11px] font-bold text-red-500 hover:underline px-2 py-1"
                      >
                        Hapus
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={voucherCodeInput}
                          onChange={(e) => {
                            setVoucherCodeInput(e.target.value.toUpperCase());
                            setVoucherError('');
                          }}
                          placeholder="Contoh: PROMO123"
                          className="flex-1 px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono uppercase font-bold text-indigo-600 outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <button
                          type="button"
                          disabled={validatingVoucher || !voucherCodeInput.trim()}
                          onClick={async () => {
                            const subtotal = (isPrivateSession && purchasePackage.vipPrice) ? (purchasePackage.vipPrice || 0) : (purchasePackage.memberPrice || 0);
                            setValidatingVoucher(true);
                            setVoucherError('');
                            try {
                              const res = await fetch(`${getApiUrl()}/promo-vouchers/validate`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  communityId: community.id,
                                  code: voucherCodeInput.trim(),
                                  purchaseAmount: subtotal,
                                }),
                              });
                              const data = await res.json();
                              if (!res.ok) throw new Error(data.message || 'Voucher tidak valid');
                              setAppliedVoucher({
                                code: data.code,
                                voucherId: data.voucherId,
                                discountAmount: data.discountAmount,
                                message: data.message,
                              });
                            } catch (err) {
                              setAppliedVoucher(null);
                              setVoucherError(err instanceof Error ? err.message : 'Voucher tidak valid');
                            } finally {
                              setValidatingVoucher(false);
                            }
                          }}
                          className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1 shrink-0"
                        >
                          {validatingVoucher ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Pasang'}
                        </button>
                      </div>
                      {voucherError && <p className="text-[10px] font-bold text-red-500 ml-1 flex items-center gap-1"><X className="w-3 h-3" /> {voucherError}</p>}
                    </div>
                  )}
                </div>

                {/* Rincian Total Pembayaran */}
                <div className="p-4 bg-primary/5 border border-indigo-150 rounded-2xl space-y-2 text-xs mt-4">
                  {appliedVoucher ? (
                    <>
                      <div className="flex justify-between items-center text-slate-500 font-semibold mb-1">
                        <span>Subtotal:</span>
                        <span>Rp {((isPrivateSession && purchasePackage.vipPrice) ? (purchasePackage.vipPrice || 0) : (purchasePackage.memberPrice || 0)).toLocaleString('id-ID')}</span>
                      </div>
                      <div className="flex justify-between items-center text-emerald-600 font-semibold mb-1 pb-2 border-b border-indigo-100">
                        <span>Diskon (Voucher):</span>
                        <span>- Rp {appliedVoucher.discountAmount.toLocaleString('id-ID')}</span>
                      </div>
                      <div className="flex justify-between items-center text-primary font-extrabold pt-1">
                        <span>Total Transfer:</span>
                        <span className="text-sm">
                          Rp {Math.max(0, ((isPrivateSession && purchasePackage.vipPrice) ? (purchasePackage.vipPrice || 0) : (purchasePackage.memberPrice || 0)) - appliedVoucher.discountAmount).toLocaleString('id-ID')}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between items-center text-primary font-extrabold">
                      <span>Total Transfer:</span>
                      <span className="text-sm">
                        Rp {((isPrivateSession && purchasePackage.vipPrice) ? (purchasePackage.vipPrice || 0) : (purchasePackage.memberPrice || 0)).toLocaleString('id-ID')}
                      </span>
                    </div>
                  )}
                </div>

                {/* Waitlist Notice */}
                {(() => {
                  const isWaitlist = purchasePackage && (isPrivateSession 
                    ? purchasePackage.privateQuota !== null && purchasePackage.privateQuota !== undefined && (purchasePackage.currentPrivateParticipants || 0) >= purchasePackage.privateQuota 
                    : purchasePackage.quota !== null && purchasePackage.quota !== undefined && (purchasePackage.currentParticipants || 0) >= purchasePackage.quota);

                  if (isWaitlist) {
                    return (
                      <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs space-y-2 mb-4">
                        <div className="font-bold text-amber-800">Kuota Penuh - Masuk Waiting List</div>
                        <div className="text-amber-700">Kuota untuk paket ini sudah penuh. Anda akan otomatis didaftarkan ke dalam Waiting List. Silakan selesaikan pembayaran untuk mengamankan posisi antrean Anda. Jika kuota tidak tersedia, pembayaran akan direfund.</div>
                      </div>
                    );
                  }
                  return null;
                })()}

                {/* Rekening Transfer */}
                <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-150 rounded-2xl text-xs space-y-3 text-slate-600 dark:text-slate-400 font-medium">
                  {community.qrisImageUrl && (
                    <div className="mb-2">
                      <p className="font-bold text-slate-800 dark:text-slate-200 mb-2">Scan QRIS:</p>
                      <div className="bg-white dark:bg-slate-950 p-2 rounded-xl border border-slate-200 dark:border-slate-800 inline-block">
                        <img src={community.qrisImageUrl} alt="QRIS" className="max-h-40 object-contain rounded-lg" />
                      </div>
                    </div>
                  )}
                  <p className="font-bold text-slate-800 dark:text-slate-200">
                    {community.paymentInstructions ? 'Instruksi Pembayaran:' : 'Silakan lakukan transfer ke salah satu rekening pengelola:'}
                  </p>
                  {community.paymentInstructions ? (
                    <div className="whitespace-pre-wrap text-slate-700 dark:text-slate-300">
                      {community.paymentInstructions}
                    </div>
                  ) : (
                    <div className="space-y-1 text-slate-500 dark:text-slate-400">
                      <div>• Bank BCA: <span className="font-extrabold text-slate-700 dark:text-slate-300">8002931293</span> a/n Kas Komunitas</div>
                      <div>• Bank Mandiri: <span className="font-extrabold text-slate-700 dark:text-slate-300">120001828828</span> a/n Kas Komunitas</div>
                    </div>
                  )}
                </div>

                {/* Bukti Transfer */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Unggah Bukti Transfer (Image)</label>
                  {purchaseProofUrl ? (
                    <div className="space-y-2">
                      <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm bg-white dark:bg-slate-950 p-2">
                        <img src={purchaseProofUrl} alt="Bukti Transfer" className="w-full h-auto object-contain max-h-32 rounded-lg mx-auto" />
                      </div>
                      <button 
                        type="button"
                        onClick={() => setPurchaseProofUrl('')}
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
                          try {
                            const file = e.target.files[0];
                            const options = { maxSizeMB: 1, maxWidthOrHeight: 1920, useWebWorker: true };
                            const compressedFile = await imageCompression(file, options);
                            const formData = new FormData();
                            formData.append('file', compressedFile);
                            const headers = getAuthHeaders();
                            const uploadRes = await fetch(getApiUrl() + '/upload', {
                              method: 'POST',
                              headers: {
                                'Authorization': headers.Authorization || ''
                              },
                              body: formData
                            });
                            if (!uploadRes.ok) throw new Error('Gagal mengunggah gambar');
                            const uploadData = await uploadRes.json();
                            setPurchaseProofUrl(uploadData.url);
                          } catch (err) {
                            alert(err instanceof Error ? err.message : 'Gagal mengunggah');
                          }
                        }
                      }}
                      className="w-full text-xs font-semibold text-slate-500 dark:text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-[11px] file:font-extrabold file:bg-primary/5 file:text-primary hover:file:bg-primary/20"
                    />
                  )}
                </div>
              </div>

              <div className="p-6 pt-4 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setShowPurchaseModal(false);
                    setPurchasePackage(null);
                  }}
                  className="px-4 py-2 font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-xs transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={purchasingMap[purchasePackage.id]}
                  className="px-5 py-2 bg-primary hover:opacity-90 text-white font-bold rounded-xl text-xs shadow-lg shadow-primary/20 transition-all disabled:opacity-50"
                >
                  {(() => {
                    const isWaitlist = purchasePackage && (isPrivateSession 
                      ? purchasePackage.privateQuota !== null && purchasePackage.privateQuota !== undefined && (purchasePackage.currentPrivateParticipants || 0) >= purchasePackage.privateQuota 
                      : purchasePackage.quota !== null && purchasePackage.quota !== undefined && (purchasePackage.currentParticipants || 0) >= purchasePackage.quota);
                    return purchasingMap[purchasePackage.id] ? 'Mengirim...' : (isWaitlist ? 'Daftar Waiting List' : 'Kirim Permintaan');
                  })()}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Guest RSVP Modal */}
      {showGuestRsvpModal && guestRsvpPackage && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowGuestRsvpModal(false)} />
          <div className="relative bg-white dark:bg-slate-950 w-full max-w-md rounded-3xl shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 pb-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <h3 className="text-lg font-black text-slate-900 dark:text-slate-50 tracking-tight">Pendaftaran Peserta Umum</h3>
              <p className="text-xs text-slate-500 font-medium mt-1">Isi formulir di bawah ini untuk mendaftar pada <span className="font-bold text-primary">{guestRsvpPackage.name}</span></p>
            </div>
            
            <form 
              onSubmit={async (e) => {
                e.preventDefault();
                if (!guestForm.acceptedTnC) {
                  alert('Anda harus menyetujui syarat & ketentuan');
                  return;
                }
                setSubmittingGuest(true);
                try {
                  const res = await fetch(`${getApiUrl()}/guest-registrations/submit`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      communityId: community.id,
                      packageId: guestRsvpPackage.id,
                      ...guestForm
                    })
                  });
                  if (!res.ok) throw new Error('Gagal mengirim pendaftaran');
                  
                  alert('Pendaftaran berhasil! Kami akan segera memprosesnya.');
                  setShowGuestRsvpModal(false);
                  setGuestRsvpPackage(null);
                  setGuestForm({ name: '', email: '', phone: '', address: '', acceptedTnC: false });
                } catch (err) {
                  alert(err instanceof Error ? err.message : 'Terjadi kesalahan');
                } finally {
                  setSubmittingGuest(false);
                }
              }} 
              className="flex flex-col flex-1 min-h-0"
            >
              <div className="p-6 space-y-4 overflow-y-auto flex-1 min-h-0 custom-scrollbar">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Nama Lengkap</label>
                  <input type="text" required value={guestForm.name} onChange={e => setGuestForm({...guestForm, name: e.target.value})} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-slate-50 placeholder:text-slate-400" placeholder="Masukkan nama lengkap" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Alamat Email</label>
                  <input type="email" required value={guestForm.email} onChange={e => setGuestForm({...guestForm, email: e.target.value})} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-slate-50 placeholder:text-slate-400" placeholder="email@contoh.com" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Nomor Handphone (WhatsApp)</label>
                  <input type="text" required value={guestForm.phone} onChange={e => setGuestForm({...guestForm, phone: e.target.value})} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-slate-50 placeholder:text-slate-400" placeholder="08xxxxxxxxxx" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Alamat Domisili</label>
                  <textarea required value={guestForm.address} onChange={e => setGuestForm({...guestForm, address: e.target.value})} rows={3} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-slate-50 placeholder:text-slate-400 resize-none" placeholder="Masukkan alamat lengkap"></textarea>
                </div>

                {(() => {
                  const isWaitlist = guestRsvpPackage.quota !== null && guestRsvpPackage.quota !== undefined && (guestRsvpPackage.currentParticipants || 0) >= guestRsvpPackage.quota;
                  if (isWaitlist) {
                    return (
                      <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs space-y-2">
                        <div className="font-bold text-amber-800">Kuota Penuh - Waiting List</div>
                        <div className="text-amber-700">Kuota untuk paket ini sudah penuh. Anda dapat mendaftar untuk masuk ke dalam Waiting List. Kami akan menghubungi Anda jika ada kuota yang tersedia.</div>
                      </div>
                    );
                  }
                  return null;
                })()}
                <div className="pt-2">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" checked={guestForm.acceptedTnC} onChange={e => setGuestForm({...guestForm, acceptedTnC: e.target.checked})} className="mt-1 w-4 h-4 text-primary rounded" />
                    <span className="text-xs text-slate-500 leading-tight">
                      Saya telah membaca dan menyetujui seluruh <a href="#" className="text-primary font-bold hover:underline">Syarat & Ketentuan</a> serta Kebijakan Privasi dari {community.name}.
                    </span>
                  </label>
                </div>
              </div>

              <div className="p-6 pt-4 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 shrink-0">
                <button type="button" onClick={() => setShowGuestRsvpModal(false)} className="px-4 py-2 font-bold text-slate-500 hover:bg-slate-100 rounded-xl text-xs transition-colors">Batal</button>
                <button type="submit" disabled={submittingGuest} className="px-5 py-2 bg-primary hover:opacity-90 text-white font-bold rounded-xl text-xs shadow-lg shadow-primary/20 transition-all disabled:opacity-50">
                  {(() => {
                    const isWaitlist = guestRsvpPackage.quota !== null && guestRsvpPackage.quota !== undefined && (guestRsvpPackage.currentParticipants || 0) >= guestRsvpPackage.quota;
                    return submittingGuest ? 'Mengirim...' : (isWaitlist ? 'Daftar Waiting List' : 'Kirim Pendaftaran');
                  })()}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mobile Floating Bottom Navigation */}
      <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-[400px] bg-white dark:bg-slate-950 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-100 dark:border-slate-800 flex items-center gap-2 px-6 py-3 z-[100] animate-in slide-in-from-bottom-8 overflow-x-auto scrollbar-none scroll-smooth">
        {(isLoggedIn ? ['home', 'about', 'sessions', 'gallery', 'contact', 'dashboard'] : ['home', 'about', 'sessions', 'gallery', 'contact']).map(tab => {
          let label = tab;
          if (tab === 'home' && community.menuHomeLabel) label = community.menuHomeLabel;
          if (tab === 'about' && community.menuAboutLabel) label = community.menuAboutLabel;
          if (tab === 'sessions' && community.menuEventsLabel) label = community.menuEventsLabel;
          if (tab === 'gallery' && community.menuGalleryLabel) label = community.menuGalleryLabel;
          if (tab === 'contact' && community.menuContactLabel) label = community.menuContactLabel;
          if (tab === 'dashboard') label = 'Profil';

          return (
            <button 
              key={tab}
              onClick={() => handleTabChange(tab)}
              className="flex flex-col items-center justify-center relative w-14 shrink-0"
            >
              <div className={`mb-1 transition-colors flex items-center justify-center ${activeTab === tab ? 'text-primary' : 'text-slate-400'}`}>
                {getTabIcon(tab)}
              </div>
              <span className={`text-[9px] font-bold transition-colors capitalize text-center ${activeTab === tab ? 'text-primary' : 'text-slate-400'}`}>
                {label}
              </span>
              {activeTab === tab && (
                <span className="absolute -bottom-2 w-1 h-1 bg-primary rounded-full"></span>
              )}
            </button>
          );
        })}
      </div>
      </div>

      <ConfirmModal 
        isOpen={isCheckInConfirmOpen}
        title={checkInActionData?.isCheckedIn ? 'Konfirmasi Check-out' : 'Konfirmasi Check-in'}
        message={checkInActionData?.isCheckedIn 
          ? 'Apakah Anda yakin ingin melakukan check-out dari kelas ini?' 
          : 'Apakah Anda yakin ingin menggunakan 1 kuota untuk check-in ke kelas ini?'}
        confirmText={checkInActionData?.isCheckedIn ? 'Check-out' : 'Check-in'}
        cancelText="Batal"
        isDestructive={false}
        onConfirm={executeCheckInOut}
        onCancel={() => {
          setIsCheckInConfirmOpen(false);
          setCheckInActionData(null);
        }}
      />
    </div>
  );
}
