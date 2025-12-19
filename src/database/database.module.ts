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
import { defineAssociations } from './associations';

@Module({
  imports: [
    SequelizeModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        dialect: 'postgres',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get('DB_PORT', 5432),
        username: configService.get('DB_USERNAME', 'postgres'),
        password: configService.get('DB_PASSWORD') || undefined,
        database: configService.get('DB_NAME', 'nailsandco'),
        synchronize: false, // Use manual SQL scripts instead of auto-sync
        logging: configService.get('NODE_ENV') === 'development',
        autoLoadModels: true,
        models: [UserEntity, UserTokenEntity, ServiceEntity, CategoryEntity, StaffEntity, StaffServiceEntity, BookingEntity, NotificationEntity, AddOnEntity, AddonIncompatibilityEntity, ServiceAddon, LanguageEntity, ServiceLangEntity, AddOnLangEntity],
      }),
    }),
  ],
  exports: [SequelizeModule],
})
export class DatabaseModule implements OnModuleInit {
  onModuleInit() {
    defineAssociations();
  }
}