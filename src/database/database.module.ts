import { Module, OnModuleInit } from '@nestjs/common';
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
import { defineAssociations } from './associations';

// Helper function to parse DATABASE_URL
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
        const disableSSL = configService.get('DB_SSL') === 'false' || databaseUrl?.includes('sslmode=disable');
        
        // If DATABASE_URL is provided (Render, Heroku, Fly.io, etc.), parse it
        if (databaseUrl) {
          const dbConfig = parseDatabaseUrl(databaseUrl);
          if (dbConfig) {
            console.log(`Connecting to database at ${dbConfig.host}:${dbConfig.port}/${dbConfig.database} (SSL: ${!disableSSL && isProduction})`);
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
              models: [UserEntity, UserTokenEntity, ServiceEntity, CategoryEntity, StaffEntity, StaffServiceEntity, BookingEntity, NotificationEntity, AddOnEntity, AddonIncompatibilityEntity, ServiceAddon, LanguageEntity, ServiceLangEntity, AddOnLangEntity, ComboEligibleEntity, CategoryLangEntity],
              dialectOptions: (isProduction && !disableSSL) ? {
                ssl: {
                  require: true,
                  rejectUnauthorized: false,
                },
              } : {},
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
          database: configService.get('DB_NAME', 'nailsandco'),
          synchronize: false,
          logging: !isProduction,
          autoLoadModels: true,
          models: [UserEntity, UserTokenEntity, ServiceEntity, CategoryEntity, StaffEntity, StaffServiceEntity, BookingEntity, NotificationEntity, AddOnEntity, AddonIncompatibilityEntity, ServiceAddon, LanguageEntity, ServiceLangEntity, AddOnLangEntity, ComboEligibleEntity, CategoryLangEntity],
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