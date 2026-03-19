import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

import { ReservationsController } from './infrastructure/reservations.controller';
import { BookingEntity } from './infrastructure/persistence/entities/booking.entity';
import { MultiServiceAvailabilityService } from './application/services/multi-service-availability.service';
import { ManualAdjustment } from '../common/entities/manual-adjustment.entity';
import { MailModule } from '../common/services/mail.module';
import { CustomerEntity } from '../customers/infrastructure/persistence/entities/customer.entity';
import { ServiceEntity } from '../services/infrastructure/persistence/entities/service.entity';
import { AddOnEntity } from '../addons/infrastructure/persistence/entities/addon.entity';

@Module({
  imports: [
    SequelizeModule.forFeature([BookingEntity, ManualAdjustment, CustomerEntity, ServiceEntity, AddOnEntity]),
    MailModule,
  ],
  controllers: [ReservationsController],
  providers: [MultiServiceAvailabilityService],
  exports: [
    SequelizeModule
  ],
})
export class BookingModule { }