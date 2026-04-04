import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/**
 * Restricts an endpoint to users with one of the specified roles.
 *
 * Usage:
 * ```typescript
 * @Roles('admin')
 * @UseGuards(RolesGuard)
 * @Patch(':id')
 * async update(...) {}
 * ```
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
