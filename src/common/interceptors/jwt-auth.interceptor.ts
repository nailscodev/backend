import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { Request } from 'express';
import * as jwt from 'jsonwebtoken';
import { InjectModel } from '@nestjs/sequelize';
import { createHash } from 'crypto';
import { UserTokenEntity } from '../../users/infrastructure/persistence/entities/user-token.entity';
import { UserEntity } from '../../users/infrastructure/persistence/entities/user.entity';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { REQUIRE_AUTH_KEY } from '../decorators/require-auth.decorator';

/**
 * Extended Express Request with user information
 */
export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    username: string;
    email: string;
    role: string;
  };
}

/**
 * JWT Authentication Interceptor
 * 
 * Automatically protects all POST, PUT, PATCH, and DELETE requests by validating
 * JWT tokens. GET and OPTIONS requests are allowed without authentication.
 * 
 * The interceptor:
 * 1. Extracts JWT token from Authorization header (Bearer token)
 * 2. Validates token signature and expiration
 * 3. Verifies token exists in database (not revoked)
 * 4. Checks user is active
 * 5. Attaches user information to request object
 * 
 * Public endpoints can be excluded by adding them to the publicEndpoints array.
 * 
 * @class JwtAuthInterceptor
 * @implements {NestInterceptor}
 */
@Injectable()
export class JwtAuthInterceptor implements NestInterceptor {
  private readonly logger = new Logger(JwtAuthInterceptor.name);

  // In-memory TTL cache: avoids a DB round-trip on every authenticated request.
  // Key: SHA-256 hash of the raw Bearer token.
  // TTL: 60 s — a revoked token may still pass for up to 1 minute (acceptable tradeoff).
  // On explicit logout the entry is removed immediately via invalidateCachedToken().
  private readonly tokenCache = new Map<string, {
    user: { id: number; username: string; email: string; role: string };
    expiresAt: number;
  }>();
  private readonly CACHE_TTL_MS = 60_000;
  private readonly MAX_CACHE_SIZE = 1_000;

  private getCachedUser(tokenHash: string) {
    const entry = this.tokenCache.get(tokenHash);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.tokenCache.delete(tokenHash);
      return null;
    }
    return entry.user;
  }

  private setCachedUser(tokenHash: string, user: { id: number; username: string; email: string; role: string }) {
    if (this.tokenCache.size >= this.MAX_CACHE_SIZE) {
      // Evict oldest entry (insertion order)
      const firstKey = this.tokenCache.keys().next().value;
      if (firstKey !== undefined) this.tokenCache.delete(firstKey);
    }
    this.tokenCache.set(tokenHash, { user, expiresAt: Date.now() + this.CACHE_TTL_MS });
  }

  /** Call this when a token is explicitly revoked (logout). */
  invalidateCachedToken(tokenHash: string) {
    this.tokenCache.delete(tokenHash);
  }

  /**
   * Endpoints that don't require authentication
   * Add paths that should be public here
   */
  private readonly publicEndpoints: string[] = [
    '/auth/login',
    '/auth/register',
    '/health',
    '/csrf/token',
  ];

  constructor(
    private readonly reflector: Reflector,
    @InjectModel(UserTokenEntity)
    private readonly userTokenModel: typeof UserTokenEntity,
    @InjectModel(UserEntity)
    private readonly userModel: typeof UserEntity,
  ) {}

  /**
   * Intercepts incoming requests to validate JWT for protected methods
   * @param context - Execution context containing request information
   * @param next - Next call handler in the interceptor chain
   * @returns Observable that continues the request processing
   * @throws {UnauthorizedException} If token is missing, invalid, or revoked
   */
  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const method = request.method.toUpperCase();

    // Check if endpoint is marked as public using @Public() decorator
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Check if endpoint requires authentication using @RequireAuth() decorator
    const requiresAuth = this.reflector.getAllAndOverride<boolean>(REQUIRE_AUTH_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return next.handle();
    }

    // Check if endpoint is public via path
    if (this.isPublicEndpoint(request.path)) {
      return next.handle();
    }

    // Require authentication if:
    // 1. Method is POST, PUT, PATCH, DELETE (default behavior)
    // 2. Endpoint has @RequireAuth() decorator (for GET/OPTIONS that need auth)
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) || requiresAuth) {
      await this.validateJwtToken(request);
    }

    return next.handle();
  }

  /**
   * Checks if the request path is a public endpoint
   * @param path - Request path
   * @returns True if endpoint is public, false otherwise
   */
  private isPublicEndpoint(path: string): boolean {
    return this.publicEndpoints.some(endpoint => 
      path.startsWith(endpoint) || path === endpoint
    );
  }

  /**
   * Validates JWT token from request headers
   * @param request - Express request object
   * @throws {UnauthorizedException} If token is missing, invalid, or revoked
   */
  private async validateJwtToken(request: AuthenticatedRequest): Promise<void> {
    // Extract token from Authorization header
    const authHeader = request.headers.authorization;
    
    if (!authHeader) {
      this.logger.warn(`Unauthorized ${request.method} request to ${request.path}: Missing Authorization header`);
      throw new UnauthorizedException('Authorization header is required for this request');
    }

    if (!authHeader.startsWith('Bearer ')) {
      this.logger.warn(`Unauthorized ${request.method} request to ${request.path}: Invalid Authorization format`);
      throw new UnauthorizedException('Authorization header must be in format: Bearer <token>');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!token) {
      this.logger.warn(`Unauthorized ${request.method} request to ${request.path}: Empty token`);
      throw new UnauthorizedException('JWT token is required');
    }

    try {
      // Verify JWT signature and decode
      const secret = process.env.JWT_SECRET;
      if (!secret) throw new Error('JWT_SECRET environment variable is required');
      const decoded = jwt.verify(token, secret) as {
        sub: string; // userId as UUID string
        username: string;
        email: string;
        role: string;
      };

      // Hash the token to compare with database
      const tokenHash = this.hashToken(token);

      // Cache-first lookup — skip DB on cache hit (cache TTL: 60 s)
      const cachedUser = this.getCachedUser(tokenHash);
      if (cachedUser) {
        request.user = cachedUser;
        this.logger.debug(`[cache hit] Authenticated user ${cachedUser.username} for ${request.method} ${request.path}`);
        return;
      }

      // Cache miss — query DB
      const userToken = await this.userTokenModel.findOne({
        where: {
          userId: decoded.sub,
          token: tokenHash,
          revoked: false,
        },
        include: [{
          model: this.userModel,
          as: 'user',
          attributes: ['id', 'username', 'email', 'role', 'isActive'],
        }],
      });

      if (!userToken) {
        this.logger.warn(`Token not found or revoked for user ${decoded.sub}`);
        throw new UnauthorizedException('Invalid or revoked token');
      }

      // Check if token is expired
      if (userToken.expiresAt && new Date() > userToken.expiresAt) {
        this.logger.warn(`Expired token for user ${decoded.sub}`);
        throw new UnauthorizedException('Token has expired');
      }

      // Check if user is active
      const user = userToken.user as UserEntity;
      if (!user || !user.isActive) {
        this.logger.warn(`Inactive user ${decoded.sub} attempted to access protected endpoint`);
        throw new UnauthorizedException('User account is inactive');
      }

      const userPayload = {
        id: parseInt(user.id, 10),
        username: user.username,
        email: user.email,
        role: user.role,
      };

      // Populate cache for subsequent requests with this token
      this.setCachedUser(tokenHash, userPayload);

      // Attach user information to request
      request.user = userPayload;

      this.logger.debug(`Authenticated user ${user.username} for ${request.method} ${request.path}`);

    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      // Handle JWT verification errors
      if (error instanceof jwt.JsonWebTokenError) {
        this.logger.warn(`Invalid JWT token: ${error.message}`);
        throw new UnauthorizedException('Invalid token');
      }

      if (error instanceof jwt.TokenExpiredError) {
        this.logger.warn('JWT token has expired');
        throw new UnauthorizedException('Token has expired');
      }

      this.logger.error('Error validating JWT token', error);
      throw new UnauthorizedException('Authentication failed');
    }
  }

  /**
   * Hashes a token using SHA-256
   * @param token - Token to hash
   * @returns Hashed token
   */
  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
