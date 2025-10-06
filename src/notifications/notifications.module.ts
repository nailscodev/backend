import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

import { NotificationsController } from './infrastructure/notifications.controller';
import { NotificationEntity } from './infrastructure/persistence/entities/notification.entity';

@Module({
  imports: [
    SequelizeModule.forFeature([NotificationEntity])
  ],
  controllers: [NotificationsController],
  providers: [],
  exports: [
    SequelizeModule
  ],
})
export class NotificationsModule {}