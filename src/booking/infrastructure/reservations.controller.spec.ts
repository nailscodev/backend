import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/sequelize';
import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ReservationsController } from './reservations.controller';
import { BookingEntity } from './persistence/entities/booking.entity';
import { ManualAdjustment } from '../../common/entities/manual-adjustment.entity';
import { CustomerEntity } from '../../customers/infrastructure/persistence/entities/customer.entity';
import { ServiceEntity } from '../../services/infrastructure/persistence/entities/service.entity';
import { AddOnEntity } from '../../addons/infrastructure/persistence/entities/addon.entity';
import { MultiServiceAvailabilityService } from '../application/services/multi-service-availability.service';
import { MailService } from '../../common/services/mail.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { Sequelize } from 'sequelize-typescript';

/**
 * Unit tests for ReservationsController
 *
 * Focus areas:
 * - create() error handling: DB errors → 500, HttpExceptions pass through
 * - sendBookingConfirmationEmail is fire-and-forget (non-blocking)
 * - findOne() / findById() returns NotFoundException when not found
 */
describe('ReservationsController', () => {
  let controller: ReservationsController;

  const mockBookingModel = {
    findOne: jest.fn(),
    findAll: jest.fn(),
    findAndCountAll: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
    count: jest.fn(),
  };

  const mockManualAdjustmentModel = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
    findByPk: jest.fn(),
  };

  const mockCustomerModel = {
    findByPk: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
  };

  const mockServiceModel = {
    findByPk: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
  };

  const mockAddOnModel = {
    findByPk: jest.fn(),
    findAll: jest.fn(),
  };

  const mockSequelize = {
    transaction: jest.fn(),
    query: jest.fn(),
  };

  const mockMultiServiceAvailabilityService = {
    findMultiServiceSlots: jest.fn(),
  };

  const mockMailService = {
    sendMail: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReservationsController],
      providers: [
        { provide: getModelToken(BookingEntity), useValue: mockBookingModel },
        { provide: getModelToken(ManualAdjustment), useValue: mockManualAdjustmentModel },
        { provide: getModelToken(CustomerEntity), useValue: mockCustomerModel },
        { provide: getModelToken(ServiceEntity), useValue: mockServiceModel },
        { provide: getModelToken(AddOnEntity), useValue: mockAddOnModel },
        { provide: Sequelize, useValue: mockSequelize },
        { provide: MultiServiceAvailabilityService, useValue: mockMultiServiceAvailabilityService },
        { provide: MailService, useValue: mockMailService },
      ],
    }).compile();

    controller = module.get<ReservationsController>(ReservationsController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // ─── create() error handling ───────────────────────────────────────────────

  describe('create()', () => {
    /** Minimal valid DTO with an explicit staffId so we skip the auto-assign branch */
    const validDto: CreateBookingDto = {
      staffId: 'staff-123',
      serviceId: 'svc-456',
      appointmentDate: '2026-04-01',
      startTime: '10:00:00',
      endTime: '11:00:00',
      status: 'in_progress',
    } as unknown as CreateBookingDto;

    it('wraps plain DB errors in InternalServerErrorException (500) — error masking fix', async () => {
      // Simulate a DB connection error surfacing from inside the transaction
      const dbError = new Error('ECONNREFUSED: database connection timed out');
      mockSequelize.transaction.mockRejectedValue(dbError);

      await expect(controller.create(validDto)).rejects.toThrow(
        InternalServerErrorException,
      );
      await expect(controller.create(validDto)).rejects.toThrow(
        'Booking creation failed:',
      );
    });

    it('rethrows HttpException subclasses (e.g. BadRequestException) without wrapping', async () => {
      // Simulate a conflict BadRequestException thrown inside the transaction
      const conflict = new BadRequestException('Time slot already booked');
      mockSequelize.transaction.mockRejectedValue(conflict);

      await expect(controller.create(validDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(controller.create(validDto)).rejects.toThrow(
        'Time slot already booked',
      );
    });

    it('does not rethrow as InternalServerException when a BadRequestException occurs', async () => {
      const conflict = new BadRequestException('Time slot already booked');
      mockSequelize.transaction.mockRejectedValue(conflict);

      try {
        await controller.create(validDto);
        fail('Expected an exception to be thrown');
      } catch (err) {
        expect(err).not.toBeInstanceOf(InternalServerErrorException);
        expect(err).toBeInstanceOf(BadRequestException);
      }
    });

    it('returns the created booking (email is fire-and-forget, does not block)', async () => {
      const fakeBooking = { id: 'booking-789', staffId: validDto.staffId };

      // Simulate a successful transaction
      mockSequelize.transaction.mockImplementation(async (_opts: unknown, callback: (t: unknown) => Promise<unknown>) => {
        return callback({
          // Sequelize Transaction mock: provide LOCK enum and query passthrough
          LOCK: { UPDATE: 'UPDATE' },
        });
      });
      // sequelize.query is used for the advisory lock before the conflict check
      mockSequelize.query.mockResolvedValue([]);

      // Within the transaction, bookingModel.findAll (conflict check) returns [],
      // then bookingModel.create returns the booking
      mockBookingModel.findAll.mockResolvedValue([]); // No conflict
      mockBookingModel.create.mockResolvedValue(fakeBooking);
      mockCustomerModel.findByPk.mockResolvedValue(null); // No customer — email skipped

      const result = await controller.create(validDto);
      expect(result).toEqual(fakeBooking);
    });
  });

  // ─── findOne() — NotFoundException guard ──────────────────────────────────

  describe('findOne()', () => {
    it('throws NotFoundException when booking does not exist', async () => {
      mockBookingModel.findByPk.mockResolvedValue(null);
      await expect(controller.findOne('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('returns the booking when it exists', async () => {
      const booking = { id: '123', staffId: 'staff-1', status: 'in_progress' };
      mockBookingModel.findByPk.mockResolvedValue(booking);
      const result = await controller.findOne('123');
      expect(result).toEqual(booking);
    });
  });
});
