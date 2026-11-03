import type { ReactNode } from "react";
import type {
  Community,
  CommunityMember,
  Event,
  GalleryImage,
  SessionPackage,
  User,
  UserMembershipWithMembership,
} from "../../types";
import type { clubLabels } from "../../lib/club";

export type PublicView = "home" | "packages" | "events" | "about" | "gallery" | "contact" | "more";
export type MemberView = "member" | "member-packages" | "member-history" | "member-card" | "member-account";
export type ClubView = PublicView | MemberView;

// Wallets are shown per package and participant (extra pax have their own wallet)
export interface ActiveWalletView {
  walletId: string;
  walletKey: string;
  participantName: string | null;
  packageId: string;
  packageName: string;
  totalSession: number;
  remainingSession: number;
  expiredDate: string | null;
  purchaseDate: string | null;
  status: string;
}

export interface HistoryItem {
  type: string;
  change: number;
  date: Date;
  remarks: string;
  packageId?: string;
  walletKey?: string;
}

export interface ClubCtx {
  community: Community;
  slug: string;
  base: string;
  labels: ReturnType<typeof clubLabels>;
  packages: SessionPackage[];
  loadingPackages: boolean;
  events: Event[];
  loadingEvents: boolean;
  gallery: GalleryImage[];
  loadingGallery: boolean;
  isLoggedIn: boolean;
  authChecked: boolean;
  status: CommunityMember | null;
  currentUser: User | null;
  wallets: ActiveWalletView[];
  history: HistoryItem[];
  memberships: UserMembershipWithMembership[];
  loadingDashboard: boolean;
  purchasing: Record<string, boolean>;
  choosePackage: (pkg: SessionPackage) => void;
  showPackageDetail: (pkg: SessionPackage) => void;
  openRenewal: () => void;
  openCheckin: (walletKey?: string) => void;
  downloadCard: () => void;
  logout: () => void;
  registerEvent: (eventId: string) => void;
  uploadRegistrationProof: (file: File) => Promise<void>;
  share: () => void;
  joinButton: (className: string, label?: string, icon?: ReactNode) => ReactNode;
}

/** Link to a club page, e.g. href(ctx, "/paket"); "" is the club home */
export function clubHref(base: string, path = ""): string {
  const full = `${base}${path}`;
  return full || "/";
}
