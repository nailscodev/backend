import { applyDecorators } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

/**
 * Decorator for strict rate limiting on sensitive endpoints
 * Rate: 5 requests per 15 minutes (900 seconds)
 * Use for: Authentication, account creation, password reset
 */
export const StrictThrottle = () => applyDecorators(
  Throttle({ default: { limit: 5, ttl: 900000 } }) // 15 minutes in milliseconds
);

/**
 * Decorator for moderate rate limiting on creation endpoints
 * Rate: 10 requests per 10 minutes (600 seconds)
 * Use for: Creating bookings, customers, services
 */
export const ModerateThrottle = () => applyDecorators(
  Throttle({ default: { limit: 10, ttl: 600000 } }) // 10 minutes in milliseconds
);

/**
 * Decorator for light rate limiting on update endpoints
 * Rate: 20 requests per 5 minutes (300 seconds)
 * Use for: Updating entities, status changes
 */
export const LightThrottle = () => applyDecorators(
  Throttle({ default: { limit: 20, ttl: 300000 } }) // 5 minutes in milliseconds
);

/**
 * Decorator for search rate limiting on search/listing endpoints
 * Rate: 50 requests per 5 minutes (300 seconds)
 * Use for: Search operations, listing data
 */
export const SearchThrottle = () => applyDecorators(
  Throttle({ default: { limit: 50, ttl: 300000 } }) // 5 minutes in milliseconds
);

/**
 * Generic throttle decorator with custom options
 * @param limit - Number of requests allowed
 * @param ttl - Time window in milliseconds
 */
export const CustomThrottle = (limit: number, ttl: number) => applyDecorators(
  Throttle({ default: { limit, ttl } })
);