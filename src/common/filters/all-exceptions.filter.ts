import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

/**
 * Interface defining the structure of error responses
 * @interface ErrorResponse
 */
export interface ErrorResponse {
  /** Indicates the request was not successful */
  success: boolean;
  /** Error details object */
  error: {
    /** HTTP status code */
    statusCode: number;
    /** Error message(s) - can be string or array for validation errors */
    message: string | string[];
    /** Error type/name */
    error: string;
    /** ISO timestamp when the error occurred */
    timestamp: string;
    /** Request path where the error occurred */
    path: string;
  };
}

/**
 * Global exception filter that catches all unhandled exceptions
 * 
 * This filter provides consistent error response formatting across the entire
 * application. It handles both HTTP exceptions and unexpected errors, ensuring
 * proper logging and user-friendly error messages.
 * 
 * @class AllExceptionsFilter
 * @implements ExceptionFilter
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  /**
   * Catches and processes all exceptions in the application
   * @param exception - The caught exception (can be any type)
   * @param host - Execution context host providing access to request/response
   */
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status: number;
    let message: string | string[];
    let error: string;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const errorObj = exceptionResponse as Record<string, unknown>;
        message = (typeof errorObj.message === 'string' || Array.isArray(errorObj.message)) 
          ? errorObj.message as string | string[]
          : exception.message;
        error = typeof errorObj.error === 'string' ? errorObj.error : exception.name;
      } else {
        message = String(exceptionResponse);
        error = exception.name;
      }
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Internal server error';
      error = 'InternalServerError';
      
      // Log unexpected errors
      this.logger.error('Unexpected error:', exception);
    }

    const errorResponse: ErrorResponse = {
      success: false,
      error: {
        statusCode: status,
        message,
        error,
        timestamp: new Date().toISOString(),
        path: request.url,
      },
    };

    response.status(status).json(errorResponse);
  }
}