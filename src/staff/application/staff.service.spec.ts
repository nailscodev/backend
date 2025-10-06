import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/sequelize';
import { StaffService } from './staff.service';
// Update the import path below to the correct location of staff.entity.ts
import { StaffEntity } from '../../staff/infrastructure/persistence/entities/staff.entity';
// If the path is incorrect, update it to the correct relative path where staff.entity.ts exists.
// Example (uncomment and adjust as needed):
// import { StaffEntity } from '../../correct/path/to/staff.entity';

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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StaffService,
        {
          provide: getModelToken(StaffEntity),
          useValue: mockStaffModel,
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
