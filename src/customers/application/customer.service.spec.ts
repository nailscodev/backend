/**
 * @fileoverview Unit Tests for CustomerService
 * 
 * This test suite provides comprehensive coverage for the customer service functionality.
 * 
 * @version 1.0.0
 * @author Professional Test Team
 */

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */

import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto, SearchCustomersDto } from './dto/update-customer.dto';

describe('CustomerService', () => {
  let service: CustomerService;
  let mockCustomerRepository: any;

  const mockCustomerData = {
    id: 'customer-123',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '+1234567890',
    notes: 'Test notes',
    birthDate: new Date('1990-01-15'),
    createdAt: new Date('2024-12-01T09:00:00Z'),
    updatedAt: new Date('2024-12-01T09:00:00Z'),
  };

  beforeEach(async () => {
    mockCustomerRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findAll: jest.fn(),
      delete: jest.fn(),
      search: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomerService,
        {
          provide: 'ICustomerRepository',
          useValue: mockCustomerRepository,
        },
      ],
    }).compile();

    service = module.get<CustomerService>(CustomerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createCustomer', () => {
    const createCustomerDto: CreateCustomerDto = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '+1234567890',
      notes: 'Test notes',
      birthDate: '1990-01-15',
    };

    it('should create a customer successfully', async () => {
      mockCustomerRepository.findByEmail.mockResolvedValue(null);
      mockCustomerRepository.save.mockResolvedValue(undefined);
      mockCustomerRepository.findById.mockResolvedValue(mockCustomerData);

      const result = await service.createCustomer(createCustomerDto);

      expect(mockCustomerRepository.findByEmail).toHaveBeenCalledWith(
        'john.doe@example.com',
      );
      expect(mockCustomerRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          phone: '+1234567890',
          notes: 'Test notes',
          birthDate: new Date('1990-01-15'),
        }),
      );
      expect(result).toEqual({
        id: mockCustomerData.id,
        firstName: mockCustomerData.firstName,
        lastName: mockCustomerData.lastName,
        email: mockCustomerData.email,
        phone: mockCustomerData.phone,
        notes: mockCustomerData.notes,
        birthDate: mockCustomerData.birthDate,
        createdAt: mockCustomerData.createdAt,
        updatedAt: mockCustomerData.updatedAt,
      });
    });

    it('should throw ConflictException when email already exists', async () => {
      mockCustomerRepository.findByEmail.mockResolvedValue(mockCustomerData);

      await expect(service.createCustomer(createCustomerDto)).rejects.toThrow(
        ConflictException,
      );
      expect(mockCustomerRepository.findByEmail).toHaveBeenCalledWith(
        'john.doe@example.com',
      );
      expect(mockCustomerRepository.save).not.toHaveBeenCalled();
    });

    it('should create customer with minimal data', async () => {
      const minimalDto: CreateCustomerDto = {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
        phone: '+9876543210',
      };
      const minimalCustomer = {
        ...mockCustomerData,
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
        phone: '+9876543210',
        notes: undefined,
        birthDate: undefined,
      };

      mockCustomerRepository.findByEmail.mockResolvedValue(null);
      mockCustomerRepository.save.mockResolvedValue(undefined);
      mockCustomerRepository.findById.mockResolvedValue(minimalCustomer);

      const result = await service.createCustomer(minimalDto);

      expect(mockCustomerRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane.smith@example.com',
          phone: '+9876543210',
          notes: undefined,
          birthDate: undefined,
        }),
      );
      expect(result.firstName).toBe('Jane');
      expect(result.notes).toBeUndefined();
    });

    it('should throw error if created customer cannot be retrieved', async () => {
      mockCustomerRepository.findByEmail.mockResolvedValue(null);
      mockCustomerRepository.save.mockResolvedValue(undefined);
      mockCustomerRepository.findById.mockResolvedValue(null);

      await expect(service.createCustomer(createCustomerDto)).rejects.toThrow(
        'Failed to retrieve created customer',
      );
    });
  });

  describe('getCustomerById', () => {
    it('should return customer when found', async () => {
      mockCustomerRepository.findById.mockResolvedValue(mockCustomerData);

      const result = await service.getCustomerById('customer-123');

      expect(mockCustomerRepository.findById).toHaveBeenCalledWith('customer-123');
      expect(result).toEqual({
        id: mockCustomerData.id,
        firstName: mockCustomerData.firstName,
        lastName: mockCustomerData.lastName,
        email: mockCustomerData.email,
        phone: mockCustomerData.phone,
        notes: mockCustomerData.notes,
        birthDate: mockCustomerData.birthDate,
        createdAt: mockCustomerData.createdAt,
        updatedAt: mockCustomerData.updatedAt,
      });
    });

    it('should throw NotFoundException when customer not found', async () => {
      mockCustomerRepository.findById.mockResolvedValue(null);

      await expect(service.getCustomerById('customer-123')).rejects.toThrow(
        NotFoundException,
      );
      expect(mockCustomerRepository.findById).toHaveBeenCalledWith('customer-123');
    });
  });

  describe('getCustomerByEmail', () => {
    it('should return customer when found by email', async () => {
      mockCustomerRepository.findByEmail.mockResolvedValue(mockCustomerData);

      const result = await service.getCustomerByEmail('john.doe@example.com');

      expect(mockCustomerRepository.findByEmail).toHaveBeenCalledWith(
        'john.doe@example.com',
      );
      expect(result).toEqual({
        id: mockCustomerData.id,
        firstName: mockCustomerData.firstName,
        lastName: mockCustomerData.lastName,
        email: mockCustomerData.email,
        phone: mockCustomerData.phone,
        notes: mockCustomerData.notes,
        birthDate: mockCustomerData.birthDate,
        createdAt: mockCustomerData.createdAt,
        updatedAt: mockCustomerData.updatedAt,
      });
    });

    it('should throw NotFoundException when customer not found by email', async () => {
      mockCustomerRepository.findByEmail.mockResolvedValue(null);

      await expect(
        service.getCustomerByEmail('notfound@example.com'),
      ).rejects.toThrow(NotFoundException);
      expect(mockCustomerRepository.findByEmail).toHaveBeenCalledWith(
        'notfound@example.com',
      );
    });
  });

  describe('getAllCustomers', () => {
    it('should return all customers', async () => {
      const mockCustomers = [
        mockCustomerData,
        { ...mockCustomerData, id: 'customer-456', email: 'jane@example.com' },
      ];
      mockCustomerRepository.findAll.mockResolvedValue(mockCustomers);

      const result = await service.getAllCustomers();

      expect(mockCustomerRepository.findAll).toHaveBeenCalled();
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('customer-123');
      expect(result[1].id).toBe('customer-456');
    });

    it('should return empty array when no customers found', async () => {
      mockCustomerRepository.findAll.mockResolvedValue([]);

      const result = await service.getAllCustomers();

      expect(mockCustomerRepository.findAll).toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });

  describe('updateCustomer', () => {
    const updateCustomerDto: UpdateCustomerDto = {
      firstName: 'Johnny',
      phone: '+9876543210',
      notes: 'Updated notes',
    };

    it('should update customer successfully', async () => {
      mockCustomerRepository.findById.mockResolvedValue(mockCustomerData);
      mockCustomerRepository.save.mockResolvedValue(undefined);
      const updatedCustomer = { ...mockCustomerData, ...updateCustomerDto };
      mockCustomerRepository.findById
        .mockResolvedValueOnce(mockCustomerData)
        .mockResolvedValueOnce(updatedCustomer);

      const result = await service.updateCustomer('customer-123', updateCustomerDto);

      expect(mockCustomerRepository.findById).toHaveBeenCalledWith('customer-123');
      expect(mockCustomerRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          firstName: 'Johnny',
          phone: '+9876543210',
          notes: 'Updated notes',
        }),
      );
      expect(result.firstName).toBe('Johnny');
      expect(result.phone).toBe('+9876543210');
    });

    it('should throw NotFoundException when customer not found', async () => {
      mockCustomerRepository.findById.mockResolvedValue(null);

      await expect(
        service.updateCustomer('customer-123', updateCustomerDto),
      ).rejects.toThrow(NotFoundException);
      expect(mockCustomerRepository.save).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when updating to existing email', async () => {
      const updateWithEmail = { email: 'existing@example.com' };
      const existingCustomer = {
        ...mockCustomerData,
        id: 'customer-456',
        email: 'existing@example.com',
      };

      mockCustomerRepository.findById.mockResolvedValue(mockCustomerData);
      mockCustomerRepository.findByEmail.mockResolvedValue(existingCustomer);

      await expect(
        service.updateCustomer('customer-123', updateWithEmail),
      ).rejects.toThrow(ConflictException);
      expect(mockCustomerRepository.save).not.toHaveBeenCalled();
    });

    it('should allow updating to same email', async () => {
      const updateWithSameEmail = { email: 'john.doe@example.com', firstName: 'Johnny' };
      
      mockCustomerRepository.findById.mockResolvedValue(mockCustomerData);
      mockCustomerRepository.findByEmail.mockResolvedValue(mockCustomerData);
      mockCustomerRepository.save.mockResolvedValue(undefined);
      const updatedCustomer = { ...mockCustomerData, firstName: 'Johnny' };
      mockCustomerRepository.findById
        .mockResolvedValueOnce(mockCustomerData)
        .mockResolvedValueOnce(updatedCustomer);

      const result = await service.updateCustomer('customer-123', updateWithSameEmail);

      expect(mockCustomerRepository.save).toHaveBeenCalled();
      expect(result.firstName).toBe('Johnny');
    });
  });

  describe('deleteCustomer', () => {
    it('should delete customer successfully', async () => {
      mockCustomerRepository.findById.mockResolvedValue(mockCustomerData);
      mockCustomerRepository.delete.mockResolvedValue(undefined);

      await service.deleteCustomer('customer-123');

      expect(mockCustomerRepository.findById).toHaveBeenCalledWith('customer-123');
      expect(mockCustomerRepository.delete).toHaveBeenCalledWith('customer-123');
    });

    it('should throw NotFoundException when customer not found', async () => {
      mockCustomerRepository.findById.mockResolvedValue(null);

      await expect(service.deleteCustomer('customer-123')).rejects.toThrow(
        NotFoundException,
      );
      expect(mockCustomerRepository.delete).not.toHaveBeenCalled();
    });
  });

  describe('searchCustomers', () => {
    const searchDto: SearchCustomersDto = {
      query: 'john',
    };

    it('should return search results', async () => {
      const mockSearchResults = [mockCustomerData];
      mockCustomerRepository.search.mockResolvedValue(mockSearchResults);

      const result = await service.searchCustomers(searchDto);

      expect(mockCustomerRepository.search).toHaveBeenCalledWith('john');
      expect(result).toEqual([
        {
          id: mockCustomerData.id,
          firstName: mockCustomerData.firstName,
          lastName: mockCustomerData.lastName,
          email: mockCustomerData.email,
          phone: mockCustomerData.phone,
          notes: mockCustomerData.notes,
          birthDate: mockCustomerData.birthDate,
          createdAt: mockCustomerData.createdAt,
          updatedAt: mockCustomerData.updatedAt,
        },
      ]);
    });

    it('should return empty results when no matches found', async () => {
      mockCustomerRepository.search.mockResolvedValue([]);

      const result = await service.searchCustomers(searchDto);

      expect(result).toEqual([]);
    });
  });
});