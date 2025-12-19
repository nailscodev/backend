import { SetMetadata } from '@nestjs/common';

/**
 * Metadata key for public endpoints
 */
export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Decorator to mark endpoints as public (no JWT authentication required)
 * 
 * By default, all POST, PUT, and DELETE requests require JWT authentication.
 * Use this decorator to bypass authentication for specific endpoints.
 * 
 * Usage:
 * ```typescript
 * @Public()
 * @Post('login')
 * async login(@Body() loginDto: LoginDto) {
 *   return this.authService.login(loginDto);
 * }
 * ```
 * 
 * @returns Method decorator that marks the route as public
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
