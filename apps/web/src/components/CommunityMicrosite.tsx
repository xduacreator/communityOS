"use client";
import { getApiUrl } from "../lib/api";
/* eslint-disable @next/next/no-img-element */

import { useState, useEffect } from "react";
import JoinButton from "./JoinButton";
import {
  Clock,
  CheckCircle,
  X,
  Tag,
  Check,
  Loader2,
} from "lucide-react";
import { toPng } from "html-to-image";
import ExtraPaxFields, { MAX_EXTRA_PAX } from "./ExtraPaxFields";
import imageCompression from "browser-image-compression";
import { getAuthHeaders, removeToken } from "../lib/auth";
import { useRouter } from "next/navigation";
import {
  Community,
  SessionPackage,
  GalleryImage,
  CommunityMember,
  SessionWallet,
  UserMembershipWithMembership,
  Membership,
  User,
  Event,
} from "../types";
import { outfit } from "../lib/fonts";
import { clientClubBase, clubLabels, clubThemeStyle, visiblePackages } from "../lib/club";
import type { ActiveWalletView, ClubCtx, ClubView, HistoryItem } from "./club/types";
import { BottomTabs, ClubFooter, DesktopHeader } from "./club/ClubUI";
import {
  AboutView,
  ContactView,
  EventsView,
  GalleryView,
  HomeView,
  MoreView,
  PackagesView,
} from "./club/PublicViews";
import {
  CheckinSheet,
  MemberAccountView,
  MemberCardView,
  MemberHistoryView,
  MemberHomeView,
  MemberPackagesView,
} from "./club/MemberViews";

// Wallets are shown per package and participant (extra pax have their own wallet)
const walletKey = (w: { packageId: string; participantName?: string | null }) =>
  `${w.packageId}::${w.participantName ?? ""}`;

export default function CommunityMicrosite({
  community,
  slug,
  view = "home",
  base: baseProp,
}: {
  community: Community;
  slug: string;
  view?: ClubView;
  base?: string;
}) {
  const base = baseProp ?? clientClubBase(slug);
  const isMemberView = view.startsWith("member");
  const [checkinOpen, setCheckinOpen] = useState(false);
  const [checkinKey, setCheckinKey] = useState<string | undefined>();
  const [authChecked, setAuthChecked] = useState(false);
  const [sessions, setSessions] = useState<SessionPackage[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [loadingGallery, setLoadingGallery] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [purchasingMap, setPurchasingMap] = useState<Record<string, boolean>>(
    {},
  );
  const [selectedPackage, setSelectedPackage] = useState<SessionPackage | null>(
    null,
  );

  const router = useRouter();

  // Dashboard states
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [status, setStatus] = useState<CommunityMember | null>(null);
  const [activeWallets, setActiveWallets] = useState<ActiveWalletView[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loadingDashboard, setLoadingDashboard] = useState(false);
  const [, setErrorDashboard] = useState("");
  const [userMemberships, setUserMemberships] = useState<
    UserMembershipWithMembership[]
  >([]);
  const [showRenewalModal, setShowRenewalModal] = useState(false);
  const [selectedRenewalTierId, setSelectedRenewalTierId] = useState("");
  const [renewalProofUrl, setRenewalProofUrl] = useState("");
  const [submittingRenewal, setSubmittingRenewal] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Bundle checkout states
  const [showBundleModal, setShowBundleModal] = useState(false);
  const [bundlePackage, setBundlePackage] = useState<SessionPackage | null>(
    null,
  );
  const [selectedBundleTierId, setSelectedBundleTierId] = useState("");
  const [bundleProofUrl, setBundleProofUrl] = useState("");
  const [submittingBundle, setSubmittingBundle] = useState(false);

  // Voucher states
  const [voucherCodeInput, setVoucherCodeInput] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState<{
    code: string;
    voucherId?: string;
    discountAmount: number;
    message: string;
  } | null>(null);
  const [validatingVoucher, setValidatingVoucher] = useState(false);
  const [voucherError, setVoucherError] = useState("");
  const [isPrivateSession, setIsPrivateSession] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [purchasePackage, setPurchasePackage] = useState<SessionPackage | null>(
    null,
  );
  const [purchaseProofUrl, setPurchaseProofUrl] = useState("");
  // Names of extra participants; the logged-in buyer is always pax 1
  const [extraPaxNames, setExtraPaxNames] = useState<string[]>([]);

  // Guest RSVP Modal
  const [showGuestRsvpModal, setShowGuestRsvpModal] = useState(false);
  const [guestRsvpPackage, setGuestRsvpPackage] =
    useState<SessionPackage | null>(null);
  const [guestForm, setGuestForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    acceptedTnC: false,
  });
  const [submittingGuest, setSubmittingGuest] = useState(false);
  // Extra participants registered together with the guest (pax 1)
  const [guestExtraPaxNames, setGuestExtraPaxNames] = useState<string[]>([]);

  const getMembershipRemainingDays = () => {
    if (!userMemberships || userMemberships.length === 0) return 0;
    const activeMemberships = userMemberships.filter(
      (m: UserMembershipWithMembership) => m.status === "ACTIVE",
    );
    if (activeMemberships.length === 0) return 0;
    const dates = activeMemberships.map((m: UserMembershipWithMembership) =>
      new Date(m.endDate).getTime(),
    );
    const maxDate = Math.max(...dates);
    const diffTime = maxDate - Date.now();
    if (diffTime <= 0) return 0;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const downloadCard = async () => {
    const cardElement = document.getElementById("member-card");
    const bgElement = document.getElementById("member-card-bg");
    if (!cardElement) return;

    let originalBg = "";
    // If there is a logo, try to convert it to base64 so html2canvas doesn't fail on CORS
    if (bgElement && community.logo) {
      originalBg = bgElement.style.backgroundImage;
      try {
        const res = await fetch(community.logo, { mode: "cors" });
        if (res.ok) {
          const blob = await res.blob();
          const reader = new FileReader();
          const base64 = await new Promise<string>((resolve) => {
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
          bgElement.style.backgroundImage = `url(${base64})`;
        } else {
          bgElement.style.backgroundImage = "none"; // Fallback
        }
      } catch (e) {
        bgElement.style.backgroundImage = "none"; // Fallback
      }
    }

    // Give DOM a tiny moment to update background if changed
    await new Promise((r) => setTimeout(r, 50));

    try {
      const dataUrl = await toPng(cardElement, {
        pixelRatio: 3,
        cacheBust: true,
        backgroundColor: "transparent",
      });

      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `Membership-Card-${status?.membershipNumber || "Draft"}.png`;
      link.click();
    } catch (err) {
      console.error("Failed to download card:", err);
      let errorMessage = "Unknown error";
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === "string") {
        errorMessage = err;
      } else {
        errorMessage = String(err);
      }
      alert("Gagal mengunduh kartu. Error: " + errorMessage);
    } finally {
      if (bgElement && originalBg) {
        bgElement.style.backgroundImage = originalBg;
      }
    }
  };

  const fetchDashboardData = async () => {
    const headers = getAuthHeaders();
    setLoadingDashboard(true);
    setErrorDashboard("");
    try {
      const res = await fetch(`${getApiUrl()}/memberships/my-status/${slug}`, {
        headers: { ...headers },
      });
      if (!res.ok) throw new Error("Failed to fetch membership status");
      const data = await res.json();
      setStatus(data);

      const meRes = await fetch(getApiUrl() + "/auth/me", { headers });
      if (meRes.ok) {
        const meData = await meRes.json();
        setCurrentUser(meData);
      }

      if (data && data.userId && data.communityId) {
        const activeMembershipsRes = await fetch(
          `${getApiUrl()}/user-membership/active/${data.userId}?communityId=${data.communityId}`,
          {
            headers: { ...headers },
          },
        );
        if (activeMembershipsRes.ok) {
          const membershipsData = await activeMembershipsRes.json();
          setUserMemberships(membershipsData);
        }
        const walletRes = await fetch(
          `${getApiUrl()}/session-wallet/user/${data.userId}?communityId=${data.communityId}`,
          {
            headers: { ...headers },
          },
        );
        if (walletRes.ok) {
          const walletData = await walletRes.json();
          const wallets = walletData as SessionWallet[];
          const groupedWallets = new Map<string, ActiveWalletView>();

          const toView = (w: SessionWallet, key: string): ActiveWalletView => ({
            walletId: w.id,
            walletKey: key,
            participantName: w.participantName ?? null,
            packageId: w.packageId,
            packageName: w.package?.name || "Paket",
            totalSession: w.totalSession,
            remainingSession: w.remainingSession,
            expiredDate: w.expiredDate ? w.expiredDate.toString() : null,
            purchaseDate: w.purchaseDate ? w.purchaseDate.toString() : null,
            status: w.walletStatus,
          });

          // Never mix unapproved repeat purchases into an active wallet balance.
          wallets.forEach((w) => {
            if (w.walletStatus === "ACTIVE") groupedWallets.set(walletKey(w), toView(w, walletKey(w)));
          });
          // Orders still waiting for payment approval or a free slot are always listed
          wallets.forEach((w) => {
            if (["PENDING", "WAITING", "WAITLIST"].includes(w.walletStatus)) {
              const key = `${walletKey(w)}::${w.id}`;
              groupedWallets.set(key, toView(w, key));
            }
          });
          // Finished wallets only when there is no active one for the same package and person.
          // walletData is newest-first, so the first match wins.
          wallets.forEach((w) => {
            if (w.walletStatus === "COMPLETED" && !groupedWallets.has(walletKey(w))) {
              groupedWallets.set(walletKey(w), toView(w, walletKey(w)));
            }
          });

          setActiveWallets(Array.from(groupedWallets.values()));

          const allTransactions: HistoryItem[] = [];
          (walletData as SessionWallet[]).forEach((w) => {
            allTransactions.push({
              type: "PURCHASE",
              change: w.totalSession,
              date: w.purchaseDate ? new Date(w.purchaseDate) : new Date(),
              remarks: `${w.package?.name || "Paket"}${w.participantName ? ` · ${w.participantName}` : ""}`,
              packageId: w.packageId,
              walletKey: walletKey(w),
            });
            if (w.transactions && Array.isArray(w.transactions)) {
              w.transactions.forEach((tx) => {
                allTransactions.push({
                  type: tx.transactionType,
                  change: tx.changeSession,
                  date: new Date(tx.createdAt),
                  remarks: `${w.package?.name || "Paket"}${w.participantName ? ` · ${w.participantName}` : ""}`,
                  packageId: w.packageId,
                  walletKey: walletKey(w),
                });
              });
            }
          });
          allTransactions.sort((a, b) => b.date.getTime() - a.date.getTime());
          setHistory(allTransactions);
        }
      }
    } catch (err) {
      setErrorDashboard(
        err instanceof Error ? err.message : "An error occurred",
      );
    } finally {
      setLoadingDashboard(false);
    }
  };

  // Public data needed by the current page
  useEffect(() => {
    fetchSessions();
    if (view === "home" || view === "events") fetchEvents();
    if (view === "gallery") fetchGallery();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, community.id]);

  useEffect(() => {
    const headers = getAuthHeaders();
    const fetchStatus = async () => {
      try {
        const res = await fetch(
          `${getApiUrl()}/memberships/my-status/${slug}`,
          { headers: { ...headers } },
        );
        // 401 = not signed in; other errors (e.g. not a member yet) still mean a session exists
        if (res.ok) {
          setIsLoggedIn(true);
          setStatus(await res.json());
        } else {
          const me = await fetch(getApiUrl() + "/auth/me", { headers });
          setIsLoggedIn(me.ok);
          if (me.ok) setCurrentUser(await me.json());
        }
      } catch (e) {
        setIsLoggedIn(false);
        console.error(e);
      } finally {
        setAuthChecked(true);
      }
    };
    fetchStatus();

    // Old links used ?tab=...; send them to the matching page
    if (typeof window !== "undefined") {
      const tab = new URLSearchParams(window.location.search).get("tab");
      const legacy: Record<string, string> = {
        dashboard: "/member",
        sessions: "/paket",
        events: "/event",
        gallery: "/galeri",
        about: "/tentang",
        contact: "/kontak",
      };
      if (tab && legacy[tab]) router.replace(`${base}${legacy[tab]}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  // Member data: needed on member pages, and on package pages for the membership check
  useEffect(() => {
    if (isLoggedIn && status && (isMemberView || view === "packages" || view === "home")) {
      fetchDashboardData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, Boolean(status), view]);

  // After a purchase or registration, show the member's packages
  const handleTabChange = (tab: string) => {
    if (tab === "dashboard") router.push(`${base}/member/paket`);
  };

  const logout = () => {
    removeToken();
    setIsLoggedIn(false);
    setStatus(null);
    setActiveWallets([]);
    setHistory([]);
    setCurrentUser(null);
    router.push(base || "/");
  };

  const share = async () => {
    const url = `${window.location.origin}${base || "/"}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: community.name, url });
      } else {
        await navigator.clipboard.writeText(url);
        alert("Link halaman klub disalin.");
      }
    } catch {
      // User closed the share sheet
    }
  };

  const registerEvent = async (eventId: string) => {
    if (!isLoggedIn) {
      router.push(`${base}/login`);
      return;
    }
    try {
      const res = await fetch(`${getApiUrl()}/events/${eventId}/register`, {
        method: "POST",
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("already");
      alert("Kamu terdaftar di event ini. Sampai jumpa!");
    } catch {
      alert("Kamu sudah terdaftar di event ini, atau pendaftaran sedang ditutup.");
    }
  };

  const openRenewal = () => {
    if (userMemberships.length > 0) {
      const now = new Date();
      const current =
        userMemberships.find((m) => m.status === "ACTIVE" && new Date(m.endDate) >= now) ||
        userMemberships.find((m) => m.status === "ACTIVE") ||
        userMemberships[0];
      const end = new Date(current.endDate);
      const diffDays = Math.ceil((end.getTime() - now.getTime()) / 86400000);
      if (end >= now && diffDays > 7 && current.status === "ACTIVE") {
        alert(`Membership baru bisa diperpanjang 7 hari sebelum berakhir. (Sisa: ${diffDays} hari)`);
        return;
      }
    }
    setSelectedRenewalTierId(community.memberships?.[0]?.id || "");
    setRenewalProofUrl("");
    setShowRenewalModal(true);
  };

  // Paid registration: upload the transfer proof for the pending membership
  const uploadRegistrationProof = async (file: File) => {
    if (!status) return;
    try {
      const compressed = await imageCompression(file, { maxSizeMB: 1, maxWidthOrHeight: 1920, useWebWorker: true });
      const formData = new FormData();
      formData.append("file", compressed);
      const headers = getAuthHeaders();
      const uploadRes = await fetch(getApiUrl() + "/upload", {
        method: "POST",
        headers: { Authorization: headers.Authorization || "" },
        body: formData,
      });
      if (!uploadRes.ok) throw new Error("Gagal mengunggah bukti pembayaran");
      const { url } = await uploadRes.json();
      const confirmRes = await fetch(`${getApiUrl()}/memberships/confirm-payment/${status.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: headers.Authorization || "" },
        body: JSON.stringify({ paymentProofUrl: url }),
      });
      if (!confirmRes.ok) throw new Error("Gagal memperbarui status konfirmasi");
      setStatus(await confirmRes.json());
    } catch (err) {
      alert(err instanceof Error ? err.message : "Terjadi kesalahan");
    }
  };

  const fetchGallery = async () => {
    setLoadingGallery(true);
    try {
      const res = await fetch(
        `${getApiUrl()}/gallery/community/${community.id}`,
      );
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
      const res = await fetch(
        `${getApiUrl()}/session-package/community/${community.id}`,
      );
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
      const res = await fetch(
        `${getApiUrl()}/events/community/${community.id}`,
      );
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
    const pkg = sessions.find((p) => p.id === pkgId) || selectedPackage;
    if (!pkg) {
      alert("Paket tidak ditemukan");
      return;
    }

    const headers = getAuthHeaders();
    if (!isLoggedIn) {
      if (pkg.accessRule === "PUBLIC") {
        setGuestRsvpPackage(pkg);
        setGuestForm({
          name: "",
          email: "",
          phone: "",
          address: "",
          acceptedTnC: false,
        });
        setGuestExtraPaxNames([]);
        setShowGuestRsvpModal(true);
        return;
      } else {
        router.push(`${base}/login`);
        return;
      }
    }

    if (!status && pkg.accessRule !== "PUBLIC") {
      alert(
        "Silakan daftar/gabung komunitas terlebih dahulu sebelum membeli paket khusus member.",
      );
      return;
    }

    // Check membership remaining duration (require renewal bundle if <= 2 days or empty)
    const days = getMembershipRemainingDays();
    const requiresPaidMembership =
      community.registrationMode === "PAID" ||
      pkg.accessRule === "MEMBER_ONLY" ||
      pkg.accessRule === "PAID_MEMBERSHIP_ONLY";

    if (requiresPaidMembership && days <= 2) {
      if (!selectedPackage)
        setIsPrivateSession(pkg.vipPrice && !pkg.memberPrice ? true : false);
      setSelectedPackage(null);
      setBundlePackage(pkg);
      setSelectedBundleTierId(
        community.memberships && community.memberships.length > 0
          ? community.memberships[0].id
          : "",
      );
      setBundleProofUrl("");
      setShowBundleModal(true);
      return;
    }

    setPurchasingMap((prev) => ({ ...prev, [pkgId]: true }));
    try {
      // Confirm the cookie session is still valid before opening the purchase flow.
      const meRes = await fetch(getApiUrl() + "/auth/me", { headers });
      if (!meRes.ok) throw new Error("Please login again");

      // Store selected package and open purchase modal
      if (!selectedPackage)
        setIsPrivateSession(pkg.vipPrice && !pkg.memberPrice ? true : false);
      setPurchasePackage(pkg);
      setPurchaseProofUrl("");
      setAppliedVoucher(null);
      setVoucherCodeInput("");
      setVoucherError("");
      setExtraPaxNames([]);
      setShowPurchaseModal(true);
      // No need to continue purchase here; submission will happen in modal
      return;
    } catch (e) {
      alert(e instanceof Error ? e.message : "An error occurred");
    } finally {
      setPurchasingMap((prev) => ({ ...prev, [pkgId]: false }));
    }
  };

  // Check-in, or check-out of today's session (no session is returned); true when it worked
  const submitCheckin = async (wallet: ActiveWalletView, checkOut: boolean): Promise<boolean> => {
    if (!status) return false;
    try {
      const res = await fetch(`${getApiUrl()}/session-wallet/${checkOut ? "member/check-out" : "member/check-in"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({
          communityId: status.communityId,
          packageId: wallet.packageId,
          walletId: wallet.walletId,
          remarks: checkOut ? "Check-out" : "Check-in",
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Gagal memproses check-in");
      }
      await fetchDashboardData();
      return true;
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal memproses check-in");
      return false;
    }
  };

  // Packages that don't require a membership can be booked for up to 5 extra people
  const purchaseAllowsPax =
    (purchasePackage?.accessRule || "PUBLIC") === "PUBLIC";
  const purchasePaxCount = purchaseAllowsPax ? 1 + extraPaxNames.length : 1;
  const purchaseUnitPrice = purchasePackage
    ? isPrivateSession && purchasePackage.vipPrice
      ? purchasePackage.vipPrice || 0
      : purchasePackage.memberPrice || 0
    : 0;
  const purchaseSubtotal = purchaseUnitPrice * purchasePaxCount;
  const guestPaxCount = 1 + guestExtraPaxNames.length;
  const guestIsWaitlist =
    !!guestRsvpPackage &&
    guestRsvpPackage.quota !== null &&
    guestRsvpPackage.quota !== undefined &&
    (guestRsvpPackage.currentParticipants || 0) + guestPaxCount >
      guestRsvpPackage.quota;

  const ctx: ClubCtx = {
    community,
    slug,
    base,
    labels: clubLabels(community),
    packages: visiblePackages(sessions),
    loadingPackages: loadingSessions,
    events,
    loadingEvents,
    gallery: galleryImages,
    loadingGallery,
    isLoggedIn,
    authChecked,
    status,
    currentUser,
    wallets: activeWallets,
    history,
    memberships: userMemberships,
    loadingDashboard,
    purchasing: purchasingMap,
    choosePackage: (pkg) => {
      if (pkg.vipPrice) {
        setSelectedPackage(pkg);
        setIsPrivateSession(!pkg.memberPrice);
      } else {
        handlePurchase(pkg.id);
      }
    },
    showPackageDetail: (pkg) => {
      setSelectedPackage(pkg);
      setIsPrivateSession(Boolean(pkg.vipPrice && !pkg.memberPrice));
    },
    openRenewal,
    openCheckin: (walletKey) => {
      setCheckinKey(walletKey);
      setCheckinOpen(true);
    },
    downloadCard,
    logout,
    registerEvent,
    uploadRegistrationProof,
    share,
    joinButton: (className, label, icon) => (
      <JoinButton
        communityId={community.id}
        slug={slug}
        base={base}
        registrationFields={community.registrationFields}
        registrationMode={community.registrationMode}
        memberships={community.memberships}
        label={label}
        className={className}
        icon={icon}
      />
    ),
  };

  const content = (() => {
    switch (view) {
      case "packages":
        return <PackagesView ctx={ctx} />;
      case "events":
        return <EventsView ctx={ctx} />;
      case "about":
        return <AboutView ctx={ctx} />;
      case "gallery":
        return <GalleryView ctx={ctx} />;
      case "contact":
        return <ContactView ctx={ctx} />;
      case "more":
        return <MoreView ctx={ctx} />;
      case "member":
        return <MemberHomeView ctx={ctx} />;
      case "member-packages":
        return <MemberPackagesView ctx={ctx} />;
      case "member-history":
        return <MemberHistoryView ctx={ctx} />;
      case "member-card":
        return <MemberCardView ctx={ctx} />;
      case "member-account":
        return <MemberAccountView ctx={ctx} />;
      default:
        return <HomeView ctx={ctx} />;
    }
  })();

  return (
    <div
      className={`${outfit.className} min-h-screen bg-[#F6F6F2] text-[#111214] selection:bg-[var(--club)] selection:text-[var(--club-on)]`}
      style={clubThemeStyle(community.theme)}
    >
      <DesktopHeader ctx={ctx} view={view} />
      <main className={view === "home" ? "pb-[150px] md:pb-0" : "pb-[110px] md:pb-0"}>{content}</main>
      <div className={view === "home" ? "-mt-[150px] pb-[150px] md:mt-0 md:pb-0" : "-mt-[110px] pb-[110px] md:mt-0 md:pb-0"}>
        <ClubFooter ctx={ctx} />
      </div>
      <BottomTabs ctx={ctx} view={view} />
      <div>
        {/* Package Details Modal */}
        {selectedPackage && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-950 rounded-[2rem] shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200 overflow-hidden relative">
              {/* Modal Header with Background Image */}
              <div className="relative shrink-0 flex flex-col justify-end p-6 md:p-8 pt-10 md:pt-12 min-h-[160px] md:min-h-[200px]">
                {selectedPackage.image ? (
                  <div className="absolute inset-0">
                    <img
                      src={selectedPackage.image}
                      alt={selectedPackage.name}
                      className="w-full h-full object-cover"
                    />
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
                      {selectedPackage.category?.activity?.name ||
                        selectedPackage.activity?.name ||
                        "Activity"}{" "}
                      • {selectedPackage.category?.name || "General"}
                    </div>
                    {selectedPackage.accessRule === "MEMBER_ONLY" && (
                      <div className="inline-block bg-amber-100/90 backdrop-blur-md text-amber-800 text-xs font-black px-3 py-1.5 rounded-xl uppercase tracking-wider border border-amber-200/50">
                        Member Only
                      </div>
                    )}
                    {selectedPackage.accessRule === "PAID_MEMBERSHIP_ONLY" && (
                      <div className="inline-block bg-rose-100/90 backdrop-blur-md text-rose-800 text-xs font-black px-3 py-1.5 rounded-xl uppercase tracking-wider border border-rose-200/50">
                        Paid Member Only
                      </div>
                    )}
                  </div>
                  <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-slate-50 mb-1 leading-tight">
                    {selectedPackage.name}
                  </h2>
                  {selectedPackage.memberPrice && selectedPackage.vipPrice ? (
                    <>
                      <div className="text-2xl md:text-3xl font-black text-slate-900 dark:text-slate-50 flex items-end gap-2">
                        Rp{" "}
                        {(isPrivateSession
                          ? selectedPackage.vipPrice
                          : selectedPackage.memberPrice
                        ).toLocaleString("id-ID")}
                      </div>
                      <div className="text-sm font-bold text-amber-600 mt-1">
                        Private: Rp{" "}
                        {selectedPackage.vipPrice.toLocaleString("id-ID")}
                      </div>
                    </>
                  ) : selectedPackage.vipPrice &&
                    !selectedPackage.memberPrice ? (
                    <div className="text-2xl md:text-3xl font-black text-amber-500 flex items-end gap-2">
                      Private: Rp{" "}
                      {selectedPackage.vipPrice.toLocaleString("id-ID")}
                    </div>
                  ) : selectedPackage.memberPrice &&
                    !selectedPackage.vipPrice ? (
                    <div className="text-2xl md:text-3xl font-black text-slate-900 dark:text-slate-50 flex items-end gap-2">
                      Rp {selectedPackage.memberPrice.toLocaleString("id-ID")}
                    </div>
                  ) : (
                    <div className="text-2xl md:text-3xl font-black text-slate-900 dark:text-slate-50 flex items-end gap-2">
                      Gratis
                    </div>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto min-h-0 custom-scrollbar flex flex-col py-2">
                {!!selectedPackage.memberPrice &&
                  !!selectedPackage.vipPrice && (
                    <div className="px-6 md:px-8 pt-4 pb-2 shrink-0">
                      <label className="flex items-center gap-3 p-3 border border-amber-200 bg-amber-50 dark:bg-amber-900/20 rounded-xl cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isPrivateSession}
                          onChange={(e) =>
                            setIsPrivateSession(e.target.checked)
                          }
                          className="w-5 h-5 text-amber-600 border-amber-300 rounded focus:ring-amber-500"
                        />
                        <div>
                          <div className="font-bold text-amber-800 dark:text-amber-400 text-sm">
                            Gunakan Harga Private
                          </div>
                          <div className="text-xs text-amber-700 dark:text-amber-500/80">
                            Saya ingin mengambil sesi secara private
                          </div>
                        </div>
                      </label>
                    </div>
                  )}

                <div className="px-6 md:px-8 pt-4 shrink-0">
                  <div className="grid grid-cols-2 gap-3 md:gap-4 mb-4">
                    <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-3 md:p-4 flex flex-col justify-center items-center text-center border border-slate-100 dark:border-slate-800">
                      <CheckCircle className="w-5 h-5 md:w-6 md:h-6 text-emerald-500 mb-1.5 md:mb-2" />
                      <span className="text-lg md:text-xl font-bold text-slate-900 dark:text-slate-50">
                        {selectedPackage.totalSession}
                      </span>
                      <span className="text-[10px] md:text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Sesi
                      </span>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-3 md:p-4 flex flex-col justify-center items-center text-center border border-slate-100 dark:border-slate-800">
                      <Clock className="w-5 h-5 md:w-6 md:h-6 text-amber-500 mb-1.5 md:mb-2" />
                      <span className="text-lg md:text-xl font-bold text-slate-900 dark:text-slate-50">
                        {selectedPackage.validDays}
                      </span>
                      <span className="text-[10px] md:text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Hari Aktif
                      </span>
                    </div>
                  </div>
                </div>

                <div className="px-6 md:px-8 mb-4 mt-2 shrink-0">
                  <h3 className="text-xs md:text-sm font-bold text-slate-900 dark:text-slate-50 uppercase tracking-wider mb-2 md:mb-3">
                    Deskripsi Paket
                  </h3>
                  <div className="text-slate-600 dark:text-slate-400 text-xs md:text-sm">
                    {selectedPackage.description ? (
                      <p className="whitespace-pre-wrap leading-relaxed break-words">
                        {selectedPackage.description}
                      </p>
                    ) : (
                      <p className="italic text-slate-400">
                        Tidak ada detail tambahan untuk paket ini.
                      </p>
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
                  {purchasingMap[selectedPackage.id]
                    ? "Processing..."
                    : "Beli Paket Ini"}
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
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">
                    Perpanjang Membership
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Pilih paket membership dan unggah bukti transfer.
                  </p>
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
                    alert("Silakan pilih paket membership terlebih dahulu");
                    return;
                  }
                  if (!renewalProofUrl) {
                    alert("Silakan unggah bukti transfer pembayaran Anda");
                    return;
                  }

                  setSubmittingRenewal(true);
                  try {
                    const headers = getAuthHeaders();
                    const res = await fetch(getApiUrl() + "/user-membership", {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                        Authorization: headers.Authorization || "",
                      },
                      body: JSON.stringify({
                        communityId: status?.communityId,
                        membershipId: selectedRenewalTierId,
                        paymentProofUrl: renewalProofUrl,
                      }),
                    });
                    if (!res.ok) {
                      const errorData = await res.json().catch(() => null);
                      throw new Error(
                        errorData?.message ||
                          "Gagal mengirim permintaan perpanjangan",
                      );
                    }

                    alert(
                      "Permintaan perpanjangan membership berhasil dikirim! Menunggu persetujuan admin.",
                    );
                    setShowRenewalModal(false);
                    fetchDashboardData();
                  } catch (err) {
                    alert(
                      err instanceof Error ? err.message : "Terjadi kesalahan",
                    );
                  } finally {
                    setSubmittingRenewal(false);
                  }
                }}
                className="flex flex-col flex-1 min-h-0"
              >
                <div className="p-6 space-y-4 overflow-y-auto flex-1 min-h-0 custom-scrollbar">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                      Pilih Paket Membership
                    </label>
                    <div className="space-y-2">
                      {(community.memberships || []).map((m: Membership) => (
                        <label
                          key={m.id}
                          className={`flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-900 border rounded-xl cursor-pointer transition-all hover:border-primary/70 ${
                            selectedRenewalTierId === m.id
                              ? "border-primary ring-2 ring-primary/10"
                              : "border-slate-200 dark:border-slate-700"
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
                              <div className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                                {m.name}
                              </div>
                              <div className="text-[10px] text-slate-400 font-semibold mt-0.5">
                                Durasi: {m.durationDays} hari
                              </div>
                            </div>
                          </div>
                          <div className="font-black text-primary text-xs">
                            Rp {m.price?.toLocaleString("id-ID") || 0}
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
                                  Kode:{" "}
                                  <span className="font-mono">
                                    {appliedVoucher.code}
                                  </span>
                                </div>
                                <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                                  Hemat Rp{" "}
                                  {appliedVoucher.discountAmount.toLocaleString(
                                    "id-ID",
                                  )}
                                </div>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setAppliedVoucher(null);
                                setVoucherCodeInput("");
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
                                setVoucherCodeInput(
                                  e.target.value.toUpperCase(),
                                );
                                setVoucherError("");
                              }}
                              placeholder="Contoh: LATIHNEWBER"
                              className="flex-1 px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono uppercase font-bold text-indigo-600 outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <button
                              type="button"
                              disabled={
                                validatingVoucher || !voucherCodeInput.trim()
                              }
                              onClick={async () => {
                                const selectedMembership = (
                                  community.memberships || []
                                ).find(
                                  (m: Membership) =>
                                    m.id === selectedRenewalTierId,
                                );
                                const subtotal = selectedMembership?.price || 0;
                                setValidatingVoucher(true);
                                setVoucherError("");
                                try {
                                  const res = await fetch(
                                    `${getApiUrl()}/promo-vouchers/validate`,
                                    {
                                      method: "POST",
                                      headers: {
                                        "Content-Type": "application/json",
                                      },
                                      body: JSON.stringify({
                                        communityId: community.id,
                                        code: voucherCodeInput.trim(),
                                        purchaseAmount: subtotal,
                                      }),
                                    },
                                  );
                                  const data = await res.json();
                                  if (!res.ok)
                                    throw new Error(
                                      data.message || "Voucher tidak valid",
                                    );
                                  setAppliedVoucher({
                                    code: data.code,
                                    voucherId: data.voucherId,
                                    discountAmount: data.discountAmount,
                                    message: data.message,
                                  });
                                } catch (err) {
                                  setAppliedVoucher(null);
                                  setVoucherError(
                                    err instanceof Error
                                      ? err.message
                                      : "Voucher tidak valid",
                                  );
                                } finally {
                                  setValidatingVoucher(false);
                                }
                              }}
                              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1 shrink-0"
                            >
                              {validatingVoucher ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                "Pasang"
                              )}
                            </button>
                          </div>
                        )}
                        {voucherError && (
                          <p className="text-[11px] text-rose-500 font-semibold mt-1.5">
                            {voucherError}
                          </p>
                        )}
                      </div>

                      {/* Total Price Calculation Summary */}
                      {(() => {
                        const selectedMembership = (
                          community.memberships || []
                        ).find(
                          (m: Membership) => m.id === selectedRenewalTierId,
                        );
                        const original = selectedMembership?.price || 0;
                        const discount = appliedVoucher
                          ? appliedVoucher.discountAmount
                          : 0;
                        const finalTotal = Math.max(0, original - discount);

                        return (
                          <div className="p-3.5 bg-slate-900 text-white rounded-2xl flex items-center justify-between">
                            <div>
                              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                                Total Pembayaran
                              </span>
                              {discount > 0 && (
                                <span className="text-[11px] text-slate-400 line-through mr-2">
                                  Rp {original.toLocaleString("id-ID")}
                                </span>
                              )}
                              <span className="text-sm font-black text-emerald-400">
                                Rp {finalTotal.toLocaleString("id-ID")}
                              </span>
                            </div>
                            {discount > 0 && (
                              <span className="text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-1 rounded-lg">
                                Hemat Rp {discount.toLocaleString("id-ID")}
                              </span>
                            )}
                          </div>
                        );
                      })()}

                      <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl text-xs space-y-3 text-slate-600 dark:text-slate-400 font-medium">
                        {community.qrisImageUrl && (
                          <div className="mb-2">
                            <p className="font-bold text-slate-800 dark:text-slate-200 mb-2">
                              Scan QRIS:
                            </p>
                            <div className="bg-white dark:bg-slate-950 p-2 rounded-xl border border-slate-200 dark:border-slate-800 inline-block">
                              <img
                                src={community.qrisImageUrl}
                                alt="QRIS"
                                className="max-h-40 object-contain rounded-lg"
                              />
                            </div>
                          </div>
                        )}
                        <p className="font-bold text-slate-800 dark:text-slate-200">
                          {community.paymentInstructions
                            ? "Instruksi Pembayaran:"
                            : "Silakan lakukan transfer ke salah satu rekening:"}
                        </p>
                        {community.paymentInstructions ? (
                          <div className="whitespace-pre-wrap text-slate-700 dark:text-slate-300">
                            {community.paymentInstructions}
                          </div>
                        ) : (
                          <div className="space-y-1 text-slate-500 dark:text-slate-400">
                            <div>
                              • Bank BCA:{" "}
                              <span className="font-extrabold text-slate-700 dark:text-slate-300">
                                8002931293
                              </span>{" "}
                              a/n Kas Komunitas
                            </div>
                            <div>
                              • Bank Mandiri:{" "}
                              <span className="font-extrabold text-slate-700 dark:text-slate-300">
                                120001828828
                              </span>{" "}
                              a/n Kas Komunitas
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Unggah Bukti Transfer (Image)
                    </label>
                    {renewalProofUrl ? (
                      <div className="space-y-2">
                        <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm bg-white dark:bg-slate-950 p-2">
                          <img
                            src={renewalProofUrl}
                            alt="Bukti Transfer"
                            className="w-full h-auto object-contain max-h-32 rounded-lg mx-auto"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => setRenewalProofUrl("")}
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
                              const options = {
                                maxSizeMB: 1,
                                maxWidthOrHeight: 1920,
                                useWebWorker: true,
                              };
                              const compressedFile = await imageCompression(
                                file,
                                options,
                              );
                              const formData = new FormData();
                              formData.append("file", compressedFile);
                              const headers = getAuthHeaders();
                              const uploadRes = await fetch(
                                getApiUrl() + "/upload",
                                {
                                  method: "POST",
                                  headers: {
                                    Authorization: headers.Authorization || "",
                                  },
                                  body: formData,
                                },
                              );
                              if (!uploadRes.ok)
                                throw new Error("Gagal mengunggah gambar");
                              const uploadData = await uploadRes.json();
                              setRenewalProofUrl(uploadData.url);
                            } catch (err) {
                              alert(
                                err instanceof Error
                                  ? err.message
                                  : "Gagal mengunggah",
                              );
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
                    {submittingRenewal ? "Mengirim..." : "Kirim Permintaan"}
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
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">
                    Pembayaran Bundling Keanggotaan & Paket
                  </h3>
                  <p className="text-xs text-rose-500 font-semibold mt-1">
                    Keanggotaan Anda hampir berakhir/sudah habis. Wajib
                    perpanjang untuk membeli paket sesi.
                  </p>
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
                    alert("Silakan unggah bukti transfer pembayaran Anda");
                    return;
                  }
                  if (!selectedBundleTierId) {
                    alert(
                      "Silakan pilih tipe membership perpanjangan terlebih dahulu",
                    );
                    return;
                  }

                  setSubmittingBundle(true);
                  try {
                    const headers = getAuthHeaders();
                    const res = await fetch(
                      getApiUrl() + "/session-wallet/purchase-bundle",
                      {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                          Authorization: headers.Authorization || "",
                        },
                        body: JSON.stringify({
                          communityId: status?.communityId,
                          packageId: bundlePackage.id,
                          isPrivate: isPrivateSession,
                          membershipId: selectedBundleTierId,
                          paymentProofUrl: bundleProofUrl,
                          promoVoucherId: appliedVoucher?.voucherId,
                        }),
                      },
                    );
                    if (!res.ok) {
                      const errorData = await res.json().catch(() => null);
                      throw new Error(
                        errorData?.message ||
                          "Gagal mengirim pembelian bundling",
                      );
                    }

                    alert(
                      "Permintaan bundling membership dan paket sesi berhasil dikirim! Menunggu verifikasi pembayaran oleh admin.",
                    );
                    setShowBundleModal(false);
                    setBundlePackage(null);
                    fetchDashboardData();
                  } catch (err) {
                    alert(
                      err instanceof Error ? err.message : "Terjadi kesalahan",
                    );
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
                      <div className="font-bold text-slate-800 dark:text-slate-200">
                        Paket Sesi Pilihan:
                      </div>
                      <div className="text-slate-600 dark:text-slate-400 font-semibold mt-0.5">
                        {bundlePackage.name} ({bundlePackage.totalSession} Sesi)
                      </div>
                    </div>
                    <div className="font-black text-slate-900 dark:text-slate-50">
                      Rp{" "}
                      {(isPrivateSession && bundlePackage.vipPrice
                        ? bundlePackage.vipPrice
                        : bundlePackage.memberPrice
                      )?.toLocaleString("id-ID") || 0}
                    </div>
                  </div>

                  {!!bundlePackage.memberPrice && !!bundlePackage.vipPrice && (
                    <div className="mt-2">
                      <label className="flex items-center gap-3 p-3 border border-amber-200 bg-amber-50 dark:bg-amber-900/20 rounded-xl cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isPrivateSession}
                          onChange={(e) =>
                            setIsPrivateSession(e.target.checked)
                          }
                          className="w-5 h-5 text-amber-600 border-amber-300 rounded focus:ring-amber-500"
                        />
                        <div>
                          <div className="font-bold text-amber-800 dark:text-amber-400 text-sm">
                            Gunakan Harga Private
                          </div>
                          <div className="text-xs text-amber-700 dark:text-amber-500/80">
                            Saya ingin mengambil sesi secara private
                          </div>
                        </div>
                      </label>
                    </div>
                  )}

                  {/* Tipe Membership */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                      Pilih Paket Perpanjangan Membership
                    </label>
                    <div className="space-y-2">
                      {(community.memberships || []).map((m: Membership) => (
                        <label
                          key={m.id}
                          className={`flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-900 border rounded-xl cursor-pointer transition-all hover:border-primary/70 ${
                            selectedBundleTierId === m.id
                              ? "border-primary ring-2 ring-primary/10"
                              : "border-slate-200 dark:border-slate-700"
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
                              <div className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                                {m.name}
                              </div>
                              <div className="text-[10px] text-slate-400 font-semibold mt-0.5">
                                Durasi: {m.durationDays} hari
                              </div>
                            </div>
                          </div>
                          <div className="font-black text-primary text-xs">
                            Rp {m.price?.toLocaleString("id-ID") || 0}
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
                              Kode:{" "}
                              <span className="font-mono">
                                {appliedVoucher.code}
                              </span>
                            </div>
                            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                              Hemat Rp{" "}
                              {appliedVoucher.discountAmount.toLocaleString(
                                "id-ID",
                              )}
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setAppliedVoucher(null);
                            setVoucherCodeInput("");
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
                              setVoucherError("");
                            }}
                            placeholder="Contoh: PROMO123"
                            className="flex-1 px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono uppercase font-bold text-indigo-600 outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                          <button
                            type="button"
                            disabled={
                              validatingVoucher || !voucherCodeInput.trim()
                            }
                            onClick={async () => {
                              const packagePrice =
                                isPrivateSession && bundlePackage.vipPrice
                                  ? bundlePackage.vipPrice || 0
                                  : bundlePackage.memberPrice || 0;
                              const membershipPrice =
                                (community.memberships || []).find(
                                  (m: Membership) =>
                                    m.id === selectedBundleTierId,
                                )?.price || 0;
                              const subtotal = packagePrice + membershipPrice;

                              setValidatingVoucher(true);
                              setVoucherError("");
                              try {
                                const res = await fetch(
                                  `${getApiUrl()}/promo-vouchers/validate`,
                                  {
                                    method: "POST",
                                    headers: {
                                      "Content-Type": "application/json",
                                    },
                                    body: JSON.stringify({
                                      communityId: community.id,
                                      code: voucherCodeInput.trim(),
                                      purchaseAmount: subtotal,
                                    }),
                                  },
                                );
                                const data = await res.json();
                                if (!res.ok)
                                  throw new Error(
                                    data.message || "Voucher tidak valid",
                                  );
                                setAppliedVoucher({
                                  code: data.code,
                                  voucherId: data.voucherId,
                                  discountAmount: data.discountAmount,
                                  message: data.message,
                                });
                              } catch (err) {
                                setAppliedVoucher(null);
                                setVoucherError(
                                  err instanceof Error
                                    ? err.message
                                    : "Voucher tidak valid",
                                );
                              } finally {
                                setValidatingVoucher(false);
                              }
                            }}
                            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1 shrink-0"
                          >
                            {validatingVoucher ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              "Pasang"
                            )}
                          </button>
                        </div>
                        {voucherError && (
                          <p className="text-[10px] font-bold text-red-500 ml-1 flex items-center gap-1">
                            <X className="w-3 h-3" /> {voucherError}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Rincian Total Pembayaran */}
                  {selectedBundleTierId && (
                    <div className="p-4 bg-primary/5 border border-indigo-150 rounded-2xl space-y-2 text-xs mt-4">
                      <div className="flex justify-between items-center text-slate-600 dark:text-slate-400 font-bold">
                        <span>Harga Paket Sesi:</span>
                        <span>
                          Rp{" "}
                          {(isPrivateSession && bundlePackage.vipPrice
                            ? bundlePackage.vipPrice
                            : bundlePackage.memberPrice
                          )?.toLocaleString("id-ID")}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-slate-600 dark:text-slate-400 font-bold">
                        <span>Harga Membership:</span>
                        <span>
                          Rp{" "}
                          {(community.memberships || [])
                            .find(
                              (m: Membership) => m.id === selectedBundleTierId,
                            )
                            ?.price?.toLocaleString("id-ID")}
                        </span>
                      </div>

                      {appliedVoucher && (
                        <div className="flex justify-between items-center text-emerald-600 font-semibold pt-2 pb-2 border-t border-b border-indigo-150">
                          <span>Diskon (Voucher):</span>
                          <span>
                            - Rp{" "}
                            {appliedVoucher.discountAmount.toLocaleString(
                              "id-ID",
                            )}
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between items-center text-primary font-extrabold pt-2">
                        <span>Total Transfer:</span>
                        <span className="text-sm">
                          Rp{" "}
                          {Math.max(
                            0,
                            (isPrivateSession && bundlePackage.vipPrice
                              ? bundlePackage.vipPrice || 0
                              : bundlePackage.memberPrice || 0) +
                              ((community.memberships || []).find(
                                (m: Membership) =>
                                  m.id === selectedBundleTierId,
                              )?.price || 0) -
                              (appliedVoucher?.discountAmount || 0),
                          ).toLocaleString("id-ID")}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Waitlist Notice */}
                  {(() => {
                    const isWaitlist =
                      bundlePackage &&
                      (isPrivateSession
                        ? bundlePackage.privateQuota !== null &&
                          bundlePackage.privateQuota !== undefined &&
                          (bundlePackage.currentPrivateParticipants || 0) >=
                            bundlePackage.privateQuota
                        : bundlePackage.quota !== null &&
                          bundlePackage.quota !== undefined &&
                          (bundlePackage.currentParticipants || 0) >=
                            bundlePackage.quota);

                    if (isWaitlist) {
                      return (
                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs space-y-2 mb-2 mt-2">
                          <div className="font-bold text-amber-800">
                            Kuota Penuh - Masuk Waiting List
                          </div>
                          <div className="text-amber-700">
                            Kuota untuk paket ini sudah penuh. Anda akan
                            otomatis didaftarkan ke dalam Waiting List. Silakan
                            selesaikan pembayaran untuk mengamankan posisi
                            antrean Anda. Jika kuota tidak tersedia, pembayaran
                            akan direfund.
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}

                  {/* Rekening Transfer */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-150 rounded-2xl text-xs space-y-3 text-slate-600 dark:text-slate-400 font-medium">
                    {community.qrisImageUrl && (
                      <div className="mb-2">
                        <p className="font-bold text-slate-800 dark:text-slate-200 mb-2">
                          Scan QRIS:
                        </p>
                        <div className="bg-white dark:bg-slate-950 p-2 rounded-xl border border-slate-200 dark:border-slate-800 inline-block">
                          <img
                            src={community.qrisImageUrl}
                            alt="QRIS"
                            className="max-h-40 object-contain rounded-lg"
                          />
                        </div>
                      </div>
                    )}
                    <p className="font-bold text-slate-800 dark:text-slate-200">
                      {community.paymentInstructions
                        ? "Instruksi Pembayaran:"
                        : "Silakan lakukan transfer ke salah satu rekening pengelola:"}
                    </p>
                    {community.paymentInstructions ? (
                      <div className="whitespace-pre-wrap text-slate-700 dark:text-slate-300">
                        {community.paymentInstructions}
                      </div>
                    ) : (
                      <div className="space-y-1 text-slate-500 dark:text-slate-400">
                        <div>
                          • Bank BCA:{" "}
                          <span className="font-extrabold text-slate-700 dark:text-slate-300">
                            8002931293
                          </span>{" "}
                          a/n Kas Komunitas
                        </div>
                        <div>
                          • Bank Mandiri:{" "}
                          <span className="font-extrabold text-slate-700 dark:text-slate-300">
                            120001828828
                          </span>{" "}
                          a/n Kas Komunitas
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Bukti Transfer */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Unggah Bukti Transfer (Image)
                    </label>
                    {bundleProofUrl ? (
                      <div className="space-y-2">
                        <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm bg-white dark:bg-slate-950 p-2">
                          <img
                            src={bundleProofUrl}
                            alt="Bukti Transfer"
                            className="w-full h-auto object-contain max-h-32 rounded-lg mx-auto"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => setBundleProofUrl("")}
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
                              const options = {
                                maxSizeMB: 1,
                                maxWidthOrHeight: 1920,
                                useWebWorker: true,
                              };
                              const compressedFile = await imageCompression(
                                file,
                                options,
                              );
                              const formData = new FormData();
                              formData.append("file", compressedFile);
                              const headers = getAuthHeaders();
                              const uploadRes = await fetch(
                                getApiUrl() + "/upload",
                                {
                                  method: "POST",
                                  headers: {
                                    Authorization: headers.Authorization || "",
                                  },
                                  body: formData,
                                },
                              );
                              if (!uploadRes.ok)
                                throw new Error("Gagal mengunggah gambar");
                              const uploadData = await uploadRes.json();
                              setBundleProofUrl(uploadData.url);
                            } catch (err) {
                              alert(
                                err instanceof Error
                                  ? err.message
                                  : "Gagal mengunggah",
                              );
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
                    {submittingBundle ? "Mengirim..." : "Kirim Permintaan"}
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
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">
                    Pembelian Paket Sesi
                  </h3>
                  <p className="text-xs text-slate-500 font-semibold mt-1">
                    Selesaikan pembayaran untuk membeli paket sesi ini.
                  </p>
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
                  const isWaitlist =
                    purchasePackage &&
                    (isPrivateSession
                      ? purchasePackage.privateQuota !== null &&
                        purchasePackage.privateQuota !== undefined &&
                        (purchasePackage.currentPrivateParticipants || 0) +
                          purchasePaxCount >
                          purchasePackage.privateQuota
                      : purchasePackage.quota !== null &&
                        purchasePackage.quota !== undefined &&
                        (purchasePackage.currentParticipants || 0) +
                          purchasePaxCount >
                          purchasePackage.quota);

                  if (
                    purchaseAllowsPax &&
                    extraPaxNames.some((name) => !name.trim())
                  ) {
                    alert("Nama setiap peserta tambahan wajib diisi");
                    return;
                  }

                  if (!purchaseProofUrl) {
                    alert("Silakan unggah bukti transfer pembayaran Anda");
                    return;
                  }

                  setPurchasingMap((prev) => ({
                    ...prev,
                    [purchasePackage.id]: true,
                  }));
                  try {
                    const headers = getAuthHeaders();
                    const res = await fetch(
                      getApiUrl() + "/session-wallet/purchase",
                      {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                          Authorization: headers.Authorization || "",
                        },
                        body: JSON.stringify({
                          communityId: community.id,
                          packageId: purchasePackage.id,
                          isPrivate: isPrivateSession,
                          paymentProofUrl: purchaseProofUrl,
                          promoVoucherId: appliedVoucher?.voucherId,
                          participantNames: purchaseAllowsPax
                            ? extraPaxNames.map((name) => name.trim())
                            : undefined,
                        }),
                      },
                    );
                    if (!res.ok) {
                      const errorData = await res.json();
                      throw new Error(
                        errorData.message ||
                          "Gagal mengirim pembelian paket sesi",
                      );
                    }

                    alert(
                      isWaitlist
                        ? "Permintaan berhasil masuk ke dalam Waiting List!"
                        : "Permintaan pembelian paket sesi berhasil dikirim! Menunggu verifikasi pembayaran oleh admin.",
                    );
                    setShowPurchaseModal(false);
                    setPurchasePackage(null);
                    fetchDashboardData();
                    handleTabChange("dashboard");
                  } catch (err) {
                    alert(
                      err instanceof Error ? err.message : "Terjadi kesalahan",
                    );
                  } finally {
                    setPurchasingMap((prev) => ({
                      ...prev,
                      [purchasePackage.id]: false,
                    }));
                  }
                }}
                className="flex flex-col flex-1 min-h-0"
              >
                <div className="p-6 space-y-4 overflow-y-auto flex-1 min-h-0 custom-scrollbar">
                  {/* Detail Paket Sesi */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-150 flex justify-between items-center text-xs">
                    <div>
                      <div className="font-bold text-slate-800 dark:text-slate-200">
                        Paket Sesi Pilihan:
                      </div>
                      <div className="text-slate-600 dark:text-slate-400 font-semibold mt-0.5">
                        {purchasePackage.name} ({purchasePackage.totalSession}{" "}
                        Sesi)
                      </div>
                    </div>
                    <div className="font-black text-slate-900 dark:text-slate-50 text-right">
                      Rp {purchaseUnitPrice.toLocaleString("id-ID")}
                      {purchaseAllowsPax && (
                        <div className="text-[10px] font-semibold text-slate-500">
                          per orang
                        </div>
                      )}
                    </div>
                  </div>

                  {!!purchasePackage.memberPrice &&
                    !!purchasePackage.vipPrice && (
                      <div className="mt-2">
                        <label className="flex items-center gap-3 p-3 border border-amber-200 bg-amber-50 dark:bg-amber-900/20 rounded-xl cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isPrivateSession}
                            onChange={(e) => {
                              setIsPrivateSession(e.target.checked);
                              setAppliedVoucher(null);
                            }}
                            className="w-5 h-5 text-amber-600 border-amber-300 rounded focus:ring-amber-500"
                          />
                          <div>
                            <div className="font-bold text-amber-800 dark:text-amber-400 text-sm">
                              Gunakan Harga Private
                            </div>
                            <div className="text-xs text-amber-700 dark:text-amber-500/80">
                              Saya ingin mengambil sesi secara private
                            </div>
                          </div>
                        </label>
                      </div>
                    )}

                  {/* Peserta / Pax */}
                  {purchaseAllowsPax && (
                    <ExtraPaxFields
                      leadName={status?.user?.name || "Anda"}
                      leadLabel="Pemesan"
                      names={extraPaxNames}
                      onNamesChange={(names) => {
                        setExtraPaxNames(names);
                        // The voucher discount depends on the subtotal
                        setAppliedVoucher(null);
                      }}
                      note={`Tambah hingga ${MAX_EXTRA_PAX} peserta lain. Setiap peserta mendapat ${purchasePackage.totalSession} sesi atas namanya sendiri.`}
                    />
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
                              Kode:{" "}
                              <span className="font-mono">
                                {appliedVoucher.code}
                              </span>
                            </div>
                            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                              Hemat Rp{" "}
                              {appliedVoucher.discountAmount.toLocaleString(
                                "id-ID",
                              )}
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setAppliedVoucher(null);
                            setVoucherCodeInput("");
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
                              setVoucherError("");
                            }}
                            placeholder="Contoh: PROMO123"
                            className="flex-1 px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono uppercase font-bold text-indigo-600 outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                          <button
                            type="button"
                            disabled={
                              validatingVoucher || !voucherCodeInput.trim()
                            }
                            onClick={async () => {
                              const subtotal = purchaseSubtotal;
                              setValidatingVoucher(true);
                              setVoucherError("");
                              try {
                                const res = await fetch(
                                  `${getApiUrl()}/promo-vouchers/validate`,
                                  {
                                    method: "POST",
                                    headers: {
                                      "Content-Type": "application/json",
                                    },
                                    body: JSON.stringify({
                                      communityId: community.id,
                                      code: voucherCodeInput.trim(),
                                      purchaseAmount: subtotal,
                                    }),
                                  },
                                );
                                const data = await res.json();
                                if (!res.ok)
                                  throw new Error(
                                    data.message || "Voucher tidak valid",
                                  );
                                setAppliedVoucher({
                                  code: data.code,
                                  voucherId: data.voucherId,
                                  discountAmount: data.discountAmount,
                                  message: data.message,
                                });
                              } catch (err) {
                                setAppliedVoucher(null);
                                setVoucherError(
                                  err instanceof Error
                                    ? err.message
                                    : "Voucher tidak valid",
                                );
                              } finally {
                                setValidatingVoucher(false);
                              }
                            }}
                            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1 shrink-0"
                          >
                            {validatingVoucher ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              "Pasang"
                            )}
                          </button>
                        </div>
                        {voucherError && (
                          <p className="text-[10px] font-bold text-red-500 ml-1 flex items-center gap-1">
                            <X className="w-3 h-3" /> {voucherError}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Rincian Total Pembayaran */}
                  <div className="p-4 bg-primary/5 border border-indigo-150 rounded-2xl space-y-2 text-xs mt-4">
                    {appliedVoucher ? (
                      <>
                        <div className="flex justify-between items-center text-slate-500 font-semibold mb-1">
                          <span>
                            Subtotal
                            {purchasePaxCount > 1
                              ? ` (${purchasePaxCount} pax)`
                              : ""}
                            :
                          </span>
                          <span>
                            Rp {purchaseSubtotal.toLocaleString("id-ID")}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-emerald-600 font-semibold mb-1 pb-2 border-b border-indigo-100">
                          <span>Diskon (Voucher):</span>
                          <span>
                            - Rp{" "}
                            {appliedVoucher.discountAmount.toLocaleString(
                              "id-ID",
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-primary font-extrabold pt-1">
                          <span>Total Transfer:</span>
                          <span className="text-sm">
                            Rp{" "}
                            {Math.max(
                              0,
                              purchaseSubtotal - appliedVoucher.discountAmount,
                            ).toLocaleString("id-ID")}
                          </span>
                        </div>
                      </>
                    ) : (
                      <>
                        {purchasePaxCount > 1 && (
                          <div className="flex justify-between items-center text-slate-500 font-semibold mb-1 pb-2 border-b border-indigo-100">
                            <span>
                              Rp {purchaseUnitPrice.toLocaleString("id-ID")} ×{" "}
                              {purchasePaxCount} pax
                            </span>
                            <span>
                              Rp {purchaseSubtotal.toLocaleString("id-ID")}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between items-center text-primary font-extrabold">
                          <span>Total Transfer:</span>
                          <span className="text-sm">
                            Rp {purchaseSubtotal.toLocaleString("id-ID")}
                          </span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Waitlist Notice */}
                  {(() => {
                    const isWaitlist =
                      purchasePackage &&
                      (isPrivateSession
                        ? purchasePackage.privateQuota !== null &&
                          purchasePackage.privateQuota !== undefined &&
                          (purchasePackage.currentPrivateParticipants || 0) +
                            purchasePaxCount >
                            purchasePackage.privateQuota
                        : purchasePackage.quota !== null &&
                          purchasePackage.quota !== undefined &&
                          (purchasePackage.currentParticipants || 0) +
                            purchasePaxCount >
                            purchasePackage.quota);

                    if (isWaitlist) {
                      return (
                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs space-y-2 mb-4">
                          <div className="font-bold text-amber-800">
                            Kuota Penuh - Masuk Waiting List
                          </div>
                          <div className="text-amber-700">
                            Kuota untuk paket ini sudah penuh. Anda akan
                            otomatis didaftarkan ke dalam Waiting List. Silakan
                            selesaikan pembayaran untuk mengamankan posisi
                            antrean Anda. Jika kuota tidak tersedia, pembayaran
                            akan direfund.
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}

                  {/* Rekening Transfer */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-150 rounded-2xl text-xs space-y-3 text-slate-600 dark:text-slate-400 font-medium">
                    {community.qrisImageUrl && (
                      <div className="mb-2">
                        <p className="font-bold text-slate-800 dark:text-slate-200 mb-2">
                          Scan QRIS:
                        </p>
                        <div className="bg-white dark:bg-slate-950 p-2 rounded-xl border border-slate-200 dark:border-slate-800 inline-block">
                          <img
                            src={community.qrisImageUrl}
                            alt="QRIS"
                            className="max-h-40 object-contain rounded-lg"
                          />
                        </div>
                      </div>
                    )}
                    <p className="font-bold text-slate-800 dark:text-slate-200">
                      {community.paymentInstructions
                        ? "Instruksi Pembayaran:"
                        : "Silakan lakukan transfer ke salah satu rekening pengelola:"}
                    </p>
                    {community.paymentInstructions ? (
                      <div className="whitespace-pre-wrap text-slate-700 dark:text-slate-300">
                        {community.paymentInstructions}
                      </div>
                    ) : (
                      <div className="space-y-1 text-slate-500 dark:text-slate-400">
                        <div>
                          • Bank BCA:{" "}
                          <span className="font-extrabold text-slate-700 dark:text-slate-300">
                            8002931293
                          </span>{" "}
                          a/n Kas Komunitas
                        </div>
                        <div>
                          • Bank Mandiri:{" "}
                          <span className="font-extrabold text-slate-700 dark:text-slate-300">
                            120001828828
                          </span>{" "}
                          a/n Kas Komunitas
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Bukti Transfer */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Unggah Bukti Transfer (Image)
                    </label>
                    {purchaseProofUrl ? (
                      <div className="space-y-2">
                        <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm bg-white dark:bg-slate-950 p-2">
                          <img
                            src={purchaseProofUrl}
                            alt="Bukti Transfer"
                            className="w-full h-auto object-contain max-h-32 rounded-lg mx-auto"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => setPurchaseProofUrl("")}
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
                              const options = {
                                maxSizeMB: 1,
                                maxWidthOrHeight: 1920,
                                useWebWorker: true,
                              };
                              const compressedFile = await imageCompression(
                                file,
                                options,
                              );
                              const formData = new FormData();
                              formData.append("file", compressedFile);
                              const headers = getAuthHeaders();
                              const uploadRes = await fetch(
                                getApiUrl() + "/upload",
                                {
                                  method: "POST",
                                  headers: {
                                    Authorization: headers.Authorization || "",
                                  },
                                  body: formData,
                                },
                              );
                              if (!uploadRes.ok)
                                throw new Error("Gagal mengunggah gambar");
                              const uploadData = await uploadRes.json();
                              setPurchaseProofUrl(uploadData.url);
                            } catch (err) {
                              alert(
                                err instanceof Error
                                  ? err.message
                                  : "Gagal mengunggah",
                              );
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
                      const isWaitlist =
                        purchasePackage &&
                        (isPrivateSession
                          ? purchasePackage.privateQuota !== null &&
                            purchasePackage.privateQuota !== undefined &&
                            (purchasePackage.currentPrivateParticipants || 0) >=
                              purchasePackage.privateQuota
                          : purchasePackage.quota !== null &&
                            purchasePackage.quota !== undefined &&
                            (purchasePackage.currentParticipants || 0) >=
                              purchasePackage.quota);
                      return purchasingMap[purchasePackage.id]
                        ? "Mengirim..."
                        : isWaitlist
                          ? "Daftar Waiting List"
                          : "Kirim Permintaan";
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
            <div
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => setShowGuestRsvpModal(false)}
            />
            <div className="relative bg-white dark:bg-slate-950 w-full max-w-md rounded-3xl shadow-2xl flex flex-col max-h-[90vh]">
              <div className="p-6 pb-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
                <h3 className="text-lg font-black text-slate-900 dark:text-slate-50 tracking-tight">
                  Pendaftaran Peserta Umum
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  Isi formulir di bawah ini untuk mendaftar pada{" "}
                  <span className="font-bold text-primary">
                    {guestRsvpPackage.name}
                  </span>
                </p>
              </div>

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!guestForm.acceptedTnC) {
                    alert("Anda harus menyetujui syarat & ketentuan");
                    return;
                  }
                  if (guestExtraPaxNames.some((name) => !name.trim())) {
                    alert("Nama setiap peserta tambahan wajib diisi");
                    return;
                  }
                  setSubmittingGuest(true);
                  try {
                    const res = await fetch(
                      `${getApiUrl()}/guest-registrations/submit`,
                      {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          communityId: community.id,
                          packageId: guestRsvpPackage.id,
                          name: guestForm.name,
                          email: guestForm.email,
                          phone: guestForm.phone,
                          address: guestForm.address,
                          participantNames: guestExtraPaxNames.map((name) =>
                            name.trim(),
                          ),
                        }),
                      },
                    );
                    if (!res.ok) {
                      const errorData = await res.json().catch(() => ({}));
                      const message = Array.isArray(errorData.message)
                        ? errorData.message.join(", ")
                        : errorData.message;
                      throw new Error(message || "Gagal mengirim pendaftaran");
                    }

                    alert(
                      "Pendaftaran berhasil! Kami akan segera memprosesnya.",
                    );
                    setShowGuestRsvpModal(false);
                    setGuestRsvpPackage(null);
                    setGuestForm({
                      name: "",
                      email: "",
                      phone: "",
                      address: "",
                      acceptedTnC: false,
                    });
                    setGuestExtraPaxNames([]);
                  } catch (err) {
                    alert(
                      err instanceof Error ? err.message : "Terjadi kesalahan",
                    );
                  } finally {
                    setSubmittingGuest(false);
                  }
                }}
                className="flex flex-col flex-1 min-h-0"
              >
                <div className="p-6 space-y-4 overflow-y-auto flex-1 min-h-0 custom-scrollbar">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Nama Lengkap
                    </label>
                    <input
                      type="text"
                      required
                      value={guestForm.name}
                      onChange={(e) =>
                        setGuestForm({ ...guestForm, name: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-slate-50 placeholder:text-slate-400"
                      placeholder="Masukkan nama lengkap"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Alamat Email
                    </label>
                    <input
                      type="email"
                      required
                      value={guestForm.email}
                      onChange={(e) =>
                        setGuestForm({ ...guestForm, email: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-slate-50 placeholder:text-slate-400"
                      placeholder="email@contoh.com"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Nomor Handphone (WhatsApp)
                    </label>
                    <input
                      type="text"
                      required
                      value={guestForm.phone}
                      onChange={(e) =>
                        setGuestForm({ ...guestForm, phone: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-slate-50 placeholder:text-slate-400"
                      placeholder="08xxxxxxxxxx"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Alamat Domisili
                    </label>
                    <textarea
                      required
                      value={guestForm.address}
                      onChange={(e) =>
                        setGuestForm({ ...guestForm, address: e.target.value })
                      }
                      rows={3}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-slate-50 placeholder:text-slate-400 resize-none"
                      placeholder="Masukkan alamat lengkap"
                    ></textarea>
                  </div>

                  <ExtraPaxFields
                    leadName={guestForm.name.trim() || "Pendaftar"}
                    leadLabel="Pendaftar"
                    names={guestExtraPaxNames}
                    onNamesChange={setGuestExtraPaxNames}
                    note={`Tambah hingga ${MAX_EXTRA_PAX} peserta lain. Kontak di atas dipakai untuk semua peserta.`}
                  />

                  {guestPaxCount > 1 && !!guestRsvpPackage.memberPrice && (
                    <div className="p-4 bg-primary/5 border border-indigo-150 rounded-2xl text-xs space-y-2">
                      <div className="flex justify-between items-center text-slate-500 font-semibold pb-2 border-b border-indigo-100">
                        <span>
                          Rp{" "}
                          {guestRsvpPackage.memberPrice.toLocaleString("id-ID")}{" "}
                          × {guestPaxCount} pax
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-primary font-extrabold">
                        <span>Estimasi Total:</span>
                        <span className="text-sm">
                          Rp{" "}
                          {(
                            guestRsvpPackage.memberPrice * guestPaxCount
                          ).toLocaleString("id-ID")}
                        </span>
                      </div>
                    </div>
                  )}

                  {(() => {
                    if (guestIsWaitlist) {
                      return (
                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs space-y-2">
                          <div className="font-bold text-amber-800">
                            Kuota Penuh - Waiting List
                          </div>
                          <div className="text-amber-700">
                            Kuota untuk paket ini sudah penuh. Anda dapat
                            mendaftar untuk masuk ke dalam Waiting List. Kami
                            akan menghubungi Anda jika ada kuota yang tersedia.
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}
                  <div className="pt-2">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={guestForm.acceptedTnC}
                        onChange={(e) =>
                          setGuestForm({
                            ...guestForm,
                            acceptedTnC: e.target.checked,
                          })
                        }
                        className="mt-1 w-4 h-4 text-primary rounded"
                      />
                      <span className="text-xs text-slate-500 leading-tight">
                        Saya telah membaca dan menyetujui seluruh{" "}
                        <a
                          href="/terms-conditions"
                          target="_blank"
                          className="text-primary font-bold hover:underline"
                        >
                          Syarat & Ketentuan
                        </a>{" "}
                        serta{" "}
                        <a
                          href="/privacy-policy"
                          target="_blank"
                          className="text-primary font-bold hover:underline"
                        >
                          Kebijakan Privasi
                        </a>{" "}
                        dari {community.name}.
                      </span>
                    </label>
                  </div>
                </div>

                <div className="p-6 pt-4 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowGuestRsvpModal(false)}
                    className="px-4 py-2 font-bold text-slate-500 hover:bg-slate-100 rounded-xl text-xs transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={submittingGuest}
                    className="px-5 py-2 bg-primary hover:opacity-90 text-white font-bold rounded-xl text-xs shadow-lg shadow-primary/20 transition-all disabled:opacity-50"
                  >
                    {submittingGuest
                      ? "Mengirim..."
                      : guestIsWaitlist
                        ? "Daftar Waiting List"
                        : "Kirim Pendaftaran"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
      {checkinOpen && (
        <CheckinSheet
          ctx={ctx}
          initialKey={checkinKey}
          onClose={() => setCheckinOpen(false)}
          onSubmit={submitCheckin}
        />
      )}
    </div>
  );
}
