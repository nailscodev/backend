import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';

/**
 * Interface defining the structure of successful API responses
 * @interface ApiResponse
 * @template T - The type of data being returned
 */
export interface ApiResponse<T> {
  /** Indicates the request was successful */
  success: boolean;
  /** The actual response data */
  data: T;
  /** Optional message (for future use) */
  message?: string;
  /** ISO timestamp when the response was generated */
  timestamp: string;
}

/**
 * Interface for paginated responses that should be returned as-is
 */
interface PaginatedResponse {
  data: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Decorator to skip response wrapping for specific endpoints
 */
export const SkipResponseWrapper = Reflector.createDecorator<boolean>();

/**
 * Global response interceptor that standardizes all successful API responses
 * 
 * This interceptor wraps all successful responses in a consistent format,
 * adding metadata like success status and timestamp. It can skip wrapping
 * for endpoints that return paginated data or when explicitly marked.
 * 
 * @class ResponseInterceptor
 * @template T - The type of data being intercepted
 * @implements NestInterceptor
 */
@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiResponse<T> | T> {
  constructor(private reflector: Reflector) { }

  /**
   * Intercepts and transforms successful responses
   * @param context - Execution context to check for metadata
   * @param next - Next call handler in the chain
   * @returns Observable with transformed response
   */
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T> | T> {
    const skipWrapper = this.reflector.getAllAndOverride<boolean>(
      SkipResponseWrapper,
      [context.getHandler(), context.getClass()],
    );

    return next.handle().pipe(
      map((data: T) => {
        // Skip wrapping if explicitly marked
        if (skipWrapper) {
          return data;
        }

        // Skip wrapping for paginated responses (they already have proper structure)
        if (this.isPaginatedResponse(data)) {
          return data;
        }

        // Skip wrapping for arrays (frontend expects direct arrays for services)
        if (Array.isArray(data)) {
          return data;
        }

        // Default: wrap in ApiResponse structure
        return {
          success: true,
          data,
          timestamp: new Date().toISOString(),
        } as ApiResponse<T>;
      }),
    );
  }

  /**
   * Checks if the response is a paginated response structure
   * @param data - Response data to check
   * @returns boolean indicating if it's a paginated response
   */
  private isPaginatedResponse(data: unknown): data is PaginatedResponse {
    if (!data || typeof data !== 'object') {
      return false;
    }

    const obj = data as Record<string, unknown>;

    return (
      'data' in obj &&
      'total' in obj &&
      'page' in obj &&
      'limit' in obj &&
      'totalPages' in obj &&
      Array.isArray(obj.data) &&
      typeof obj.total === 'number' &&
      typeof obj.page === 'number' &&
      typeof obj.limit === 'number' &&
      typeof obj.totalPages === 'number'
    );
  }
}