import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { AuthenticatedRequest } from '../interceptors/jwt-auth.interceptor';

/**
 * Guard that enforces role-based access control using the @Roles() decorator.
 * Must be used together with @Roles() — if no roles are defined on the handler,
 * the guard allows the request through (use @RequireAuth() for pure auth checks).
 *
 * Example:
 * ```typescript
 * @Roles('admin')
 * @UseGuards(RolesGuard)
 * @Patch(':id')
 * async update(...) {}
 * ```
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // No @Roles() on this handler — allow through
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    if (!user?.role) {
      throw new ForbiddenException('Access denied: no role assigned');
    }

    if (!requiredRoles.includes(user.role)) {
      throw new ForbiddenException(
        `Access denied: requires role(s) [${requiredRoles.join(', ')}], got '${user.role}'`,
      );
    }

    return true;
  }
}
