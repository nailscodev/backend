// ⚠️  Sentry MUST be imported before everything else
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN || 'https://d21e2ba1c0ed7c5a7bcd51081bc77c97@o4510999499440128.ingest.us.sentry.io/4510999519887360',

  environment: process.env.NODE_ENV || 'development',

  // 10% of requests traced in prod
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  enabled: process.env.NODE_ENV === 'production' || process.env.SENTRY_DEBUG === '1',

  integrations: [
    Sentry.httpIntegration(),
  ],

  initialScope: {
    tags: { app: 'nailsco-backend' },
  },

  beforeSend(event) {
    // Tag booking endpoint errors as critical
    const url = event.request?.url ?? '';
    if (url.includes('/bookings')) {
      event.tags = { ...event.tags, flow: 'booking', critical: true };
    }
    return event;
  },
});

import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: process.env.NODE_ENV === 'production'
      ? ['error', 'warn']
      : ['error', 'warn', 'log', 'debug'],
  });

  // Set content-type header with UTF-8 charset
  app.use((req: any, res: any, next: any) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    next();
  });

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global filters
  app.useGlobalFilters(new AllExceptionsFilter());

  // Global interceptors
  app.useGlobalInterceptors(new ResponseInterceptor(app.get(Reflector)));

  // CORS mejorado
  console.log('DEBUG: ALLOWED_ORIGINS env var:', process.env.ALLOWED_ORIGINS);
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',').map(o => o.trim()) || [
    'http://localhost:3002',
    'http://localhost:3001',
    'http://localhost:3000',
    'http://192.168.1.32:3002',
    'http://127.0.0.1:3002',
    'https://frontend-web-wt6y.onrender.com',
    'https://backoffice-web-so8xwa.fly.dev/'
  ];
  console.log('DEBUG: Allowed origins configured:', allowedOrigins);

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'X-Requested-With',
      'Cache-Control',
      'x-tenant-id',
      'X-CSRF-Token',
      'x-csrf-token'
    ],
    exposedHeaders: ['X-Total-Count', 'X-Total-Pages'],
    optionsSuccessStatus: 200, // For legacy browser support
  });

  // Swagger documentation
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Nails & Beauty Co API')
      .setDescription('Sistema de reservas para servicios de belleza')
      .setVersion('1.0')
      .addTag('bookings', 'Gestión de reservas')
      .addTag('customers', 'Gestión de clientes')
      .addTag('services', 'Catálogo de servicios')
      .addTag('staff', 'Gestión de personal')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        tagsSorter: 'alpha',
        operationsSorter: 'alpha',
      },
    });
  }

  // API prefix
  app.setGlobalPrefix('api/v1');

  const port = process.env.PORT || 3001;
  await app.listen(port, '0.0.0.0');

  console.log(`Application is running on: http://localhost:${port}`);
  console.log(`API Documentation: http://localhost:${port}/api/docs`);
  console.log(`CORS enabled for origins: ${allowedOrigins.join(', ')}`);
}

bootstrap().catch((error) => {
  console.error('Error starting application:', error);
  process.exit(1);
});
