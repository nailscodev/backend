import { Module, OnModuleInit } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserEntity } from '../common/entities/user.entity';
import { ServiceEntity } from '../services/infrastructure/persistence/entities/service.entity';
import { StaffEntity } from '../staff/infrastructure/persistence/entities/staff.entity';
import { StaffServiceEntity } from '../staff/infrastructure/persistence/entities/staff-service.entity';
import { BookingEntity } from '../booking/infrastructure/persistence/entities/booking.entity';
import { NotificationEntity } from '../notifications/infrastructure/persistence/entities/notification.entity';
import { AddOnEntity } from '../addons/infrastructure/persistence/entities/addon.entity';
import { ServiceAddon } from '../shared/domain/service-addon.model';
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
        models: [UserEntity, ServiceEntity, StaffEntity, StaffServiceEntity, BookingEntity, NotificationEntity, AddOnEntity, ServiceAddon],
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