import { SetMetadata } from '@nestjs/common';

/**
 * Decorator to mark endpoints that require authentication regardless of HTTP method
 * Use this decorator when you need authentication for GET requests or other safe methods
 * 
 * @example
 * ```typescript
 * @Get('me/permissions')
 * @RequireAuth()
 * async getCurrentUserPermissions(@CurrentUser() user: CurrentUserData) {
 *   // This GET endpoint will require authentication
 * }
 * ```
 */
export const REQUIRE_AUTH_KEY = 'requireAuth';
export const RequireAuth = () => SetMetadata(REQUIRE_AUTH_KEY, true);