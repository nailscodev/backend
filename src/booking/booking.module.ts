import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

import { BookingCrudController } from './infrastructure/booking-crud.controller';
import { DashboardController } from './infrastructure/dashboard.controller';
import { AvailabilityController } from './infrastructure/availability.controller';
import { BookingEntity } from './infrastructure/persistence/entities/booking.entity';
import { MultiServiceAvailabilityService } from './application/services/multi-service-availability.service';
import { BookingSchedulerService } from './application/services/booking-scheduler.service';
import { ManualAdjustment } from '../common/entities/manual-adjustment.entity';
import { MailModule } from '../common/services/mail.module';
import { CustomerEntity } from '../customers/infrastructure/persistence/entities/customer.entity';
import { ServiceEntity } from '../services/infrastructure/persistence/entities/service.entity';
import { AddOnEntity } from '../addons/infrastructure/persistence/entities/addon.entity';
import { AuditModule } from '../common/audit.module';

@Module({
  imports: [
    SequelizeModule.forFeature([BookingEntity, ManualAdjustment, CustomerEntity, ServiceEntity, AddOnEntity]),
    MailModule,
    AuditModule,
  ],
  controllers: [BookingCrudController, DashboardController, AvailabilityController],
  providers: [MultiServiceAvailabilityService, BookingSchedulerService],
  exports: [
    SequelizeModule
  ],
})
export class BookingModule { }