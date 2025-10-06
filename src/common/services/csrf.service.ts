/**
 * @fileoverview Professional CSRF Protection Service
 * 
 * This service provides enterprise-grade CSRF (Cross-Site Request Forgery) protection
 * for web applications. It implements industry-standard security practices including
 * encrypted token generation, comprehensive validation, and session binding.
 * 
 * Key Features:
 * - AES-256 encrypted tokens with cryptographic nonces
 * - Session binding for secure token validation
 * - IP and User-Agent validation for enhanced security
 * - Comprehensive origin validation with configurable allowed domains
 * - Time-based token expiration with configurable TTL
 * - Detailed security logging and monitoring
 * - Clean Architecture compliance with dependency injection
 * 
 * @version 2.0.0
 * @author Professional Development Team
 * @since 2024-01-01
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as CryptoJS from 'crypto-js';
import { randomBytes } from 'crypto';
import {
  ICsrfService,
  ICsrfConfiguration,
  ICsrfTokenPayload,
  ICsrfTokenGenerationResult,
  ICsrfTokenValidationResult,
  ICsrfRequestContext,
  CsrfValidationErrorCode,
  isCsrfTokenPayload,
} from '../interfaces/csrf.interfaces';
import { CsrfErrorHandler } from '../exceptions/csrf.exceptions';

/**
 * Professional CSRF Protection Service
 * 
 * Implements comprehensive CSRF protection following security best practices.
 * Provides token generation, validation, and origin checking capabilities
 * with session binding and detailed security logging.
 * 
 * @example Basic Usage:
 * ```typescript
 * const result = await csrfService.generateToken('session-123');
 * const isValid = await csrfService.validateToken(result.token, requestContext);
 * ```
 * 
 * @example Advanced Configuration:
 * ```typescript
 * const csrfService = new CsrfService(configService, customConfig);
 * ```
 */
@Injectable()
export class CsrfService implements ICsrfService {
  private readonly logger = new Logger(CsrfService.name);
  private readonly configuration: ICsrfConfiguration;
  
  // Performance metrics for monitoring
  private readonly metrics = {
    tokensGenerated: 0,
    tokensValidated: 0,
    validationFailures: 0,
    startTime: Date.now(),
  };

  /**
   * Creates a new CSRF service instance
   * 
   * @param configService - NestJS configuration service for environment variables
   * @param customConfig - Optional custom configuration overrides
   */
  constructor(
    private readonly configService: ConfigService
  ) {
    this.configuration = this.buildConfiguration();
    this.validateConfiguration();
    this.logServiceInitialization();
  }

  /**
   * Generates a cryptographically secure CSRF token
   * 
   * Creates an encrypted token containing session information and security metadata.
   * The token is bound to the specific session and optionally to IP address 
   * and user agent for enhanced security.
   * 
   * @param sessionId - Unique session identifier (required)
   * @param ipAddress - Client IP address for IP binding (optional)
   * @param userAgent - User agent string for session binding (optional)
   * @returns Promise resolving to token generation result
   * 
   * @throws {Error} If sessionId is empty or invalid
   * 
   * @example
   * ```typescript
   * const result = await csrfService.generateToken(
   *   'user-session-123',
   *   '192.168.1.1',
   *   'Mozilla/5.0...'
   * );
   * 
   * console.log(result.token); // Encrypted CSRF token
   * console.log(result.expiresIn); // Token expiration time
   * ```
   */
  public generateToken(
    sessionId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<ICsrfTokenGenerationResult> {
    this.validateSessionId(sessionId);
    
    const generationStartTime = Date.now();
    
    try {
      const payload = this.createTokenPayload(sessionId, ipAddress, userAgent);
      const encryptedToken = this.encryptTokenPayload(payload);
      
      const result: ICsrfTokenGenerationResult = {
        token: encryptedToken,
        sessionId,
        expiresIn: this.configuration.tokenTtl,
        generatedAt: payload.issuedAt,
      };
      
      this.updateGenerationMetrics(generationStartTime);
      this.logTokenGeneration(sessionId);
      
      return Promise.resolve(result);
    } catch (error) {
      this.logTokenGenerationError(sessionId, error);
      CsrfErrorHandler.handleError(error, {
        operation: 'generateToken',
        sessionId,
      });
    }
  }

  /**
   * Validates a CSRF token against request context
   * 
   * Performs comprehensive validation including token decryption, expiration
   * checking, session binding validation, and origin validation. 
   * Returns detailed validation results.
   * 
   * @param token - CSRF token to validate (required)
   * @param context - Request context containing validation parameters (required)
   * @returns Promise resolving to detailed validation result
   * 
   * @example
   * ```typescript
   * const context: ICsrfRequestContext = {
   *   method: 'POST',
   *   contentType: 'application/json',
   *   origin: 'https://example.com',
   *   clientIp: '192.168.1.1',
   *   userAgent: 'Mozilla/5.0...',
   *   sessionId: 'user-session-123',
   *   csrfToken: token
   * };
   * 
   * const result = await csrfService.validateToken(token, context);
   * if (result.isValid) {
   *   // Proceed with request
   * } else {
   *   // Handle validation failure
   *   console.log(result.errorMessage);
   * }
   * ```
   */
  public validateToken(
    token: string,
    context: ICsrfRequestContext
  ): Promise<ICsrfTokenValidationResult> {
    const validationStartTime = Date.now();
    
    try {
      // Pre-validation checks
      if (!token || typeof token !== 'string') {
        return Promise.resolve(this.createValidationFailureResult(
          CsrfValidationErrorCode.TOKEN_MISSING,
          'CSRF token is required'
        ));
      }

      // Decrypt and parse token payload
      const payload = this.decryptAndValidateTokenPayload(token);
      if (!payload) {
        return Promise.resolve(this.createValidationFailureResult(
          CsrfValidationErrorCode.TOKEN_MALFORMED,
          'Failed to decrypt CSRF token'
        ));
      }

      // Comprehensive validation pipeline
      const validationResult = this.performComprehensiveValidation(payload, context);
      
      this.updateValidationMetrics(validationStartTime, validationResult.isValid);
      this.logTokenValidation(context.sessionId, validationResult.isValid);
      
      return Promise.resolve(validationResult);
    } catch (error) {
      this.updateValidationMetrics(validationStartTime, false);
      this.logTokenValidationError(error, context.sessionId);
      
      return Promise.resolve(this.createValidationFailureResult(
        CsrfValidationErrorCode.TOKEN_MALFORMED,
        'Token validation failed due to internal error'
      ));
    }
  }

  /**
   * Retrieves token information without consuming it
   * 
   * Analyzes a CSRF token and returns metadata about its validity,
   * expiration status, and contained information without performing
   * full validation or consuming the token.
   * 
   * @param token - CSRF token to analyze
   * @returns Promise resolving to token information
   * 
   * @example
   * ```typescript
   * const info = await csrfService.getTokenInfo(token);
   * console.log(`Token age: ${info.ageInMilliseconds}ms`);
   * console.log(`Expires in: ${info.expiresInMilliseconds}ms`);
   * console.log(`Is expired: ${info.isExpired}`);
   * ```
   */
  public getTokenInfo(token: string): Promise<ICsrfTokenValidationResult> {
    try {
      if (!token || typeof token !== 'string') {
        return Promise.resolve(this.createValidationFailureResult(
          CsrfValidationErrorCode.TOKEN_MISSING,
          'Token is required for analysis'
        ));
      }

      const payload = this.decryptAndValidateTokenPayload(token);
      if (!payload) {
        return Promise.resolve(this.createValidationFailureResult(
          CsrfValidationErrorCode.TOKEN_MALFORMED,
          'Unable to decrypt token for analysis'
        ));
      }

      const now = Date.now();
      const ageInMilliseconds = now - payload.issuedAt;
      const isExpired = now > payload.expiresAt;
      const expiresInMilliseconds = Math.max(0, payload.expiresAt - now);

      return Promise.resolve({
        isValid: !isExpired,
        ageInMilliseconds,
        isExpired,
        expiresInMilliseconds,
        errorMessage: isExpired ? 'Token has expired' : undefined,
        errorCode: isExpired ? CsrfValidationErrorCode.TOKEN_EXPIRED : undefined,
      });
    } catch (error) {
      this.logger.warn('Failed to analyze token', {
        error: CsrfErrorHandler.extractErrorInfo(error),
        tokenPrefix: token.substring(0, 10),
      });

      return Promise.resolve(this.createValidationFailureResult(
        CsrfValidationErrorCode.TOKEN_MALFORMED,
        'Token analysis failed'
      ));
    }
  }

  /**
   * Validates request origin against allowed origins
   * 
   * Performs origin validation by checking both Origin and Referer headers
   * against the configured list of allowed origins. Implements fallback
   * strategies and comprehensive security logging.
   * 
   * @param origin - Origin header value from request
   * @param referer - Referer header value from request
   * @returns True if origin is allowed, false otherwise
   * 
   * @example
   * ```typescript
   * const isValidOrigin = csrfService.validateOrigin(
   *   'https://myapp.com',
   *   'https://myapp.com/dashboard'
   * );
   * ```
   */
  public validateOrigin(origin?: string, referer?: string): boolean {
    try {
      // If no allowed origins configured, skip validation
      if (this.configuration.allowedOrigins.length === 0) {
        this.logger.debug('Origin validation skipped - no allowed origins configured');
        return true;
      }

      // Primary validation using Origin header
      if (origin) {
        const isOriginAllowed = this.isOriginInAllowedList(origin);
        if (isOriginAllowed) {
          this.logger.debug('Origin validation passed', { origin });
          return true;
        }
        
        this.logger.warn('Origin validation failed', { 
          origin, 
          allowedOrigins: this.configuration.allowedOrigins 
        });
      }

      // Fallback validation using Referer header
      if (referer) {
        const refererOrigin = this.extractOriginFromReferer(referer);
        if (refererOrigin) {
          const isRefererAllowed = this.isOriginInAllowedList(refererOrigin);
          if (isRefererAllowed) {
            this.logger.debug('Referer origin validation passed', { refererOrigin });
            return true;
          }
        }
      }

      this.logger.warn('Origin and referer validation failed', { 
        origin, 
        referer,
        allowedOrigins: this.configuration.allowedOrigins 
      });
      
      return false;
    } catch (error) {
      this.logger.error('Origin validation error', {
        error: CsrfErrorHandler.extractErrorInfo(error),
        origin,
        referer,
      });
      return false;
    }
  }

  /**
   * Validates request integrity based on HTTP method and content type
   * 
   * Ensures that state-changing requests have appropriate content types
   * and follow expected patterns. Helps prevent certain types of
   * CSRF attacks that exploit content type handling.
   * 
   * @param method - HTTP method of the request
   * @param contentType - Content-Type header value
   * @returns True if request has proper integrity, false otherwise
   * 
   * @example
   * ```typescript
   * const hasIntegrity = csrfService.validateRequestIntegrity('POST', 'application/json');
   * ```
   */
  public validateRequestIntegrity(method: string, contentType?: string): boolean {
    try {
      const normalizedMethod = method.toUpperCase();
      
      // Safe methods don't require content type validation
      const safeMethods = ['GET', 'HEAD', 'OPTIONS', 'TRACE'];
      if (safeMethods.includes(normalizedMethod)) {
        return true;
      }

      // State-changing methods require proper content type
      const stateMutatingMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
      if (stateMutatingMethods.includes(normalizedMethod)) {
        
        // DELETE requests may not have content type
        if (normalizedMethod === 'DELETE') {
          return true;
        }

        // POST, PUT, PATCH require content type
        if (!contentType) {
          this.logger.warn('Missing Content-Type for state-changing request', { method });
          return false;
        }

        // Validate against allowed content types
        const allowedContentTypes = [
          'application/json',
          'application/x-www-form-urlencoded',
          'multipart/form-data',
          'text/plain',
        ];

        const normalizedContentType = contentType.toLowerCase().split(';')[0].trim();
        const isValidContentType = allowedContentTypes.includes(normalizedContentType);
        
        if (!isValidContentType) {
          this.logger.warn('Invalid Content-Type for state-changing request', { 
            method, 
            contentType: normalizedContentType,
            allowedContentTypes 
          });
        }

        return isValidContentType;
      }

      // Unknown method - be conservative
      this.logger.warn('Unknown HTTP method encountered', { method });
      return false;
    } catch (error) {
      this.logger.error('Request integrity validation error', {
        error: CsrfErrorHandler.extractErrorInfo(error),
        method,
        contentType,
      });
      return false;
    }
  }

  /**
   * Gets service health and performance metrics
   * 
   * @returns Service health information and metrics
   */
  public getHealthMetrics(): {
    status: string;
    metrics: typeof this.metrics;
    uptime: number;
    configuration: Partial<ICsrfConfiguration>;
  } {
    return {
      status: 'healthy',
      metrics: { ...this.metrics },
      uptime: Date.now() - this.metrics.startTime,
      configuration: {
        tokenTtl: this.configuration.tokenTtl,
        allowedOrigins: this.configuration.allowedOrigins,
        debugMode: this.configuration.debugMode,
        logLevel: this.configuration.logLevel,
      },
    };
  }

  // ==================== PRIVATE METHODS ====================

  /**
   * Builds service configuration from environment and custom settings
   */
  private buildConfiguration(customConfig?: Partial<ICsrfConfiguration>): ICsrfConfiguration {
    const defaultConfig: ICsrfConfiguration = {
      secretKey: this.configService.get<string>('CSRF_SECRET_KEY') || 
                this.generateSecureDefaultKey(),
      tokenTtl: Number(this.configService.get<string>('CSRF_TOKEN_TTL')) || 3600000, // 1 hour
      allowedOrigins: this.parseAllowedOrigins(),
      debugMode: this.configService.get<boolean>('CSRF_DEBUG_MODE') || false,
      logLevel: (this.configService.get<string>('CSRF_LOG_LEVEL') as 'error' | 'warn' | 'info' | 'debug') || 'info',
    };

    return { ...defaultConfig, ...customConfig };
  }

  /**
   * Validates the service configuration
   */
  private validateConfiguration(): void {
    if (!this.configuration.secretKey || this.configuration.secretKey.length < 32) {
      throw new Error('CSRF secret key must be at least 32 characters long');
    }

    if (this.configuration.tokenTtl <= 0) {
      throw new Error('CSRF token TTL must be positive');
    }

    if (this.configuration.tokenTtl > 86400000) { // 24 hours
      this.logger.warn('CSRF token TTL is very long, consider reducing for security');
    }
  }

  /**
   * Parses allowed origins from environment configuration
   */
  private parseAllowedOrigins(): ReadonlyArray<string> {
    const originsStr = this.configService.get<string>('CSRF_ALLOWED_ORIGINS') || '';
    if (!originsStr.trim()) {
      return [];
    }

    return originsStr
      .split(',')
      .map(origin => origin.trim())
      .filter(origin => origin.length > 0);
  }

  /**
   * Generates a secure default key if none is configured
   */
  private generateSecureDefaultKey(): string {
    this.logger.warn('No CSRF secret key configured, generating temporary key');
    return randomBytes(32).toString('hex');
  }

  /**
   * Validates session ID parameter
   */
  private validateSessionId(sessionId: string): void {
    if (!sessionId || typeof sessionId !== 'string' || sessionId.trim().length === 0) {
      throw new Error('Session ID is required and must be a non-empty string');
    }
  }

  /**
   * Creates token payload with all necessary information
   */
  private createTokenPayload(
    sessionId: string,
    ipAddress?: string,
    userAgent?: string
  ): ICsrfTokenPayload {
    const now = Date.now();
    
    return {
      sessionId: sessionId.trim(),
      issuedAt: now,
      expiresAt: now + this.configuration.tokenTtl,
      nonce: randomBytes(16).toString('hex'),
      ipHash: ipAddress ? this.hashSensitiveData(ipAddress) : undefined,
      userAgentHash: userAgent ? this.hashSensitiveData(userAgent) : undefined,
    };
  }

  /**
   * Encrypts token payload using AES-256
   */
  private encryptTokenPayload(payload: ICsrfTokenPayload): string {
    const payloadJson = JSON.stringify(payload);
    const encrypted = CryptoJS.AES.encrypt(payloadJson, this.configuration.secretKey);
    return encrypted.toString();
  }

  /**
   * Decrypts and validates token payload
   */
  private decryptAndValidateTokenPayload(token: string): ICsrfTokenPayload | null {
    try {
      const decrypted = CryptoJS.AES.decrypt(token, this.configuration.secretKey);
      const payloadJson = decrypted.toString(CryptoJS.enc.Utf8);
      
      if (!payloadJson) {
        return null;
      }

      const payload = JSON.parse(payloadJson) as unknown;
      
      if (!isCsrfTokenPayload(payload)) {
        return null;
      }

      return payload;
    } catch {
      return null;
    }
  }

  /**
   * Performs comprehensive token validation
   */
  private performComprehensiveValidation(
    payload: ICsrfTokenPayload,
    context: ICsrfRequestContext
  ): ICsrfTokenValidationResult {
    // Check token expiration
    const now = Date.now();
    if (now > payload.expiresAt) {
      return this.createValidationFailureResult(
        CsrfValidationErrorCode.TOKEN_EXPIRED,
        'CSRF token has expired'
      );
    }

    // Validate session binding
    if (context.sessionId && payload.sessionId !== context.sessionId) {
      return this.createValidationFailureResult(
        CsrfValidationErrorCode.SESSION_MISMATCH,
        'Token session mismatch'
      );
    }

    // Validate IP binding if enabled
    if (payload.ipHash && context.clientIp) {
      const currentIpHash = this.hashSensitiveData(context.clientIp);
      if (payload.ipHash !== currentIpHash) {
        return this.createValidationFailureResult(
          CsrfValidationErrorCode.IP_ADDRESS_MISMATCH,
          'Token IP address mismatch'
        );
      }
    }

    // Validate User-Agent binding if enabled
    if (payload.userAgentHash && context.userAgent) {
      const currentUserAgentHash = this.hashSensitiveData(context.userAgent);
      if (payload.userAgentHash !== currentUserAgentHash) {
        return this.createValidationFailureResult(
          CsrfValidationErrorCode.USER_AGENT_MISMATCH,
          'Token user agent mismatch'
        );
      }
    }

    // Validate origin
    if (!this.validateOrigin(context.origin, context.referer)) {
      return this.createValidationFailureResult(
        CsrfValidationErrorCode.ORIGIN_FORBIDDEN,
        'Request origin not allowed'
      );
    }

    // Validate request integrity
    if (!this.validateRequestIntegrity(context.method, context.contentType)) {
      return this.createValidationFailureResult(
        CsrfValidationErrorCode.TOKEN_MALFORMED,
        'Request integrity validation failed'
      );
    }

    // All validations passed
    const ageInMilliseconds = now - payload.issuedAt;
    const expiresInMilliseconds = payload.expiresAt - now;

    return {
      isValid: true,
      ageInMilliseconds,
      isExpired: false,
      expiresInMilliseconds,
    };
  }

  /**
   * Creates a validation failure result
   */
  private createValidationFailureResult(
    errorCode: CsrfValidationErrorCode,
    errorMessage: string
  ): ICsrfTokenValidationResult {
    return {
      isValid: false,
      errorMessage,
      errorCode,
    };
  }

  /**
   * Checks if origin is in allowed list
   */
  private isOriginInAllowedList(origin: string): boolean {
    const normalizedOrigin = origin.toLowerCase();
    return this.configuration.allowedOrigins.some(allowed => 
      normalizedOrigin === allowed.toLowerCase()
    );
  }

  /**
   * Extracts origin from referer URL
   */
  private extractOriginFromReferer(referer: string): string | null {
    try {
      const url = new URL(referer);
      return `${url.protocol}//${url.host}`;
    } catch {
      return null;
    }
  }

  /**
   * Hashes sensitive data for secure storage
   */
  private hashSensitiveData(data: string): string {
    return CryptoJS.SHA256(data + this.configuration.secretKey).toString();
  }

  /**
   * Updates token generation metrics
   */
  private updateGenerationMetrics(startTime: number): void {
    this.metrics.tokensGenerated++;
    
    if (this.configuration.debugMode) {
      const duration = Date.now() - startTime;
      this.logger.debug('Token generation completed', { duration });
    }
  }

  /**
   * Updates token validation metrics
   */
  private updateValidationMetrics(startTime: number, isValid: boolean): void {
    this.metrics.tokensValidated++;
    if (!isValid) {
      this.metrics.validationFailures++;
    }
    
    if (this.configuration.debugMode) {
      const duration = Date.now() - startTime;
      this.logger.debug('Token validation completed', { duration, isValid });
    }
  }

  /**
   * Logs service initialization
   */
  private logServiceInitialization(): void {
    this.logger.log('CSRF service initialized', {
      tokenTtl: this.configuration.tokenTtl,
      allowedOriginsCount: this.configuration.allowedOrigins.length,
      debugMode: this.configuration.debugMode,
    });
  }

  /**
   * Logs token generation
   */
  private logTokenGeneration(sessionId: string): void {
    if (this.configuration.logLevel === 'debug' || this.configuration.debugMode) {
      this.logger.debug('CSRF token generated', {
        sessionId: sessionId.substring(0, 8) + '...',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Logs token validation
   */
  private logTokenValidation(sessionId?: string, isValid?: boolean): void {
    if (this.configuration.logLevel === 'debug' || this.configuration.debugMode) {
      this.logger.debug('CSRF token validated', {
        sessionId: sessionId?.substring(0, 8) + '...',
        isValid,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Logs token generation errors
   */
  private logTokenGenerationError(sessionId: string, error: unknown): void {
    this.logger.error('CSRF token generation failed', {
      sessionId: sessionId.substring(0, 8) + '...',
      error: CsrfErrorHandler.extractErrorInfo(error),
    });
  }

  /**
   * Logs token validation errors
   */
  private logTokenValidationError(error: unknown, sessionId?: string): void {
    this.logger.error('CSRF token validation failed', {
      sessionId: sessionId?.substring(0, 8) + '...',
      error: CsrfErrorHandler.extractErrorInfo(error),
    });
  }

  /**
   * Synchronous token validation for guard compatibility
   * 
   * Provides a simplified synchronous validation method for use in guards
   * that cannot handle async operations. This method performs basic token
   * validation without some of the advanced features of the async version.
   * 
   * @param token - CSRF token to validate
   * @param sessionId - Session identifier
   * @returns boolean indicating if token is valid
   * 
   * @example
   * ```typescript
   * const isValid = csrfService.validateTokenSync(token, sessionId);
   * if (!isValid) {
   *   throw new CsrfTokenMalformedException();
   * }
   * ```
   */
  public validateTokenSync(
    token: string,
    sessionId: string
  ): boolean {
    console.log(`[CSRF DEBUG] Validating token sync - SessionId: ${sessionId}`);
    console.log(`[CSRF DEBUG] Received token: ${token?.substring(0, 20)}...`);
    
    try {
      // Basic input validation
      if (!token || typeof token !== 'string') {
        console.log(`[CSRF DEBUG] Invalid token - type: ${typeof token}, empty: ${!token}`);
        return false;
      }

      if (!sessionId || typeof sessionId !== 'string') {
        console.log(`[CSRF DEBUG] Invalid sessionId - type: ${typeof sessionId}, empty: ${!sessionId}`);
        return false;
      }

      // Use the same decryption method as the async version
      const payload = this.decryptAndValidateTokenPayload(token);
      if (!payload) {
        console.log(`[CSRF DEBUG] Failed to decrypt token payload`);
        return false;
      }
      
      console.log(`[CSRF DEBUG] Decrypted payload:`, {
        sessionId: payload.sessionId,
        issuedAt: new Date(payload.issuedAt),
        expiresAt: new Date(payload.expiresAt)
      });

      // Check token expiration
      const now = Date.now();
      if (now > payload.expiresAt) {
        console.log(`[CSRF DEBUG] Token expired - now: ${new Date(now).toISOString()}, expiresAt: ${new Date(payload.expiresAt).toISOString()}`);
        return false;
      }

      // Validate session binding
      if (payload.sessionId !== sessionId) {
        console.log(`[CSRF DEBUG] Session mismatch - payload: ${payload.sessionId}, provided: ${sessionId}`);
        return false;
      }

      console.log(`[CSRF DEBUG] Token validation successful`);
      return true;
    } catch (error) {
      console.log(`[CSRF DEBUG] Validation error:`, (error as Error).message || 'Unknown error');
      this.logger.error('Synchronous token validation error', {
        error: CsrfErrorHandler.extractErrorInfo(error),
        sessionId,
      });
      return false;
    }
  }
}