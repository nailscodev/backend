import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { StaffEntity } from './infrastructure/persistence/entities/staff.entity';
import { StaffService } from './application/staff.service';
import { StaffController } from './infrastructure/web/staff.controller';

@Module({
  imports: [SequelizeModule.forFeature([StaffEntity])],
  controllers: [StaffController],
  providers: [StaffService],
  exports: [StaffService, SequelizeModule],
})
export class StaffModule {}