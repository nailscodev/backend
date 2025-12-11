import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedRequest } from '../interceptors/jwt-auth.interceptor';

/**
 * User information extracted from JWT token
 */
export interface CurrentUserData {
  id: number;
  username: string;
  email: string;
  role: string;
}

/**
 * Parameter decorator to extract current authenticated user from request
 * 
 * Usage in controllers:
 * ```typescript
 * @Post()
 * async createItem(@CurrentUser() user: CurrentUserData) {
 *   console.log(user.id, user.username, user.role);
 *   // ... your logic
 * }
 * ```
 * 
 * You can also extract specific user properties:
 * ```typescript
 * @Post()
 * async createItem(@CurrentUser('id') userId: number) {
 *   console.log(userId);
 * }
 * ```
 * 
 * @param data - Optional property name to extract from user object
 * @returns The current user object or a specific property
 */
export const CurrentUser = createParamDecorator(
  (data: keyof CurrentUserData | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    if (!user) {
      return null;
    }

    return data ? user[data] : user;
  },
);
