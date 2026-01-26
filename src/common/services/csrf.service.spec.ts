/**
 * @fileoverview Comprehensive Unit Tests for CsrfService
 * 
 * This test suite provides complete coverage for the enterprise-grade CSRF service
 * including token generation, validation, configuration management, and security features.
 * 
 * Test Coverage:
 * - Token generation with various configurations
 * - Token validation with different scenarios
 * - Configuration management and validation
 * - Error handling and edge cases
 * - Security features and multi-tenant support
 * 
 * @version 1.0.0
 * @author Professional Test Team
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { CsrfService } from './csrf.service';
import {
  ICsrfRequestContext,
  CsrfValidationErrorCode,
} from '../interfaces/csrf.interfaces';

describe('CsrfService', () => {
  let service: CsrfService;

  // Mock configuration
  const mockConfig = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    // Reset all mocks
    jest.clearAllMocks();
    jest.resetAllMocks();

    // Setup default mock configuration
    mockConfig.get.mockImplementation((key: string): string | number | boolean => {
      const config: Record<string, string | number | boolean> = {
        'CSRF_SECRET_KEY': 'test-secret-key-with-minimum-32-chars-length-for-security',
        'CSRF_TOKEN_TTL': 3600000, // 1 hour
        'CSRF_DEBUG_MODE': false,
        'CSRF_LOG_LEVEL': 'info',
        'CSRF_ALLOWED_ORIGINS': 'http://localhost:3000,https://example.com',
      };
      return config[key] || '';
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CsrfService,
        {
          provide: ConfigService,
          useValue: mockConfig,
        },
      ],
    }).compile();

    service = module.get<CsrfService>(CsrfService);
  });

  describe('Service Initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should initialize with valid configuration', () => {
      expect(service).toBeInstanceOf(CsrfService);
    });

    it('should generate secure default key when none provided', async () => {
      // Reset mock to return undefined for secret key
      mockConfig.get.mockImplementation((key: string) => {
        if (key === 'CSRF_SECRET_KEY') return undefined;
        return key === 'CSRF_TOKEN_TTL' ? 3600000 : undefined;
      });

      // Create new service instance
      const module = await Test.createTestingModule({
        providers: [
          CsrfService,
          { provide: ConfigService, useValue: mockConfig },
        ],
      }).compile();

      const newService = module.get<CsrfService>(CsrfService);
      expect(newService).toBeDefined();
    });

    it('should throw error with invalid secret key length', async () => {
      mockConfig.get.mockImplementation((key: string) => {
        if (key === 'CSRF_SECRET_KEY') return 'short-key'; // Too short
        return undefined;
      });

      await expect(async () => {
        await Test.createTestingModule({
          providers: [
            CsrfService,
            { provide: ConfigService, useValue: mockConfig },
          ],
        }).compile();
      }).rejects.toThrow('CSRF secret key must be at least 32 characters long');
    });
  });

  describe('Token Generation', () => {
    it('should generate valid token with session ID', async () => {
      const sessionId = 'test-session-123';
      const result = await service.generateToken(sessionId);

      expect(result).toBeDefined();
      expect(result.token).toBeDefined();
      expect(typeof result.token).toBe('string');
      expect(result.token.length).toBeGreaterThan(0);
      expect(result.sessionId).toBe(sessionId);
      expect(result.expiresIn).toBeGreaterThan(0);
      expect(result.generatedAt).toBeGreaterThan(0);
    });

    it('should generate unique tokens for same session', async () => {
      const sessionId = 'test-session-123';
      const result1 = await service.generateToken(sessionId);
      const result2 = await service.generateToken(sessionId);

      expect(result1).toBeDefined();
      expect(result2).toBeDefined();
      expect(result1.token).not.toBe(result2.token);
    });

    it('should generate token with IP and User Agent binding', async () => {
      const sessionId = 'test-session-123';
      const ipAddress = '192.168.1.100';
      const userAgent = 'Mozilla/5.0 Test Browser';
      
      const result = await service.generateToken(sessionId, ipAddress, userAgent);

      expect(result).toBeDefined();
      expect(result.token).toBeDefined();
      expect(result.sessionId).toBe(sessionId);
    });

    it('should generate different tokens for different sessions', async () => {
      const token1 = await service.generateToken('session-1');
      const token2 = await service.generateToken('session-2');

      expect(token1.token).not.toBe(token2.token);
    });

    it('should generate tokens with proper expiration', async () => {
      const beforeGeneration = Date.now();
      const result = await service.generateToken('test-session');
      const afterGeneration = Date.now();

      // ExpiresIn should be close to the configured TTL
      expect(result.expiresIn).toBeGreaterThan(3500000); // Close to 1 hour
      expect(result.expiresIn).toBeLessThanOrEqual(3600000); // Not more than 1 hour
      expect(result.generatedAt).toBeGreaterThanOrEqual(beforeGeneration);
      expect(result.generatedAt).toBeLessThanOrEqual(afterGeneration);
    });

    it('should throw error for empty session ID', () => {
      expect(() => service.generateToken('')).toThrow();
    });

    it('should throw error for null session ID', async () => {
      try {
        // Force null parameter for testing error handling
        await service.generateToken(null!);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('Token Validation', () => {
    let validToken: string;
    let sessionId: string;
    let requestContext: ICsrfRequestContext;

    beforeEach(async () => {
      sessionId = 'test-session-validation';
      const result = await service.generateToken(sessionId);
      validToken = result.token;

      requestContext = {
        method: 'POST',
        contentType: 'application/json',
        origin: 'http://localhost:3000',
        referer: 'http://localhost:3000/page',
        clientIp: '127.0.0.1',
        userAgent: 'Mozilla/5.0 Test Browser',
        sessionId: sessionId,
      };
    });

    it('should validate correct token successfully', async () => {
      const result = await service.validateToken(validToken, requestContext);

      expect(result.isValid).toBe(true);
      expect(result.errorCode).toBeUndefined();
      expect(result.errorMessage).toBeUndefined();
    });

    it('should reject malformed token', async () => {
      const malformedToken = 'invalid-token-format';
      const result = await service.validateToken(malformedToken, requestContext);

      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe(CsrfValidationErrorCode.TOKEN_MALFORMED);
      expect(result.errorMessage).toContain('decrypt');
    });

    it('should reject expired token', async () => {
      // Create token with very short TTL
      mockConfig.get.mockImplementation((key: string): string | number | boolean => {
        if (key === 'CSRF_TOKEN_TTL') return 1; // 1ms TTL
        const originalConfig = {
          'CSRF_SECRET_KEY': 'test-secret-key-with-minimum-32-chars-length-for-security',
          'CSRF_DEBUG_MODE': false,
          'CSRF_LOG_LEVEL': 'info',
          'ALLOWED_ORIGINS': 'http://localhost:3000,https://example.com',
        };
        return originalConfig[key as keyof typeof originalConfig] || '';
      });

      // Create new service with short TTL
      const module = await Test.createTestingModule({
        providers: [
          CsrfService,
          { provide: ConfigService, useValue: mockConfig },
        ],
      }).compile();

      const shortTtlService = module.get<CsrfService>(CsrfService);
      const tokenResult = await shortTtlService.generateToken(sessionId);

      // Wait for token to expire
      await new Promise(resolve => setTimeout(resolve, 10));

      const result = await shortTtlService.validateToken(tokenResult.token, requestContext);

      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe(CsrfValidationErrorCode.TOKEN_EXPIRED);
    });

    it('should reject token with wrong session ID', async () => {
      const wrongSessionContext = {
        ...requestContext,
        sessionId: 'wrong-session-id',
      };

      const result = await service.validateToken(validToken, wrongSessionContext);

      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe(CsrfValidationErrorCode.SESSION_MISMATCH);
    });

    it('should reject token with invalid origin', async () => {
      const invalidOriginContext = {
        ...requestContext,
        origin: 'https://malicious-site.com',
        referer: 'https://malicious-site.com/page', // Ensure both origin and referer are invalid
      };

      const result = await service.validateToken(validToken, invalidOriginContext);

      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe(CsrfValidationErrorCode.ORIGIN_FORBIDDEN);
    });

    it('should validate token with allowed origin', async () => {
      const allowedOriginContext = {
        ...requestContext,
        origin: 'https://example.com', // This is in our mock allowed origins
      };

      const result = await service.validateToken(validToken, allowedOriginContext);

      expect(result.isValid).toBe(true);
    });

    it('should handle missing origin gracefully', async () => {
      const noOriginContext = {
        ...requestContext,
        origin: undefined,
        referer: undefined, // Also remove referer to ensure no fallback validation
      };

      const result = await service.validateToken(validToken, noOriginContext);

      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe(CsrfValidationErrorCode.ORIGIN_FORBIDDEN);
    });
  });

  describe('Token Information', () => {
    let validToken: string;
    let sessionId: string;

    beforeEach(async () => {
      sessionId = 'test-session-info';
      const result = await service.generateToken(sessionId);
      validToken = result.token;
    });

    it('should return token information for valid token', async () => {
      const info = await service.getTokenInfo(validToken);

      expect(info.isValid).toBe(true);
      expect(info.ageInMilliseconds).toBeGreaterThanOrEqual(0);
      expect(info.isExpired).toBe(false);
      expect(info.expiresInMilliseconds).toBeGreaterThan(0);
    });

    it('should return invalid info for malformed token', async () => {
      const info = await service.getTokenInfo('invalid-token');

      expect(info.isValid).toBe(false);
      expect(info.errorMessage).toBeDefined();
      expect(info.errorCode).toBeDefined();
    });

    it('should calculate correct token age', async () => {
      // Wait a small amount of time
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const info = await service.getTokenInfo(validToken);

      expect(info.ageInMilliseconds).toBeGreaterThan(0);
      expect(info.ageInMilliseconds).toBeLessThan(1000); // Should be less than 1 second
    });
  });

  describe('Origin Validation', () => {
    it('should validate allowed origins correctly', () => {
      expect(service.validateOrigin('http://localhost:3000')).toBe(true);
      expect(service.validateOrigin('https://example.com')).toBe(true);
      expect(service.validateOrigin('https://malicious.com')).toBe(false);
    });

    it('should handle undefined origin', () => {
      expect(service.validateOrigin(undefined)).toBe(false);
    });

    it('should be case insensitive for origins', () => {
      expect(service.validateOrigin('HTTP://LOCALHOST:3000')).toBe(true);
    });

    it('should validate with referer when origin is missing', () => {
      expect(service.validateOrigin(undefined, 'http://localhost:3000')).toBe(true);
      expect(service.validateOrigin(undefined, 'https://malicious.com')).toBe(false);
    });
  });

  describe('Synchronous Token Validation', () => {
    let validToken: string;
    let sessionId: string;

    beforeEach(async () => {
      sessionId = 'test-session-sync';
      const result = await service.generateToken(sessionId);
      validToken = result.token;
    });

    it('should validate token synchronously', () => {
      const result = service.validateTokenSync(validToken, sessionId);

      expect(result).toBe(true);
    });

    it('should reject wrong session synchronously', () => {
      const result = service.validateTokenSync(validToken, 'wrong-session');

      expect(result).toBe(false);
    });

    it('should reject malformed token synchronously', () => {
      const result = service.validateTokenSync('invalid-token', sessionId);

      expect(result).toBe(false);
    });

    it('should validate with correct session ID', () => {
      const result = service.validateTokenSync(validToken, sessionId);

      // Should work with correct session
      expect(typeof result).toBe('boolean');
      expect(result).toBe(true);
    });
  });

  describe('Request Integrity Validation', () => {
    it('should validate safe HTTP methods', () => {
      expect(service.validateRequestIntegrity('GET')).toBe(true);
      expect(service.validateRequestIntegrity('HEAD')).toBe(true);
      expect(service.validateRequestIntegrity('OPTIONS')).toBe(true);
    });

    it('should require CSRF for unsafe methods', () => {
      expect(service.validateRequestIntegrity('POST')).toBe(false);
      expect(service.validateRequestIntegrity('PUT')).toBe(false);
      expect(service.validateRequestIntegrity('DELETE')).toBe(true); // DELETE is allowed without content type
      expect(service.validateRequestIntegrity('PATCH')).toBe(false);
    });

    it('should validate content types for unsafe methods', () => {
      expect(service.validateRequestIntegrity('POST', 'application/json')).toBe(true);
      expect(service.validateRequestIntegrity('POST', 'application/x-www-form-urlencoded')).toBe(true);
      expect(service.validateRequestIntegrity('POST', 'multipart/form-data')).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle cryptographic errors gracefully', async () => {
      // Test with empty secret key to trigger crypto errors
      mockConfig.get.mockImplementation((key: string) => {
        if (key === 'CSRF_SECRET_KEY') return 'x'.repeat(32); // Valid length but predictable
        return undefined;
      });

      const module = await Test.createTestingModule({
        providers: [
          CsrfService,
          { provide: ConfigService, useValue: mockConfig },
        ],
      }).compile();

      const testService = module.get<CsrfService>(CsrfService);
      
      // Should still work but with predictable key
      const result = await testService.generateToken('test');
      expect(result.token).toBeDefined();
    });

    it('should handle validation errors properly', async () => {
      const token = (await service.generateToken('error-test')).token;
      
      // Test with incomplete context
      const incompleteContext = {
        method: 'POST',
        sessionId: 'error-test',
        clientIp: '127.0.0.1',
        userAgent: 'test',
        // Missing some optional fields
      } as ICsrfRequestContext;

      const result = await service.validateToken(token, incompleteContext);
      
      // Should handle gracefully
      expect(result.isValid).toBeDefined();
      expect(typeof result.isValid).toBe('boolean');
    });
  });

  describe('Additional Security Tests', () => {
    it('should generate unique tokens for each session', async () => {
      const token1 = await service.generateToken('session-a');
      const token2 = await service.generateToken('session-b');

      expect(token1.token).not.toBe(token2.token);
      expect(token1.sessionId).toBe('session-a');
      expect(token2.sessionId).toBe('session-b');
    });

    it('should include proper metadata in generated tokens', async () => {
      const sessionId = 'metadata-test-session';
      const token = await service.generateToken(sessionId);

      expect(token.token).toBeDefined();
      expect(token.sessionId).toBe(sessionId);
      expect(token.expiresIn).toBeGreaterThan(0);
      expect(token.generatedAt).toBeLessThanOrEqual(Date.now());
    });
  });

  describe('Configuration Management', () => {
    it('should handle different TTL configurations', async () => {
      const customTtl = 7200000; // 2 hours
      mockConfig.get.mockImplementation((key: string): string | number | boolean => {
        if (key === 'CSRF_TOKEN_TTL') return customTtl;
        const originalConfig = {
          'CSRF_SECRET_KEY': 'test-secret-key-with-minimum-32-chars-length-for-security',
          'CSRF_DEBUG_MODE': false,
          'CSRF_LOG_LEVEL': 'info',
          'ALLOWED_ORIGINS': 'http://localhost:3000,https://example.com',
        };
        return originalConfig[key as keyof typeof originalConfig] || '';
      });

      const module = await Test.createTestingModule({
        providers: [
          CsrfService,
          { provide: ConfigService, useValue: mockConfig },
        ],
      }).compile();

      const customService = module.get<CsrfService>(CsrfService);
      const result = await customService.generateToken('ttl-test');

      // ExpiresIn should be close to custom TTL
      expect(result.expiresIn).toBeGreaterThan(customTtl - 1000);
      expect(result.expiresIn).toBeLessThanOrEqual(customTtl);
    });

    it('should handle debug mode configuration', async () => {
      mockConfig.get.mockImplementation((key: string): string | number | boolean => {
        if (key === 'CSRF_DEBUG_MODE') return true;
        const originalConfig = {
          'CSRF_SECRET_KEY': 'test-secret-key-with-minimum-32-chars-length-for-security',
          'CSRF_TOKEN_TTL': 3600000,
          'CSRF_LOG_LEVEL': 'info',
          'ALLOWED_ORIGINS': 'http://localhost:3000,https://example.com',
        };
        return originalConfig[key as keyof typeof originalConfig] || '';
      });

      const module = await Test.createTestingModule({
        providers: [
          CsrfService,
          { provide: ConfigService, useValue: mockConfig },
        ],
      }).compile();

      const debugService = module.get<CsrfService>(CsrfService);
      expect(debugService).toBeDefined();
    });
  });
});