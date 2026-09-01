import { SetMetadata } from '@nestjs/common';

export const IS_SUPER_ADMIN_KEY = 'isSuperAdmin';
export const RequireSuperAdmin = () => SetMetadata(IS_SUPER_ADMIN_KEY, true);

export const TENANT_ROLE_KEY = 'tenantRole';
export const RequireTenantRoles = (...roles: string[]) => SetMetadata(TENANT_ROLE_KEY, roles);
export const RequireTenantRole = (role: string) => RequireTenantRoles(role);
