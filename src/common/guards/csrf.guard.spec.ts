/**
 * @fileoverview Unit Tests for CsrfGuard
 * 
 * This test suite provides basic coverage for the CSRF guard functionality.
 * 
 * @version 1.0.0
 * @author Professional Test Team
 */

 
 
 
 
 

import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { CsrfGuard } from './csrf.guard';
import { CsrfService } from '../services/csrf.service';
import {
  CsrfTokenMissingException,
  CsrfTokenMalformedException,
} from '../exceptions/csrf.exceptions';

describe('CsrfGuard', () => {
  let guard: CsrfGuard;
  let mockCsrfService: any;

  const createMockCsrfService = () => ({
    validateToken: jest.fn(),
    validateTokenSync: jest.fn(),
    validateOrigin: jest.fn(),
    validateRequestIntegrity: jest.fn(),
  });

  const mockReflector = {
    get: jest.fn(),
    getAllAndOverride: jest.fn(),
  };

  const createMockContext = (request: any, response: any = {}): any => ({
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => response,
      getNext: () => jest.fn(),
    }),
    getHandler: () => jest.fn(),
    getClass: () => class MockClass {},
    switchToRpc: () => ({
      getData: () => ({}),
      getContext: () => ({}),
    }),
    switchToWs: () => ({
      getData: () => ({}),
      getClient: () => ({}),
      getPattern: () => '',
    }),
    getArgByIndex: () => ({}),
    getArgs: () => [],
    getType: () => 'http',
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    mockCsrfService = createMockCsrfService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CsrfGuard,
        {
          provide: CsrfService,
          useValue: mockCsrfService,
        },
        {
          provide: Reflector,
          useValue: mockReflector,
        },
      ],
    }).compile();

    guard = module.get<CsrfGuard>(CsrfGuard);
  });

  describe('Guard Initialization', () => {
    it('should be defined', () => {
      expect(guard).toBeDefined();
    });

    it('should initialize with dependencies', () => {
      expect(guard).toBeInstanceOf(CsrfGuard);
    });
  });

  describe('canActivate - Basic Functionality', () => {
    it('should allow safe HTTP methods (GET)', () => {
      const request = { method: 'GET' };
      const mockContext = createMockContext(request);
      
      const result = guard.canActivate(mockContext);
      
      expect(result).toBe(true);
    });

    it('should allow HEAD requests', () => {
      const request = { method: 'HEAD' };
      const mockContext = createMockContext(request);
      
      const result = guard.canActivate(mockContext);
      
      expect(result).toBe(true);
    });

    it('should allow OPTIONS requests', () => {
      const request = { method: 'OPTIONS' };
      const mockContext = createMockContext(request);
      
      const result = guard.canActivate(mockContext);
      
      expect(result).toBe(true);
    });

    it('should validate CSRF for unsafe methods (POST)', () => {
      const request = {
        method: 'POST',
        headers: { 'x-csrf-token': 'valid-token' },
        session: { id: 'test-session' },
        body: {},
        query: {}
      };
      const mockContext = createMockContext(request);
      
      mockCsrfService.validateTokenSync.mockReturnValue(true);
      
      const result = guard.canActivate(mockContext);
      
      expect(result).toBe(true);
      expect(mockCsrfService.validateTokenSync).toHaveBeenCalled();
    });

    it('should throw exception when no token is found', () => {
      const request = {
        method: 'POST',
        headers: {},
        session: { id: 'test-session' },
        body: {},
        query: {}
      };
      const mockContext = createMockContext(request);
      
      expect(() => guard.canActivate(mockContext)).toThrow(CsrfTokenMissingException);
    });

    it('should handle token validation failure', () => {
      const request = {
        method: 'POST',
        headers: { 'x-csrf-token': 'invalid-token' },
        session: { id: 'test-session' },
        body: {},
        query: {}
      };
      const mockContext = createMockContext(request);
      
      mockCsrfService.validateTokenSync.mockReturnValue(false);
      
      expect(() => guard.canActivate(mockContext)).toThrow(CsrfTokenMalformedException);
    });

    it('should extract token from header', () => {
      const request = {
        method: 'POST',
        headers: { 'x-csrf-token': 'valid-token' },
        session: { id: 'test-session' },
        body: {},
        query: {}
      };
      const mockContext = createMockContext(request);
      
      mockCsrfService.validateTokenSync.mockReturnValue(true);
      
      guard.canActivate(mockContext);
      
      expect(mockCsrfService.validateTokenSync).toHaveBeenCalledWith(
        'valid-token',
        'test-session',
        ''
      );
    });

    it('should handle missing session gracefully', () => {
      const request = {
        method: 'POST',
        headers: { 'x-csrf-token': 'valid-token' },
        body: {},
        query: {}
      };
      const mockContext = createMockContext(request);
      
      mockCsrfService.validateTokenSync.mockReturnValue(true);
      
      guard.canActivate(mockContext);
      
      expect(mockCsrfService.validateTokenSync).toHaveBeenCalledWith(
        'valid-token',
        '',
        ''
      );
    });

    it('should handle service errors', () => {
      const request = {
        method: 'POST',
        headers: { 'x-csrf-token': 'valid-token' },
        session: { id: 'test-session' },
        body: {},
        query: {}
      };
      const mockContext = createMockContext(request);
      
      mockCsrfService.validateTokenSync.mockImplementation(() => {
        throw new Error('Service error');
      });
      
      const result = guard.canActivate(mockContext);
      
      expect(result).toBe(false);
    });
  });
});