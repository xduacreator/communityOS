import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_SUPER_ADMIN_KEY } from '../decorators/roles.decorator';

@Injectable()
export class SuperAdminGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requireSuperAdmin = this.reflector.getAllAndOverride<boolean>(IS_SUPER_ADMIN_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requireSuperAdmin) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    return user && user.isSuperAdmin === true;
  }
}
