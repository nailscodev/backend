import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { InjectConnection } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { SkipCsrf } from '../decorators/csrf.decorator';

/**
 * Interface defining the structure of health check responses
 * @interface HealthCheckResponse
 */
interface HealthCheckResponse {
  /** Overall health status */
  status: 'ok' | 'error';
  /** ISO timestamp of the health check */
  timestamp: string;
  /** Current environment (development, production, etc.) */
  environment: string;
  /** Application version */
  version: string;
  /** Application uptime in seconds */
  uptime: number;
  /** Database connection status and details */
  database: {
    /** Database connection status */
    status: 'connected' | 'disconnected' | 'error';
    /** Response time for database query in milliseconds */
    responseTimeMs?: number;
    /** Error message if database check fails */
    error?: string;
  };
}

/**
 * Health check controller providing application and database status
 * 
 * Provides comprehensive health check endpoint that verifies both application
 * status and database connectivity. Used for monitoring, load balancers,
 * and deployment health checks.
 * 
 * @class HealthController
 */
@ApiTags('health')
@Controller('health')
@SkipCsrf()
export class HealthController {
  /**
   * Creates a new instance of HealthController
   * @param sequelize - Sequelize database connection instance
   */
  constructor(
    @InjectConnection()
    private readonly sequelize: Sequelize,
  ) {}

  /**
   * Performs comprehensive health check including database connectivity
   * @returns Promise resolving to health check response with application and database status
   */
  @Get()
  @ApiOperation({ 
    summary: 'Health check endpoint',
    description: 'Provides comprehensive health status including database connectivity'
  })
  @ApiResponse({
    status: 200,
    description: 'Application is healthy',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['ok', 'error'] },
        timestamp: { type: 'string', format: 'date-time' },
        environment: { type: 'string' },
        version: { type: 'string' },
        uptime: { type: 'number' },
        database: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['connected', 'disconnected', 'error'] },
            responseTimeMs: { type: 'number' },
            error: { type: 'string' }
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 503,
    description: 'Application is unhealthy (database connection failed)',
  })
  async getHealth(): Promise<HealthCheckResponse> {
    const startTime = Date.now();
    let databaseStatus: HealthCheckResponse['database'];
    let overallStatus: 'ok' | 'error' = 'ok';

    try {
      // Test database connectivity by executing a simple query
      await this.sequelize.query('SELECT 1');
      const responseTime = Date.now() - startTime;
      
      databaseStatus = {
        status: 'connected',
        responseTimeMs: responseTime,
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      overallStatus = 'error';
      
      databaseStatus = {
        status: 'error',
        responseTimeMs: responseTime,
        error: error instanceof Error ? error.message : 'Unknown database error',
      };
    }

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
      uptime: process.uptime(),
      database: databaseStatus,
    };
  }
}