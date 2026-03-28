import { Module, Logger, OnModuleInit } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserEntity } from '../common/entities/user.entity';
import { UserTokenEntity } from '../users/infrastructure/persistence/entities/user-token.entity';
import { ServiceEntity } from '../services/infrastructure/persistence/entities/service.entity';
import { CategoryEntity } from '../categories/infrastructure/persistence/entities/category.entity';
import { StaffEntity } from '../staff/infrastructure/persistence/entities/staff.entity';
import { StaffServiceEntity } from '../staff/infrastructure/persistence/entities/staff-service.entity';
import { BookingEntity } from '../booking/infrastructure/persistence/entities/booking.entity';
import { NotificationEntity } from '../notifications/infrastructure/persistence/entities/notification.entity';
import { AddOnEntity } from '../addons/infrastructure/persistence/entities/addon.entity';
import { AddonIncompatibilityEntity } from '../addons/infrastructure/persistence/entities/addon-incompatibility.entity';
import { AddOnLangEntity } from '../addons/infrastructure/persistence/entities/addon-lang.entity';
import { ServiceAddon } from '../shared/domain/service-addon.model';
import { ServiceLangEntity } from '../services/infrastructure/persistence/entities/service-lang.entity';
import { LanguageEntity } from '../shared/domain/entities/language.entity';
import { ComboEligibleEntity } from '../services/infrastructure/persistence/entities/combo-eligible.entity';
import { CategoryLangEntity } from '../categories/infrastructure/persistence/entities/category-lang.entity';
import { RemovalStepEntity } from '../services/infrastructure/persistence/entities/removal-step.entity';
import { ScreenRoleEntity } from '../common/entities/screen-role.entity';
import { ManualAdjustment } from '../common/entities/manual-adjustment.entity';
import { ReportEntity } from '../reports/infrastructure/persistence/entities/report.entity';
import { PerformanceTestRunEntity } from '../performance-tests/performance-test-run.entity';
import { CustomerEntity } from '../customers/infrastructure/persistence/entities/customer.entity';
import { defineAssociations } from './associations';

// Helper function to parse DATABASE_URL
const dbLogger = new Logger('DatabaseModule');
function parseDatabaseUrl(url: string) {
  // Support URLs with or without port: postgresql://user:pass@host:port/db or postgresql://user:pass@host/db
  const regex = /^postgres(?:ql)?:\/\/([^:]+):([^@]+)@([^:/]+)(?::(\d+))?\/(.+)$/;
  const match = url.match(regex);
  if (match) {
    return {
      username: match[1],
      password: match[2],
      host: match[3],
      port: match[4] ? parseInt(match[4], 10) : 5432, // Default to 5432 if no port
      database: match[5].split('?')[0], // Remove query params if any
    };
  }
  return null;
}

@Module({
  imports: [
    SequelizeModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const databaseUrl = configService.get('DATABASE_URL');
        const isProduction = configService.get('NODE_ENV') === 'production';
        // synchronize: false — schema is created by SQL migration files (create-tables.sql).
        // Setting synchronize: true when the schema already exists causes Sequelize to attempt
        // CREATE INDEX without IF NOT EXISTS, which fails on an already-seeded database.
        const disableSSL = configService.get('DB_SSL') === 'false' || databaseUrl?.includes('sslmode=disable');
        
        // If DATABASE_URL is provided (Render, Heroku, Fly.io, etc.), parse it
        if (databaseUrl) {
          const dbConfig = parseDatabaseUrl(databaseUrl);
          if (dbConfig) {
            dbLogger.debug(`Connecting to database (SSL: ${!disableSSL && isProduction})`);
            return {
              dialect: 'postgres',
              host: dbConfig.host,
              port: dbConfig.port,
              username: dbConfig.username,
              password: dbConfig.password,
              database: dbConfig.database,
              synchronize: false,
              logging: !isProduction,
              autoLoadModels: true,
              models: [UserEntity, UserTokenEntity, ServiceEntity, CategoryEntity, StaffEntity, StaffServiceEntity, BookingEntity, NotificationEntity, AddOnEntity, AddonIncompatibilityEntity, ServiceAddon, LanguageEntity, ServiceLangEntity, AddOnLangEntity, ComboEligibleEntity, CategoryLangEntity, RemovalStepEntity, ScreenRoleEntity, ManualAdjustment, ReportEntity, PerformanceTestRunEntity, CustomerEntity],
              pool: {
                max: 5,
                min: 0,          // 0 = no idle connections kept; avoids Neon killing a stale 'warm' connection
                acquire: 30000,
                idle: 10000,     // evict idle connections quickly
                evict: 5000,     // check frequently
              },
              retry: { max: 3 },
              dialectOptions: (isProduction && !disableSSL) ? {
                ssl: {
                  require: true,
                  rejectUnauthorized: false,
                },
                // Keep TCP connection alive so Neon doesn't drop it
                keepAlive: true,
                keepAliveInitialDelayMillis: 10000,
              } : {
                keepAlive: true,
                keepAliveInitialDelayMillis: 10000,
              },
            };
          }
        }
        
        // Fallback to individual environment variables (local development)
        return {
          dialect: 'postgres',
          host: configService.get('DB_HOST', 'localhost'),
          port: configService.get('DB_PORT', 5432),
          username: configService.get('DB_USERNAME', 'postgres'),
          password: configService.get('DB_PASSWORD') || undefined,
          database: configService.get('DB_DATABASE') || configService.get('DB_NAME', 'nailsandco'),
          synchronize: false,
          logging: !isProduction,
          autoLoadModels: true,
          models: [UserEntity, UserTokenEntity, ServiceEntity, CategoryEntity, StaffEntity, StaffServiceEntity, BookingEntity, NotificationEntity, AddOnEntity, AddonIncompatibilityEntity, ServiceAddon, LanguageEntity, ServiceLangEntity, AddOnLangEntity, ComboEligibleEntity, CategoryLangEntity, RemovalStepEntity, ScreenRoleEntity, ManualAdjustment, ReportEntity, PerformanceTestRunEntity, CustomerEntity],
          pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000,
            evict: 5000,
          },
          retry: { max: 3 },
          dialectOptions: {
            keepAlive: true,
            keepAliveInitialDelayMillis: 10000,
          },
        };
      },
    }),
  ],
  exports: [SequelizeModule],
})
export class DatabaseModule implements OnModuleInit {
  onModuleInit() {
    defineAssociations();
  }
}