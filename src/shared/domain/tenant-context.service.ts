import { Injectable, Scope } from '@nestjs/common';

/**
 * Interface defining tenant context structure
 * @interface TenantContext
 */
export interface TenantContext {
  /** Unique identifier for the tenant (customer ID) */
  tenantId: string;
  /** Optional tenant name for logging/debugging */
  tenantName?: string;
}

/**
 * Service for managing tenant context throughout the application lifecycle
 * 
 * This service provides a centralized way to manage multitenant context using
 * request-scoped instances. It ensures that tenant information is available
 * throughout the entire request lifecycle without explicit passing.
 * 
 * The tenant context is based on customer IDs, allowing each customer to have
 * their own isolated data space within the same application instance.
 * 
 * @class TenantContextService
 * @scope REQUEST - New instance per request to maintain isolation
 */
@Injectable({ scope: Scope.REQUEST })
export class TenantContextService {
  /** Current tenant context for this request */
  private tenantContext: TenantContext | null = null;

  /**
   * Creates a new instance of TenantContextService
   */
  constructor() {}

  /**
   * Sets the tenant context for the current request
   * @param context - Tenant context information
   * @throws {Error} If context is invalid or tenant ID is missing
   */
  setTenantContext(context: TenantContext): void {
    if (!context.tenantId) {
      throw new Error('Tenant ID is required for tenant context');
    }

    this.tenantContext = context;
  }

  /**
   * Retrieves the current tenant context
   * @returns Current tenant context or null if not set
   */
  getTenantContext(): TenantContext | null {
    return this.tenantContext;
  }

  /**
   * Gets the current tenant ID
   * @returns Current tenant ID or null if not set
   */
  getCurrentTenantId(): string | null {
    const context = this.getTenantContext();
    return context?.tenantId || null;
  }

  /**
   * Checks if tenant context is currently set
   * @returns True if tenant context exists, false otherwise
   */
  hasTenantContext(): boolean {
    return this.getTenantContext() !== null;
  }

  /**
   * Clears the current tenant context
   * Used primarily for cleanup or testing purposes
   */
  clearTenantContext(): void {
    this.tenantContext = null;
  }

  /**
   * Validates that tenant context is properly set
   * @throws {Error} If no tenant context is found
   */
  requireTenantContext(): TenantContext {
    const context = this.getTenantContext();
    if (!context) {
      throw new Error('Tenant context is required but not found. Ensure tenant interceptor is properly configured.');
    }
    return context;
  }
}