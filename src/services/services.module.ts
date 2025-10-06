import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ServiceEntity } from './infrastructure/persistence/entities/service.entity';
import { ServicesController } from './infrastructure/services.controller';
import { ServicesService } from './application/services.service';

@Module({
  imports: [SequelizeModule.forFeature([ServiceEntity])],
  controllers: [ServicesController],
  providers: [ServicesService],
  exports: [ServicesService, SequelizeModule],
})
export class ServicesModule {}