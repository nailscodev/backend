import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { StaffEntity } from './infrastructure/persistence/entities/staff.entity';
import { StaffServiceEntity } from './infrastructure/persistence/entities/staff-service.entity';
import { StaffService } from './application/staff.service';
import { StaffServiceRelationService } from './application/staff-service-relation.service';
import { StaffController } from './infrastructure/web/staff.controller';
import { ServiceEntity } from '../services/infrastructure/persistence/entities/service.entity';

@Module({
  imports: [SequelizeModule.forFeature([StaffEntity, StaffServiceEntity, ServiceEntity])],
  controllers: [StaffController],
  providers: [StaffService, StaffServiceRelationService],
  exports: [StaffService, StaffServiceRelationService, SequelizeModule],
})
export class StaffModule { }