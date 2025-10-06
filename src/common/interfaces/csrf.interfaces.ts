/**
 * @fileoverview CSRF Protection System Interfaces
 * 
 * This file contains all the TypeScript interfaces, types, and contracts
 * used by the CSRF protection system. Following Clean Architecture principles,
 * these interfaces define the boundaries between different layers and ensure
 * type safety throughout the application.
 * 
 * @version 1.0.0
 * @author Professional Development Team
 */

/**
 * Configuration options for the CSRF protection service
 * 
 * These options control the behavior of token generation, validation,
 * and security policies for the CSRF protection system.
 */
export interface ICsrfConfiguration {
  /** 
   * Secret key used for encrypting CSRF tokens
   * Should be a strong, randomly generated string
   */
  readonly secretKey: string;
  
  /** 
   * Time-to-live for CSRF tokens in milliseconds
   * Default: 3600000 (1 hour)
   */
  readonly tokenTtl: number;
  
  /** 
   * List of allowed origins for CSRF validation
   * Used to validate the Origin and Referer headers
   */
  readonly allowedOrigins: ReadonlyArray<string>;
  
  /** 
   * Whether to enable debug logging
   * Should be false in production
   */
  readonly debugMode: boolean;
  
  /** 
   * Logging level for CSRF operations
   * Controls the verbosity of security logs
   */
  readonly logLevel: 'error' | 'warn' | 'info' | 'debug';
}

/**
 * Internal structure of a CSRF token payload
 * 
 * This represents the decrypted content of a CSRF token.
 * Contains all necessary information for token validation.
 */
export interface ICsrfTokenPayload {
  /** Unique session identifier this token is bound to */
  readonly sessionId: string;
  
  /** Timestamp when the token was issued (milliseconds since epoch) */
  readonly issuedAt: number;
  
  /** Timestamp when the token expires (milliseconds since epoch) */
  readonly expiresAt: number;
  
  /** Cryptographic nonce for preventing replay attacks */
  readonly nonce: string;
  
  /** Hash of the user's IP address for additional security */
  readonly ipHash?: string;
  
  /** Hash of the user agent for session binding */
  readonly userAgentHash?: string;
}

/**
 * Result of token generation operation
 * 
 * Contains the generated token and metadata about its properties.
 */
export interface ICsrfTokenGenerationResult {
  /** The encrypted CSRF token string */
  readonly token: string;
  
  /** Session ID this token is bound to */
  readonly sessionId: string;
  
  /** Token expiration time in milliseconds */
  readonly expiresIn: number;
  
  /** Timestamp when token was generated */
  readonly generatedAt: number;
}

/**
 * Result of token validation operation
 * 
 * Provides detailed information about token validity and metadata.
 */
export interface ICsrfTokenValidationResult {
  /** Whether the token is valid and can be accepted */
  readonly isValid: boolean;
  
  /** Age of the token in milliseconds */
  readonly ageInMilliseconds?: number;
  
  /** Whether the token has expired */
  readonly isExpired?: boolean;
  
  /** Time until expiration in milliseconds (0 if expired) */
  readonly expiresInMilliseconds?: number;
  
  /** Detailed error message if validation failed */
  readonly errorMessage?: string;
  
  /** Error code for programmatic handling */
  readonly errorCode?: CsrfValidationErrorCode;
}

/**
 * Enumeration of CSRF validation error codes
 * 
 * These codes provide specific information about why
 * a CSRF token validation failed.
 */
export enum CsrfValidationErrorCode {
  TOKEN_MISSING = 'TOKEN_MISSING',
  TOKEN_MALFORMED = 'TOKEN_MALFORMED',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_INVALID_SIGNATURE = 'TOKEN_INVALID_SIGNATURE',
  SESSION_MISMATCH = 'SESSION_MISMATCH',
  ORIGIN_FORBIDDEN = 'ORIGIN_FORBIDDEN',
  REPLAY_ATTACK_DETECTED = 'REPLAY_ATTACK_DETECTED',
  IP_ADDRESS_MISMATCH = 'IP_ADDRESS_MISMATCH',
  USER_AGENT_MISMATCH = 'USER_AGENT_MISMATCH'
}

/**
 * Request context for CSRF validation
 * 
 * Contains all necessary information extracted from the HTTP request
 * for performing comprehensive CSRF validation.
 */
export interface ICsrfRequestContext {
  /** HTTP method of the request */
  readonly method: string;
  
  /** Content-Type header value */
  readonly contentType?: string;
  
  /** Origin header value */
  readonly origin?: string;
  
  /** Referer header value */
  readonly referer?: string;
  
  /** Client IP address */
  readonly clientIp: string;
  
  /** User-Agent header value */
  readonly userAgent: string;
  
  /** Session ID extracted from request */
  readonly sessionId?: string;
  
  /** CSRF token extracted from request */
  readonly csrfToken?: string;
}

/**
 * Contract for CSRF service operations
 * 
 * Defines the public interface for the CSRF protection service.
 * Following the Interface Segregation Principle from SOLID.
 */
export interface ICsrfService {
  /**
   * Generates a new CSRF token for the given session
   * 
   * @param sessionId - Unique session identifier
   * @param ipAddress - Client IP address for additional security
   * @param userAgent - User agent string for session binding
   * @returns Promise resolving to token generation result
   */
  generateToken(
    sessionId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<ICsrfTokenGenerationResult>;
  
  /**
   * Validates a CSRF token against the provided context
   * 
   * @param token - CSRF token to validate
   * @param context - Request context for validation
   * @returns Promise resolving to validation result
   */
  validateToken(
    token: string,
    context: ICsrfRequestContext
  ): Promise<ICsrfTokenValidationResult>;
  
  /**
   * Gets information about a token without consuming it
   * 
   * @param token - CSRF token to analyze
   * @returns Promise resolving to token information
   */
  getTokenInfo(token: string): Promise<ICsrfTokenValidationResult>;
  
  /**
   * Validates the origin of a request against allowed origins
   * 
   * @param origin - Origin header value
   * @param referer - Referer header value
   * @returns Whether the origin is allowed
   */
  validateOrigin(origin?: string, referer?: string): boolean;
  
  /**
   * Validates the integrity of a request based on HTTP method and content type
   * 
   * @param method - HTTP method
   * @param contentType - Content-Type header value
   * @returns Whether the request has proper integrity
   */
  validateRequestIntegrity(method: string, contentType?: string): boolean;
}

/**
 * DTO for CSRF token generation endpoint response
 * 
 * Represents the structure of the response when requesting a new CSRF token.
 */
export interface CsrfTokenResponseDto {
  /** The generated CSRF token */
  readonly token: string;
  
  /** Token expiration time in milliseconds */
  readonly expiresIn: number;
  
  /** Session ID this token is bound to */
  readonly sessionId: string;
  
  /** Timestamp when token was generated */
  readonly generatedAt: number;
  
  /** Instructions for using the token */
  readonly usage: {
    readonly headerName: string;
    readonly description: string;
  };
}

/**
 * DTO for CSRF token validation endpoint response
 * 
 * Represents the structure of the response when validating a CSRF token.
 */
export interface CsrfValidationResponseDto {
  /** Whether the token is valid */
  readonly isValid: boolean;
  
  /** Token age in milliseconds */
  readonly ageInMilliseconds?: number;
  
  /** Whether the token is expired */
  readonly isExpired?: boolean;
  
  /** Time until expiration in milliseconds */
  readonly expiresInMilliseconds?: number;
  
  /** Error details if validation failed */
  readonly error?: {
    readonly message: string;
    readonly code: CsrfValidationErrorCode;
  };
}

/**
 * DTO for CSRF service health check response
 * 
 * Provides information about the health and status of the CSRF service.
 */
export interface CsrfHealthResponseDto {
  /** Service health status */
  readonly status: 'healthy' | 'degraded' | 'unhealthy';
  
  /** Current timestamp */
  readonly timestamp: string;
  
  /** Service version */
  readonly version: string;
  
  /** Additional service metrics */
  readonly metrics: {
    readonly tokensGenerated: number;
    readonly tokensValidated: number;
    readonly validationFailures: number;
    readonly uptime: number;
  };
}

/**
 * Configuration for CSRF decorator metadata
 * 
 * Used by decorators to configure CSRF protection behavior.
 */
export interface ICsrfDecoratorConfig {
  /** Whether to require CSRF validation */
  readonly requireCsrf: boolean;
  
  /** Whether to skip CSRF validation entirely */
  readonly skipCsrf: boolean;
  
  /** Whether to apply CSRF protection to read operations */
  readonly protectRead: boolean;
  
  /** Custom error message for CSRF failures */
  readonly customErrorMessage?: string;
  
  /** Custom allowed origins for this specific endpoint */
  readonly allowedOrigins?: ReadonlyArray<string>;
}

/**
 * Type guard to check if an object is a valid CSRF token payload
 * 
 * @param obj - Object to check
 * @returns True if object is a valid CSRF token payload
 */
export function isCsrfTokenPayload(obj: unknown): obj is ICsrfTokenPayload {
  if (typeof obj !== 'object' || obj === null) {
    return false;
  }
  
  const candidate = obj as Record<string, unknown>;
  
  return (
    typeof candidate.sessionId === 'string' &&
    typeof candidate.issuedAt === 'number' &&
    typeof candidate.expiresAt === 'number' &&
    typeof candidate.nonce === 'string'
  );
}

/**
 * Type guard to check if an object is a valid CSRF request context
 * 
 * @param obj - Object to check
 * @returns True if object is a valid CSRF request context
 */
export function isCsrfRequestContext(obj: unknown): obj is ICsrfRequestContext {
  if (typeof obj !== 'object' || obj === null) {
    return false;
  }
  
  const candidate = obj as Record<string, unknown>;
  
  return (
    typeof candidate.method === 'string' &&
    typeof candidate.clientIp === 'string' &&
    typeof candidate.userAgent === 'string'
  );
}