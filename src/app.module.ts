import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { DatabaseModule } from './database/database.module';
// import { AuthModule } from './auth/auth.module'; // TODO: Implementar completamente
import { CustomersModule } from './customers/customer.module';
import { CategoriesModule } from './categories/categories.module';
import { ServicesModule } from './services/services.module';
import { StaffModule } from './staff/staff.module';
import { UserModule } from './users/user.module';
import { BookingModule } from './booking/booking.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AddOnsModule } from './addons/addons.module';
import { AppController } from './common/controllers/app.controller';
import { HealthController } from './common/controllers/health.controller';
import { CsrfController } from './common/controllers/csrf.controller';
import { CsrfService } from './common/services/csrf.service';
import { CustomThrottlerGuard } from './common/guards/custom-throttler.guard';
import { CsrfGuard } from './common/guards/csrf.guard';
import { JwtAuthInterceptor } from './common/interceptors/jwt-auth.interceptor';

/**
 * Main application module with security features
 * 
 * This module configures the application with:
 * - Rate limiting protection against brute force attacks via ThrottlerModule
 * - CSRF protection via CsrfGuard and CsrfService for state-changing operations
 * - JWT authentication protection for all POST, PUT, DELETE requests via JwtAuthInterceptor
 * - Global security guards and interceptors
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // Configure rate limiting to prevent brute force attacks
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60000, // 1 minute
        limit: 100, // Maximum 100 requests per minute per IP
      },
      {
        name: 'strict',
        ttl: 60000, // 1 minute
        limit: 10, // Maximum 10 requests per minute for sensitive endpoints
      },
      {
        name: 'auth',
        ttl: 900000, // 15 minutes
        limit: 5, // Maximum 5 authentication attempts per 15 minutes
      },
    ]),
    DatabaseModule,
    // AuthModule, // TODO: Implementar completamente
    CustomersModule,
    CategoriesModule,
    ServicesModule,
    StaffModule,
    UserModule,
    BookingModule,
    NotificationsModule,
    AddOnsModule,
  ],
  controllers: [AppController, HealthController, CsrfController],
  providers: [
    CsrfService,
    {
      provide: APP_GUARD,
      useClass: CustomThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: CsrfGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: JwtAuthInterceptor,
    },
  ],
})
export class AppModule { }
