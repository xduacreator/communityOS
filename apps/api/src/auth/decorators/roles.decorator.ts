import { SetMetadata } from '@nestjs/common';

export const IS_SUPER_ADMIN_KEY = 'isSuperAdmin';
export const RequireSuperAdmin = () => SetMetadata(IS_SUPER_ADMIN_KEY, true);

export const TENANT_ROLE_KEY = 'tenantRole';
export const RequireTenantRoles = (...roles: string[]) => SetMetadata(TENANT_ROLE_KEY, roles);
export const RequireTenantRole = (role: string) => RequireTenantRoles(role);

export const TENANT_RESOURCE_KEY = 'tenantResource';
export type TenantResourceType =
  | 'activity'
  | 'category'
  | 'communityMember'
  | 'event'
  | 'galleryImage'
  | 'guestRegistration'
  | 'membership'
  | 'promoVoucher'
  | 'sessionPackage'
  | 'sessionWallet'
  | 'userMembership';
export type TenantResourceSource = 'params' | 'body' | 'query';
export interface TenantResourceMetadata {
  resource: TenantResourceType;
  source: TenantResourceSource;
  key: string;
}
export const RequireTenantResource = (
  resource: TenantResourceType,
  source: TenantResourceSource = 'params',
  key = 'id',
) => SetMetadata(TENANT_RESOURCE_KEY, { resource, source, key } satisfies TenantResourceMetadata);
