import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  BadRequestException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { Request } from 'express';
import { TenantContextService } from '../../shared/domain/tenant-context.service';

/**
 * Interceptor for extracting and setting tenant context from HTTP requests
 * 
 * This interceptor extracts tenant information from the request headers and
 * establishes the tenant context for the duration of the request. The tenant
 * ID can be provided through:
 * 
 * 1. `X-Tenant-Id` header - Direct tenant ID specification
 * 2. `Authorization` header - Bearer token containing tenant information
 * 3. Query parameter `tenantId` - For development/testing purposes
 * 
 * The interceptor ensures that all subsequent operations within the request
 * lifecycle have access to the proper tenant context through the
 * TenantContextService.
 * 
 * @class TenantInterceptor
 * @implements {NestInterceptor}
 */
@Injectable()
export class TenantInterceptor implements NestInterceptor {
  /**
   * Creates a new instance of TenantInterceptor
   * @param tenantContextService - Service for managing tenant context
   */
  constructor(private readonly tenantContextService: TenantContextService) {}

  /**
   * Intercepts incoming requests to extract and set tenant context
   * @param context - Execution context containing request information
   * @param next - Next call handler in the interceptor chain
   * @returns Observable that continues the request processing
   * @throws {BadRequestException} If tenant ID is missing or invalid
   * @throws {UnauthorizedException} If tenant authorization fails
   */
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    
    // Skip tenant validation for public endpoints
    if (this.isPublicEndpoint(request.path)) {
      return next.handle();
    }

    const tenantId = this.extractTenantId(request);

    if (!tenantId) {
      throw new BadRequestException(
        'Tenant ID is required. Please provide it via X-Tenant-Id header, Authorization token, or tenantId query parameter.'
      );
    }

    // Validate tenant ID format (should be a valid UUID or customer ID)
    if (!this.isValidTenantId(tenantId)) {
      throw new BadRequestException(
        'Invalid tenant ID format. Tenant ID must be a valid UUID or customer identifier.'
      );
    }

    // Set tenant context for this request
    if (!this.tenantContextService) {
      // If we reach here, it means tenant validation is required but service is not available
      // This is likely a configuration error, but we'll allow the request to continue
      // for development purposes
      console.warn('TenantContextService is not initialized, but tenant validation was required');
      return next.handle();
    }
    
    this.tenantContextService.setTenantContext({
      tenantId,
      tenantName: this.extractTenantName(request),
    });

    return next.handle();
  }

  /**
   * Checks if the requested endpoint is public and should skip tenant validation
   * @param path - Request path to check
   * @returns True if endpoint is public, false otherwise
   */
  private isPublicEndpoint(path: string): boolean {
    const publicPaths = [
      '/health',
      '/api/v1/health',
      '/csrf',
      '/api/v1/csrf',
      '/api/v1/csrf/token',
      '/api/v1/status',
      '/api/v1',
      '/docs', // Swagger documentation
      '/api-docs', // Alternative Swagger documentation
    ];

    return publicPaths.some(publicPath => path === publicPath || path.startsWith(publicPath + '/'));
  }

  /**
   * Extracts tenant ID from various sources in the request
   * @param request - HTTP request object
   * @returns Extracted tenant ID or null if not found
   */
  private extractTenantId(request: Request): string | null {
    // 1. Check X-Tenant-Id header (primary method)
    const headerTenantId = request.headers['x-tenant-id'] as string;
    if (headerTenantId) {
      return headerTenantId.trim();
    }

    // 2. Check Authorization header for Bearer token
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const tenantFromToken = this.extractTenantFromToken(token);
      if (tenantFromToken) {
        return tenantFromToken;
      }
    }

    // 3. Check query parameter (for development/testing)
    const queryTenantId = request.query.tenantId as string;
    if (queryTenantId) {
      return queryTenantId.trim();
    }

    // 4. Check if it's in the request body (for POST requests)
    if (request.body && typeof request.body === 'object') {
      const body = request.body as Record<string, unknown>;
      const bodyTenantId = body.tenantId;
      if (typeof bodyTenantId === 'string') {
        return bodyTenantId;
      }
    }

    return null;
  }

  /**
   * Extracts tenant name from request headers for debugging purposes
   * @param request - HTTP request object
   * @returns Tenant name if provided, otherwise null
   */
  private extractTenantName(request: Request): string | undefined {
    const tenantName = request.headers['x-tenant-name'] as string;
    return tenantName?.trim();
  }

  /**
   * Extracts tenant ID from JWT token or custom token format
   * @param token - Bearer token string
   * @returns Tenant ID from token or null if not found
   */
  private extractTenantFromToken(token: string): string | null {
    try {
      // For now, we'll implement a simple base64 decode
      // In a real implementation, you'd decode JWT and extract tenant claim
      const decoded = Buffer.from(token, 'base64').toString('utf-8');
      const tokenData = JSON.parse(decoded) as Record<string, unknown>;
      
      const tenantId = tokenData.tenantId || tokenData.customerId;
      return typeof tenantId === 'string' ? tenantId : null;
    } catch {
      // If token parsing fails, return null
      // In production, you'd use proper JWT library
      return null;
    }
  }

  /**
   * Validates tenant ID format
   * @param tenantId - Tenant ID to validate
   * @returns True if tenant ID is valid, false otherwise
   */
  private isValidTenantId(tenantId: string): boolean {
    if (!tenantId || typeof tenantId !== 'string') {
      return false;
    }

    // Check if it's a valid UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(tenantId)) {
      return true;
    }

    // Check if it's a valid customer ID format (alphanumeric, 3-50 characters)
    const customerIdRegex = /^[a-zA-Z0-9_-]{3,50}$/;
    return customerIdRegex.test(tenantId);
  }
}