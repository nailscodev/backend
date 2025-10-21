import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ServiceEntity } from './infrastructure/persistence/entities/service.entity';
import { AddOnEntity } from '../addons/infrastructure/persistence/entities/addon.entity';
import { ServicesController } from './infrastructure/services.controller';
import { ServicesService } from './application/services.service';

@Module({
  imports: [SequelizeModule.forFeature([ServiceEntity, AddOnEntity])],
  controllers: [ServicesController],
  providers: [ServicesService],
  exports: [ServicesService, SequelizeModule],
})
export class ServicesModule { }