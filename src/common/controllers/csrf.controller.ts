import { Controller, Get, Post, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeaders } from '@nestjs/swagger';
import type { Request } from 'express';
import { CsrfService } from '../services/csrf.service';
import { SkipCsrf } from '../decorators/csrf.decorator';
import { SearchThrottle } from '../decorators/throttle.decorator';
import { extractSessionId } from '../utils/session.utils';

interface CsrfTokenResponse {
  token: string;
  expiresIn: number;
  sessionId: string;
}

interface TokenValidationResponse {
  valid: boolean;
  age?: number;
  expired?: boolean;
  expiresIn?: number;
  error?: string;
}

@ApiTags('security')
@Controller('csrf')
export class CsrfController {
  constructor(private readonly csrfService: CsrfService) {}

  @Get('token')
  @SkipCsrf()
  @SearchThrottle()
  @ApiOperation({ 
    summary: 'Generate CSRF token',
    description: 'Generates a new CSRF token for the current session'
  })
  @ApiResponse({
    status: 200,
    description: 'CSRF token generated successfully'
  })
  async getToken(@Req() request: Request): Promise<CsrfTokenResponse> {
    const sessionId = extractSessionId(request);
    const tokenResult = await this.csrfService.generateToken(sessionId);
    
    return {
      token: tokenResult.token,
      expiresIn: tokenResult.expiresIn,
      sessionId,
    };
  }

  @Post('validate')
  @SkipCsrf()
  @SearchThrottle()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Validate CSRF token',
    description: 'Validates a CSRF token without consuming it'
  })
  @ApiHeaders([
    { name: 'X-CSRF-Token', description: 'CSRF token to validate', required: true }
  ])
  async validateToken(@Req() request: Request): Promise<TokenValidationResponse> {
    const token = (request.headers['x-csrf-token'] as string) || 
                  (request.headers['csrf-token'] as string);

    if (!token) {
      return {
        valid: false,
        error: 'CSRF token is required in X-CSRF-Token header',
      };
    }
    
    const tokenInfo = await this.csrfService.getTokenInfo(token);
    
    return {
      valid: tokenInfo.isValid || false,
      age: tokenInfo.ageInMilliseconds ?? 0,
      expired: tokenInfo.isExpired ?? false,
      expiresIn: tokenInfo.expiresInMilliseconds ?? 0,
      error: tokenInfo.isValid ? undefined : (tokenInfo.errorMessage || 'Token validation failed'),
    };
  }

  @Get('health')
  @SkipCsrf()
  @ApiOperation({ 
    summary: 'CSRF service health check',
    description: 'Checks if the CSRF service is operational'
  })
  getHealth(): {
    status: string;
    timestamp: string;
    version: string;
  } {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '2.0.0',
    };
  }
}
