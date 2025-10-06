/**
 * @fileoverview Professional CSRF Protection Decorators
 * 
 * This file provides a comprehensive set of decorators for configuring CSRF protection
 * at the controller and method level. Following Clean Code principles, these decorators
 * offer a declarative and intuitive API for applying different levels of CSRF security.
 * 
 * @version 2.0.0
 * @author Professional Development Team
 * @since 2024-01-01
 */

import { SetMetadata } from '@nestjs/common';

/**
 * CSRF Metadata Keys
 * 
 * Constants defining the metadata keys used to store CSRF configuration
 * information on controllers and methods.
 */
export const CSRF_METADATA_KEYS = {
  REQUIRE_CSRF: 'csrf:require',
  SKIP_CSRF: 'csrf:skip',
  PROTECT_READ: 'csrf:protect-read',
} as const;

/**
 * Enables CSRF protection for a controller or method
 * 
 * This decorator marks the target as requiring CSRF token validation for all
 * state-changing operations (POST, PUT, PATCH, DELETE). It automatically
 * integrates with the CSRF guard to enforce token validation.
 * 
 * @example Basic Protection:
 * ```typescript
 * @Controller('users')
 * @CsrfProtected()
 * export class UserController {
 *   @Post()
 *   async createUser(@Body() dto: CreateUserDto) {
 *     // Automatically protected by CSRF
 *   }
 * 
 *   @Get()
 *   async getUsers() {
 *     // GET requests are safe by default, no CSRF needed
 *   }
 * }
 * ```
 * 
 * @example Method-Level Protection:
 * ```typescript
 * @Controller('api')
 * export class ApiController {
 *   @Post('sensitive-action')
 *   @CsrfProtected()
 *   async performSensitiveAction(@Body() dto: ActionDto) {
 *     // Method-specific CSRF protection
 *   }
 * }
 * ```
 */
export function CsrfProtected(): ClassDecorator & MethodDecorator {
  return SetMetadata(CSRF_METADATA_KEYS.REQUIRE_CSRF, true);
}

/**
 * Skips CSRF protection for a controller or method
 * 
 * This decorator explicitly disables CSRF validation for the target,
 * even if it would normally be required based on HTTP method or
 * controller-level configuration.
 * 
 * @example Skip Protection for Public Endpoints:
 * ```typescript
 * @Controller('public')
 * @CsrfProtected() // Enable CSRF for the entire controller
 * export class PublicController {
 *   @Post('webhook')
 *   @SkipCsrf()
 *   async handleWebhook(@Body() payload: WebhookPayload) {
 *     // Public webhook endpoint, no CSRF needed
 *   }
 * 
 *   @Post('user-registration')
 *   async registerUser(@Body() dto: RegisterUserDto) {
 *     // This still requires CSRF (controller-level protection)
 *   }
 * }
 * ```
 */
export function SkipCsrf(): ClassDecorator & MethodDecorator {
  return SetMetadata(CSRF_METADATA_KEYS.SKIP_CSRF, true);
}

/**
 * Requires CSRF protection even for safe HTTP methods
 * 
 * This decorator forces CSRF validation for operations that would normally
 * be considered safe (like GET requests), useful for sensitive read operations
 * that could leak information if exploited via CSRF.
 * 
 * @example Protect Sensitive Read Operations:
 * ```typescript
 * @Controller('admin')
 * export class AdminController {
 *   @Get('sensitive-reports')
 *   @RequireCsrf()
 *   async getSensitiveReports() {
 *     // Even though this is a GET, it requires CSRF due to sensitive data
 *   }
 * 
 *   @Get('user-list')
 *   @RequireCsrf()
 *   async getUserList() {
 *     // Another GET that requires CSRF protection
 *   }
 * }
 * ```
 */
export function RequireCsrf(): ClassDecorator & MethodDecorator {
  return SetMetadata(CSRF_METADATA_KEYS.REQUIRE_CSRF, true);
}

/**
 * Enables CSRF protection specifically for read operations
 * 
 * This decorator is a specialized version of RequireCsrf that's specifically
 * designed for protecting sensitive read operations while being more explicit
 * about its intent.
 * 
 * @example Protect Financial Data Access:
 * ```typescript
 * @Controller('financial')
 * export class FinancialController {
 *   @Get('account-balance')
 *   @CsrfProtectedRead()
 *   async getAccountBalance(@Param('accountId') accountId: string) {
 *     // Sensitive financial read operation
 *   }
 * 
 *   @Get('transaction-history')
 *   @CsrfProtectedRead()
 *   async getTransactionHistory() {
 *     // Transaction history with CSRF protection
 *   }
 * }
 * ```
 */
export function CsrfProtectedRead(): ClassDecorator & MethodDecorator {
  return SetMetadata(CSRF_METADATA_KEYS.PROTECT_READ, true);
}