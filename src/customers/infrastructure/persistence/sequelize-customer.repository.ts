import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import CustomerEntity from './entities/customer.entity';
import type { ICustomerRepository, CustomerData, CreateCustomerData } from '../../domain/repositories/customer.repository.interface';

@Injectable()
export class SequelizeCustomerRepository implements ICustomerRepository {
  private readonly logger = new Logger(SequelizeCustomerRepository.name);

  constructor(
    @InjectModel(CustomerEntity)
    private readonly customerModel: typeof CustomerEntity,
  ) {}

  async save(customerData: CreateCustomerData): Promise<void> {
    try {
      const existingCustomer = await this.customerModel.findByPk(customerData.id);
      if (existingCustomer) {
        await existingCustomer.update(customerData);
      } else {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        await this.customerModel.create(customerData as any);
      }
    } catch (error) {
      this.logger.error(`Failed to save customer with id: ${customerData.id}`, error);
      throw error;
    }
  }

  async findById(id: string): Promise<CustomerData | null> {
    try {
      const customer = await this.customerModel.findByPk(id);
      return customer ? customer.get({ plain: true }) as CustomerData : null;
    } catch (error) {
      this.logger.error(`Failed to find customer with id: ${id}`, error);
      throw error;
    }
  }

  async findByEmail(email: string): Promise<CustomerData | null> {
    try {
      const customer = await this.customerModel.findOne({ where: { email } });
      return customer ? customer.get({ plain: true }) as CustomerData : null;
    } catch (error) {
      this.logger.error(`Failed to find customer with email: ${email}`, error);
      throw error;
    }
  }

  async findAll(): Promise<CustomerData[]> {
    try {
      const customers = await this.customerModel.findAll({
        order: [['lastName', 'ASC'], ['firstName', 'ASC']],
      });
      return customers.map(customer => customer.get({ plain: true }) as CustomerData);
    } catch (error) {
      this.logger.error('Failed to find all customers', error);
      throw error;
    }
  }

  async search(query: string): Promise<CustomerData[]> {
    try {
      const customers = await this.customerModel.findAll({
        where: {
          [Op.or]: [
            { firstName: { [Op.iLike]: `%${query}%` } },
            { lastName: { [Op.iLike]: `%${query}%` } },
            { email: { [Op.iLike]: `%${query}%` } },
            { phone: { [Op.iLike]: `%${query}%` } },
          ],
        },
        order: [['lastName', 'ASC'], ['firstName', 'ASC']],
      });
      return customers.map(customer => customer.get({ plain: true }) as CustomerData);
    } catch (error) {
      this.logger.error(`Failed to search customers with query: ${query}`, error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.customerModel.destroy({ where: { id } });
    } catch (error) {
      this.logger.error(`Failed to delete customer with id: ${id}`, error);
      throw error;
    }
  }
}