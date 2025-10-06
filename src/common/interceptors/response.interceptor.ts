import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

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
 * Global response interceptor that standardizes all successful API responses
 * 
 * This interceptor wraps all successful responses in a consistent format,
 * adding metadata like success status and timestamp. It works in conjunction
 * with the AllExceptionsFilter to provide uniform response structures.
 * 
 * @class ResponseInterceptor
 * @template T - The type of data being intercepted
 * @implements NestInterceptor
 */
@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  /**
   * Intercepts and transforms successful responses
   * @param context - Execution context (not used in this implementation)
   * @param next - Next call handler in the chain
   * @returns Observable with transformed response wrapped in ApiResponse structure
   */
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((data: T) => ({
        success: true,
        data,
        timestamp: new Date().toISOString(),
      })),
    );
  }
}