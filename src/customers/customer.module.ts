import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import CustomerEntity from './infrastructure/persistence/entities/customer.entity';
import { SequelizeCustomerRepository } from './infrastructure/persistence/sequelize-customer.repository';
import { CustomerService } from './application/customer.service';
import { CustomerController } from './infrastructure/web/customer.controller';

@Module({
  imports: [
    SequelizeModule.forFeature([CustomerEntity])
  ],
  controllers: [CustomerController],
  providers: [
    {
      provide: 'ICustomerRepository',
      useClass: SequelizeCustomerRepository
    },
    CustomerService
  ],
  exports: ['ICustomerRepository', CustomerService]
})
export class CustomersModule {}