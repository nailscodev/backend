import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

import { ReservationsController } from './infrastructure/reservations.controller';
import { BookingEntity } from './infrastructure/persistence/entities/booking.entity';
import { MultiServiceAvailabilityService } from './application/services/multi-service-availability.service';

@Module({
  imports: [
    SequelizeModule.forFeature([BookingEntity])
  ],
  controllers: [ReservationsController],
  providers: [MultiServiceAvailabilityService],
  exports: [
    SequelizeModule
  ],
})
export class BookingModule { }