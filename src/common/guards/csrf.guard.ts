/**
 * @fileoverview Professional CSRF Protection Guard - Clean Implementation
 * 
 * This guard provides enterprise-grade CSRF protection for NestJS applications.
 * It implements comprehensive validation of CSRF tokens for all state-changing
 * operations while maintaining high performance and detailed security logging.
 * 
 * @version 2.0.0
 * @author Professional Development Team
 * @since 2024-01-01
 */

import { Injectable, CanActivate, ExecutionContext, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { CsrfService } from '../services/csrf.service';
import {
  CsrfTokenMissingException,
  CsrfTokenMalformedException,
  CsrfErrorHandler,
} from '../exceptions/csrf.exceptions';
import { extractSessionId } from '../utils/session.utils';

/**
 * CSRF Metadata Keys - Local constants to avoid import issues
 */
const CSRF_METADATA_KEYS = {
  REQUIRE_CSRF: 'csrf:require',
  SKIP_CSRF: 'csrf:skip',
  PROTECT_READ: 'csrf:protect-read',
} as const;

/**
 * Extended Request Interface for type safety
 */
interface IExtendedRequest extends Request {
  user?: {
    id?: string;
    sessionId?: string;
    [key: string]: unknown;
  };
  session?: {
    id?: string;
    [key: string]: unknown;
  };
}

/**
 * Professional CSRF Protection Guard
 * 
 * Implements comprehensive CSRF protection for NestJS applications following
 * security best practices and Clean Architecture principles.
 */
@Injectable()
export class CsrfGuard implements CanActivate {
  private readonly logger = new Logger(CsrfGuard.name);

  // Performance metrics for monitoring
  private readonly metrics = {
    requestsProcessed: 0,
    validationFailures: 0,
    skippedRequests: 0,
    validationTime: [] as number[],
  };

  constructor(
    private readonly csrfService: CsrfService,
    private readonly reflector: Reflector,
  ) {}

  /**
   * Main guard method - determines if request should be allowed
   * 
   * This method orchestrates the entire CSRF validation process:
   * 1. Extracts HTTP request from execution context
   * 2. Determines if CSRF validation should be applied
   * 3. Validates CSRF token if required
   * 4. Logs security events for monitoring
   * 
   * @param context - NestJS execution context containing request information
   * @returns Promise<boolean> - true if request is allowed, false or throws if denied
   * 
   * @throws CsrfTokenMissingException - When CSRF token is required but not provided
   * @throws CsrfTokenMalformedException - When CSRF token is invalid or malformed
   * 
   * @example
   * ```typescript
   * // Applied automatically by NestJS when guard is registered
   * @UseGuards(CsrfGuard)
   * @Controller('api')
   * export class ApiController {
   *   @Post('users')
   *   async createUser(@Body() dto: CreateUserDto) {
   *     // This endpoint will be CSRF protected
   *   }
   * }
   * ```
   */
  public canActivate(context: ExecutionContext): boolean {
    const startTime = Date.now();
    
    try {
      this.metrics.requestsProcessed++;
      
      // Extract HTTP request from execution context
      const request = this.extractHttpRequest(context);
      
      // Check if CSRF validation should be skipped
      if (this.shouldSkipCsrfValidation(request, context)) {
        this.metrics.skippedRequests++;
        this.logRequestSkipped(request);
        return true;
      }

      // Extract CSRF token from request
      const token = this.extractCsrfTokenFromRequest(request);
      
      // Validate token presence
      if (!token) {
        this.metrics.validationFailures++;
        this.logTokenMissing(request);
        throw new CsrfTokenMissingException({
          method: request.method,
          url: request.url,
        });
      }

      // Extract session information
      const sessionId = extractSessionId(request);
      
      // Simplified synchronous validation
      const isValid = this.csrfService.validateTokenSync(
        token,
        sessionId || ''
      );
      
      if (!isValid) {
        this.metrics.validationFailures++;
        this.logValidationFailure(request);
        throw new CsrfTokenMalformedException({
          method: request.method,
          url: request.url,
        });
      }

      // Log successful validation
      this.logValidationSuccess(request);
      this.recordValidationTime(Date.now() - startTime);
      
      return true;
      
    } catch (error) {
      // Enhanced error handling with context
      this.recordValidationTime(Date.now() - startTime);
      
      if (error instanceof CsrfTokenMissingException || 
          error instanceof CsrfTokenMalformedException) {
        throw error;
      }
      
      // Handle unexpected errors
      this.logger.error(
        `Unexpected error in CSRF validation: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
        { context: 'CsrfGuard.canActivate' }
      );
      
      return CsrfErrorHandler.handleGuardError(error);
    }
  }

  /**
   * Extracts HTTP request from NestJS execution context
   * 
   * Safely extracts the Express Request object from the execution context,
   * with proper type casting for enhanced type safety.
   * 
   * @param context - NestJS execution context
   * @returns Express Request object with extended typing
   * 
   * @private
   */
  private extractHttpRequest(context: ExecutionContext): IExtendedRequest {
    const http = context.switchToHttp();
    return http.getRequest<IExtendedRequest>();
  }

  /**
   * Extracts CSRF token from various request locations
   * 
   * Searches for CSRF token in the following order of precedence:
   * 1. Authorization header (Bearer token)
   * 2. X-CSRF-Token header
   * 3. Request body (_token field)
   * 4. Query parameters (_token)
   * 
   * @param request - Express request object
   * @returns CSRF token string or null if not found
   * 
   * @example
   * ```typescript
   * // Token in header
   * headers: { 'X-CSRF-Token': 'abc123...' }
   * 
   * // Token in body
   * body: { _token: 'abc123...', userData: {...} }
   * 
   * // Token in query
   * GET /api/action?_token=abc123...
   * ```
   * 
   * @private
   */
  private extractCsrfTokenFromRequest(request: IExtendedRequest): string | null {
    // Check Authorization header first (Bearer token)
    const authHeader = request.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // Check X-CSRF-Token header
    const csrfHeader = request.headers['x-csrf-token'] as string;
    if (csrfHeader) {
      return csrfHeader;
    }

    // Check request body
    if (request.body && typeof request.body === 'object') {
      const body = request.body as Record<string, unknown>;
      const bodyToken = body._token;
      if (typeof bodyToken === 'string') {
        return bodyToken;
      }
    }

    // Check query parameters
    const queryToken = request.query._token;
    if (typeof queryToken === 'string') {
      return queryToken;
    }

    return null;
  }

  /**
   * Determines if CSRF validation should be skipped for this request
   * 
   * Analyzes the request and execution context to determine if CSRF validation
   * should be bypassed based on:
   * - Decorator metadata (@SkipCsrf())
   * - HTTP method (GET, HEAD, OPTIONS are safe by default)
   * - Public endpoints (health, docs, etc.)
   * - Special endpoints or conditions
   * 
   * @param request - Express request object
   * @param context - NestJS execution context for metadata access
   * @returns true if CSRF validation should be skipped
   * 
   * @private
   */
  private shouldSkipCsrfValidation(
    request: IExtendedRequest,
    context: ExecutionContext
  ): boolean {
    const handler = context.getHandler();
    const controller = context.getClass();

    // Check for public endpoints that should always skip CSRF
    if (this.isPublicEndpoint(request.url || '')) {
      return true;
    }

    // Check for explicit skip metadata
    const skipCsrf = this.reflector.get<boolean>(CSRF_METADATA_KEYS.SKIP_CSRF, handler) ||
                     this.reflector.get<boolean>(CSRF_METADATA_KEYS.SKIP_CSRF, controller);

    if (skipCsrf) {
      return true;
    }

    // Check for explicit requirement
    const requireCsrf = this.reflector.get<boolean>(CSRF_METADATA_KEYS.REQUIRE_CSRF, handler) ||
                        this.reflector.get<boolean>(CSRF_METADATA_KEYS.REQUIRE_CSRF, controller);

    const protectRead = this.reflector.get<boolean>(CSRF_METADATA_KEYS.PROTECT_READ, handler) ||
                        this.reflector.get<boolean>(CSRF_METADATA_KEYS.PROTECT_READ, controller);

    // If explicitly required or read protection is enabled, don't skip
    if (requireCsrf || protectRead) {
      return false;
    }

    // Skip for safe methods by default (unless explicitly required)
    const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
    return safeMethods.includes(request.method);
  }

  /**
   * Checks if the requested endpoint is public and should skip CSRF validation
   * @param url - Request URL to check
   * @returns True if endpoint is public, false otherwise
   * @private
   */
  private isPublicEndpoint(url: string): boolean {
    const publicPaths = [
      '/health',
      '/api/v1/health',
      '/csrf',
      '/api/v1/csrf',
      '/api/v1/csrf/token',
      '/docs', // Swagger documentation
      '/api-docs', // Alternative Swagger documentation
    ];

    return publicPaths.some(publicPath => url === publicPath || url.startsWith(publicPath + '/'));
  }

  /**
   * Records validation timing for performance monitoring
   * 
   * @param duration - Validation duration in milliseconds
   * @private
   */
  private recordValidationTime(duration: number): void {
    this.metrics.validationTime.push(duration);
    
    // Keep only last 1000 measurements for memory efficiency
    if (this.metrics.validationTime.length > 1000) {
      this.metrics.validationTime = this.metrics.validationTime.slice(-1000);
    }

    // Log performance warnings for slow validations
    if (duration > 100) {
      this.logger.warn(
        `Slow CSRF validation detected: ${duration}ms`,
        { context: 'CsrfGuard.Performance' }
      );
    }
  }

  /**
   * Logs successful CSRF validation
   * 
   * @param request - Express request object
   * @private
   */
  private logValidationSuccess(request: IExtendedRequest): void {
    this.logger.debug(
      `CSRF validation successful for ${request.method} ${request.url}`,
      {
        method: request.method,
        url: request.url,
        userAgent: request.headers['user-agent'],
        ip: request.ip,
      }
    );
  }

  /**
   * Logs CSRF validation failure
   * 
   * @param request - Express request object
   * @private
   */
  private logValidationFailure(request: IExtendedRequest): void {
    this.logger.warn(
      `CSRF validation failed for ${request.method} ${request.url}`,
      {
        method: request.method,
        url: request.url,
        userAgent: request.headers['user-agent'],
        ip: request.ip,
        reason: 'Invalid token',
      }
    );
  }

  /**
   * Logs missing CSRF token
   * 
   * @param request - Express request object
   * @private
   */
  private logTokenMissing(request: IExtendedRequest): void {
    this.logger.warn(
      `CSRF token missing for ${request.method} ${request.url}`,
      {
        method: request.method,
        url: request.url,
        userAgent: request.headers['user-agent'],
        ip: request.ip,
        reason: 'Token missing',
      }
    );
  }

  /**
   * Logs skipped CSRF validation
   * 
   * @param request - Express request object
   * @private
   */
  private logRequestSkipped(request: IExtendedRequest): void {
    this.logger.debug(
      `CSRF validation skipped for ${request.method} ${request.url}`,
      {
        method: request.method,
        url: request.url,
        reason: 'Explicitly skipped or safe method',
      }
    );
  }

  /**
   * Gets current performance metrics
   * 
   * @returns Performance metrics object
   */
  public getMetrics() {
    const avgValidationTime = this.metrics.validationTime.length > 0
      ? this.metrics.validationTime.reduce((a, b) => a + b, 0) / this.metrics.validationTime.length
      : 0;

    return {
      ...this.metrics,
      averageValidationTime: Math.round(avgValidationTime * 100) / 100,
      successRate: this.metrics.requestsProcessed > 0
        ? ((this.metrics.requestsProcessed - this.metrics.validationFailures) / this.metrics.requestsProcessed) * 100
        : 100,
    };
  }
}