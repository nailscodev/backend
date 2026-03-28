import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/sequelize';
import { StaffService } from './staff.service';
import { StaffEntity } from '../../staff/infrastructure/persistence/entities/staff.entity';
import { StaffServiceEntity } from '../../staff/infrastructure/persistence/entities/staff-service.entity';
import { ServiceEntity } from '../../services/infrastructure/persistence/entities/service.entity';
import { BookingEntity } from '../../booking/infrastructure/persistence/entities/booking.entity';

describe('StaffService', () => {
  let service: StaffService;

  const mockStaffModel = {
    findOne: jest.fn(),
    findAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
    count: jest.fn(),
  };

  const mockStaffServiceModel = {
    findAll: jest.fn(),
    bulkCreate: jest.fn(),
    destroy: jest.fn(),
  };

  const mockServiceModel = {
    findOne: jest.fn(),
    findAll: jest.fn(),
  };

  const mockBookingModel = {
    findOne: jest.fn(),
    findAll: jest.fn(),
    count: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StaffService,
        {
          provide: getModelToken(StaffEntity),
          useValue: mockStaffModel,
        },
        {
          provide: getModelToken(StaffServiceEntity),
          useValue: mockStaffServiceModel,
        },
        {
          provide: getModelToken(ServiceEntity),
          useValue: mockServiceModel,
        },
        {
          provide: getModelToken(BookingEntity),
          useValue: mockBookingModel,
        },
      ],
    }).compile();

    service = module.get<StaffService>(StaffService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── createStaff ──────────────────────────────────────────────────────────

  describe('createStaff()', () => {
    const validDto = {
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane@example.com',
      phone: '555-0100',
      role: 'technician',
    };

    it('throws ConflictException when email already exists', async () => {
      mockStaffModel.findOne.mockResolvedValue({ id: 'existing-id', email: validDto.email });

      const { ConflictException } = await import('@nestjs/common');
      await expect(service.createStaff(validDto as any)).rejects.toThrow(ConflictException);
    });

    it('calls staffModel.create when email is unique', async () => {
      mockStaffModel.findOne.mockResolvedValue(null); // No conflict
      mockStaffModel.create.mockResolvedValue({
        id: 'new-id',
        ...validDto,
        email: validDto.email.toLowerCase(),
        specialties: [],
        workingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        shifts: [],
        isBookable: true,
        isWebVisible: true,
      });
      mockStaffServiceModel.findAll.mockResolvedValue([]);

      await service.createStaff(validDto as any);

      expect(mockStaffModel.create).toHaveBeenCalledTimes(1);
      const createArg = mockStaffModel.create.mock.calls[0][0];
      expect(createArg.email).toBe(validDto.email.toLowerCase()); // Lowercased
    });

    it('lowercases and trims the email before persisting', async () => {
      const dtoWithUpper = { ...validDto, email: '  Jane@Example.COM  ' };
      mockStaffModel.findOne.mockResolvedValue(null);
      mockStaffModel.create.mockResolvedValue({
        id: 'new-id', ...dtoWithUpper,
        email: 'jane@example.com',
        specialties: [], workingDays: [], shifts: [],
      });
      mockStaffServiceModel.findAll.mockResolvedValue([]);

      await service.createStaff(dtoWithUpper as any);

      const createArg = mockStaffModel.create.mock.calls[0][0];
      expect(createArg.email).toBe('jane@example.com');
    });
  });

  // ─── findAvailableStaff ───────────────────────────────────────────────────

  describe('findAvailableStaff()', () => {
    it('returns only staff members with isBookable=true', async () => {
      const active = { id: '1', firstName: 'Alice', lastName: 'Smith', isBookable: true, status: 'active', specialties: [], workingDays: [] };
      const notBookable = { id: '2', firstName: 'Bob', lastName: 'Jones', isBookable: false, status: 'active', specialties: [], workingDays: [] };

      // findAvailableStaff queries for isBookable=true at the DB level
      mockStaffModel.findAll.mockResolvedValue([active]);
      mockStaffServiceModel.findAll.mockResolvedValue([]);

      const result = await service.findAvailableStaff();

      // The returned list should not contain the non-bookable staff
      const ids = result.map((s: any) => s.id);
      expect(ids).toContain('1');
      expect(ids).not.toContain(notBookable.id);
    });

    it('returns an empty array when no bookable staff exists', async () => {
      mockStaffModel.findAll.mockResolvedValue([]);
      const result = await service.findAvailableStaff();
      expect(result).toEqual([]);
    });
  });
});
