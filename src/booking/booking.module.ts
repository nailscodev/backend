import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

import { ReservationsController } from './infrastructure/reservations.controller';
import { BookingEntity } from './infrastructure/persistence/entities/booking.entity';

@Module({
  imports: [
    SequelizeModule.forFeature([BookingEntity])
  ],
  controllers: [ReservationsController],
  providers: [],
  exports: [
    SequelizeModule
  ],
})
export class BookingModule {}