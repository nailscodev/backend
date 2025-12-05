import { Injectable, Inject, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import type { ICustomerRepository, CustomerData } from '../domain/repositories/customer.repository.interface';
import { CustomerId } from '../domain/value-objects/customer-id.vo';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto, SearchCustomersDto } from './dto/update-customer.dto';
import { CustomerResponseDto } from './dto/customer-response.dto';

@Injectable()
export class CustomerService {
  private readonly logger = new Logger(CustomerService.name);

  constructor(
    @Inject('ICustomerRepository')
    private readonly customerRepository: ICustomerRepository,
  ) {}

  async createCustomer(createCustomerDto: CreateCustomerDto): Promise<CustomerResponseDto> {
    try {
      // Verificar si el email ya existe
      const existingCustomer = await this.customerRepository.findByEmail(createCustomerDto.email);
      if (existingCustomer) {
        throw new ConflictException('A customer with this email already exists');
      }

      const customerId = CustomerId.create();
      
      const customerData = {
        id: customerId.value,
        firstName: createCustomerDto.firstName,
        lastName: createCustomerDto.lastName,
        email: createCustomerDto.email,
        phone: createCustomerDto.phone,
        notes: createCustomerDto.notes,
        birthDate: createCustomerDto.birthDate ? new Date(createCustomerDto.birthDate) : undefined,
      };

      await this.customerRepository.save(customerData);
      
      const createdCustomer = await this.customerRepository.findById(customerId.value);
      if (!createdCustomer) {
        throw new Error('Failed to retrieve created customer');
      }
      return this.mapToResponseDto(createdCustomer);
    } catch (error) {
      this.logger.error('Failed to create customer', error);
      throw error;
    }
  }

  async getCustomerById(id: string): Promise<CustomerResponseDto> {
    try {
      const customer = await this.customerRepository.findById(id);
      if (!customer) {
        throw new NotFoundException(`Customer with ID ${id} not found`);
      }
      return this.mapToResponseDto(customer);
    } catch (error) {
      this.logger.error(`Failed to get customer with ID: ${id}`, error);
      throw error;
    }
  }

  async getCustomerByEmail(email: string): Promise<CustomerResponseDto> {
    try {
      const customer = await this.customerRepository.findByEmail(email);
      if (!customer) {
        throw new NotFoundException(`Customer with email ${email} not found`);
      }
      return this.mapToResponseDto(customer);
    } catch (error) {
      this.logger.error(`Failed to get customer with email: ${email}`, error);
      throw error;
    }
  }

  async getAllCustomers(): Promise<CustomerResponseDto[]> {
    try {
      const customers = await this.customerRepository.findAll();
      return customers.map(customer => this.mapToResponseDto(customer));
    } catch (error) {
      this.logger.error('Failed to get all customers', error);
      throw error;
    }
  }

  async searchCustomers(searchDto: SearchCustomersDto): Promise<CustomerResponseDto[]> {
    try {
      const customers = await this.customerRepository.search(searchDto.query);
      return customers.map(customer => this.mapToResponseDto(customer));
    } catch (error) {
      this.logger.error(`Failed to search customers with query: ${searchDto.query}`, error);
      throw error;
    }
  }

  async updateCustomer(id: string, updateCustomerDto: UpdateCustomerDto): Promise<CustomerResponseDto> {
    try {
      const existingCustomer = await this.customerRepository.findById(id);
      if (!existingCustomer) {
        throw new NotFoundException(`Customer with ID ${id} not found`);
      }

      // Si se actualiza el email, verificar que no esté en uso por otro cliente
      if (updateCustomerDto.email && updateCustomerDto.email !== existingCustomer.email) {
        const customerWithEmail = await this.customerRepository.findByEmail(updateCustomerDto.email);
        if (customerWithEmail && customerWithEmail.id !== id) {
          throw new ConflictException('A customer with this email already exists');
        }
      }

      const updatedData = {
        id: existingCustomer.id,
        firstName: updateCustomerDto.firstName || existingCustomer.firstName,
        lastName: updateCustomerDto.lastName || existingCustomer.lastName,
        email: updateCustomerDto.email || existingCustomer.email,
        phone: updateCustomerDto.phone || existingCustomer.phone,
        notes: updateCustomerDto.notes !== undefined ? updateCustomerDto.notes : existingCustomer.notes,
        birthDate: updateCustomerDto.birthDate ? new Date(updateCustomerDto.birthDate) : existingCustomer.birthDate,
      };

      await this.customerRepository.save(updatedData);
      
      const updatedCustomer = await this.customerRepository.findById(id);
      if (!updatedCustomer) {
        throw new Error('Failed to retrieve updated customer');
      }
      return this.mapToResponseDto(updatedCustomer);
    } catch (error) {
      this.logger.error(`Failed to update customer with ID: ${id}`, error);
      throw error;
    }
  }

  async deleteCustomer(id: string): Promise<void> {
    try {
      const existingCustomer = await this.customerRepository.findById(id);
      if (!existingCustomer) {
        throw new NotFoundException(`Customer with ID ${id} not found`);
      }

      await this.customerRepository.delete(id);
    } catch (error) {
      this.logger.error(`Failed to delete customer with ID: ${id}`, error);
      throw error;
    }
  }

  private mapToResponseDto(customer: CustomerData): CustomerResponseDto {
    return {
      id: customer.id,
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email,
      phone: customer.phone,
      notes: customer.notes,
      birthDate: customer.birthDate,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
    };
  }
}