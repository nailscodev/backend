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
});
