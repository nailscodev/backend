import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/sequelize';
import { QueryTypes } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { BookingEntity } from '../../infrastructure/persistence/entities/booking.entity';

/**
 * BookingSchedulerService
 *
 * Handles time-based background tasks for bookings.
 * Extracted from the GET handlers to avoid running an expensive UPDATE
 * on every list/page request.
 */
@Injectable()
export class BookingSchedulerService {
  private readonly logger = new Logger(BookingSchedulerService.name);

  constructor(
    @InjectModel(BookingEntity)
    private readonly bookingModel: typeof BookingEntity,
    private readonly sequelize: Sequelize,
  ) {}

  /**
   * Runs every 5 minutes.
   * Transitions any in_progress booking whose endTime has passed (Miami time)
   * to 'pending' (the UI-visible "completed but not yet reviewed" state).
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async updateExpiredBookings(): Promise<void> {
    try {
      const now = new Date();
      const miamiTime = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/New_York',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }).formatToParts(now);

      const currentMiamiDate = `${miamiTime.find(p => p.type === 'year')?.value}-${miamiTime.find(p => p.type === 'month')?.value}-${miamiTime.find(p => p.type === 'day')?.value}`;
      const currentMiamiTime = `${miamiTime.find(p => p.type === 'hour')?.value}:${miamiTime.find(p => p.type === 'minute')?.value}:${miamiTime.find(p => p.type === 'second')?.value}`;

      await this.sequelize.query(
        `UPDATE bookings
         SET status = 'pending'
         WHERE status = 'in_progress'
           AND (
             "appointmentDate" < :currentDate
             OR (
               "appointmentDate" = :currentDate
               AND "endTime" < :currentTime
             )
           )`,
        {
          replacements: { currentDate: currentMiamiDate, currentTime: currentMiamiTime },
          type: QueryTypes.UPDATE,
        },
      );
    } catch (error) {
      this.logger.error(
        `updateExpiredBookings cron failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
