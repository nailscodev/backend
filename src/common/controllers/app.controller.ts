import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SkipCsrf } from '../decorators/csrf.decorator';

@ApiTags('app')
@Controller()
@SkipCsrf()
export class AppController {
  @Get()
  @ApiOperation({ summary: 'API Welcome message' })
  @ApiResponse({ status: 200, description: 'Welcome message with API information' })
  getWelcome() {
    return {
      message: '¡Bienvenido a Nails & Beauty Co API! 💅✨',
      version: '1.0.0',
      status: 'running',
      timestamp: new Date().toISOString(),
      endpoints: {
        documentation: '/api/docs',
        health: '/api/v1/health',
        services: '/api/v1/services',
        clients: '/api/v1/clients', 
        staff: '/api/v1/staff',
        csrf: '/api/v1/csrf'
      },
      database: 'connected',
      features: [
        '🎯 Gestión de servicios de belleza',
        '👥 Administración de clientes',
        '👩‍💼 Gestión de personal',
        '🔒 Protección CSRF',
        '⚡ Rate limiting',
        '🏢 Multi-tenant support'
      ]
    };
  }

  @Get('status')
  @ApiOperation({ summary: 'API Status check' })
  @ApiResponse({ status: 200, description: 'API status information' })
  getStatus() {
    return {
      status: 'healthy',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    };
  }
}