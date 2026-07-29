export interface User {
  id: string;
  email: string;
  name: string;
  isSuperAdmin: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Activity {
  id: string;
  communityId: string;
  name: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  categories?: Category[];
  community?: Community;
}

export interface Category {
  id: string;
  activityId: string;
  name: string;
  minAge?: number | null;
  maxAge?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface Community {
  id: string;
  slug: string;
  name: string;
  tagline?: string | null;
  domain?: string | null;
  logo?: string | null;
  theme?: string | null;
  heroBanner?: string | null;
  about?: string | null;
  shortDescription?: string | null;
  contactInfo?: string | null;
  whatsappNumber?: string;
  isActive: boolean;
  statMembersValue?: string | null;
  statEventsValue?: string | null;
  statCitiesValue?: string | null;
  statAchievementsValue?: string | null;
  welcomeMessage?: string | null;
  joinCtaLabel?: string | null;
  menuHomeLabel?: string | null;
  menuEventsLabel?: string | null;
  menuGalleryLabel?: string | null;
  menuAboutLabel?: string | null;
  menuContactLabel?: string | null;
  packagesHeadingLabel?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  seoKeywords?: string | null;
  registrationFields?: string | null;
  registrationMode?: string | null;
  paymentInstructions?: string | null;
  qrisImageUrl?: string | null;
  memberships?: Membership[];
  createdAt: string;
  updatedAt: string;
}

export interface CommunityMember {
  id: string;
  membershipNumber?: string | null;
  userId: string;
  communityId: string;
  role: 'SUPER_ADMIN' | 'COMMUNITY_ADMIN' | 'MEMBER';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  customFieldsData?: string | null;
  paymentProofUrl?: string | null;
  createdAt: string;
  updatedAt: string;
  user?: User;
  community?: Community;
}

export interface Event {
  id: string;
  communityId: string;
  title: string;
  description?: string | null;
  date: string;
  location?: string | null;
  createdAt: string;
  updatedAt: string;
  community?: Community;
  registrations?: EventRegistration[];
}

export interface EventRegistration {
  id: string;
  eventId: string;
  userId: string;
  status: 'REGISTERED' | 'ATTENDED' | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
  event?: Event;
  user?: User;
}

export interface GalleryImage {
  id: string;
  communityId: string;
  url: string;
  caption?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SessionPackage {
  id: string;
  categoryId: string;
  name: string;
  description?: string | null;
  image?: string | null;
  totalSession: number;
  validDays: number;
  memberPrice: number;
  vipPrice?: number | null;
  status: string;
  accessRule?: string;
  createdAt: string;
  updatedAt: string;
  category?: {
    id: string;
    activityId: string;
    name: string;
    activity?: Activity;
  };
  activity?: {
    id: string;
    name: string;
  } | null;
}

export interface SessionWallet {
  id: string;
  userId: string;
  communityId: string;
  packageId: string;
  userMembershipId?: string | null;
  isPrivate?: boolean;
  walletStatus: string;
  totalSession: number;
  remainingSession: number;
  purchaseDate?: string | null;
  startDate?: string | null;
  expiredDate?: string | null;
  createdAt: string;
  updatedAt: string;
  user?: User;
  package?: SessionPackage;
  community?: {
    id: string;
    name: string;
  };
  transactions?: SessionTransaction[];
}

export interface SessionTransaction {
  id: string;
  walletId: string;
  transactionType: string;
  attendanceId?: string | null;
  beforeSession: number;
  changeSession: number;
  afterSession: number;
  remarks?: string | null;
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
  wallet?: SessionWallet;
}

export interface Membership {
  id: string;
  communityId: string;
  name: string;
  durationDays: number;
  price: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserMembershipWithMembership {
  id: string;
  userId: string;
  communityId: string;
  membershipId: string;
  startDate: string;
  endDate: string;
  status: string;
  paymentProofUrl?: string | null;
  membership?: Membership;
  sessionWallets?: SessionWallet[];
  user?: User;
}
