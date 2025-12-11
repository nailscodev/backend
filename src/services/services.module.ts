import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ServiceEntity } from './infrastructure/persistence/entities/service.entity';
import { ServiceIncompatibilityEntity } from './infrastructure/persistence/entities/service-incompatibility.entity';
import { RemovalStepEntity } from './infrastructure/persistence/entities/removal-step.entity';
import { AddOnEntity } from '../addons/infrastructure/persistence/entities/addon.entity';
import { ServiceLangEntity } from './infrastructure/persistence/entities/service-lang.entity';
import { LanguageEntity } from '../shared/domain/entities/language.entity';
import { ServicesController } from './infrastructure/services.controller';
import { ServicesService } from './application/services.service';

@Module({
  imports: [SequelizeModule.forFeature([ServiceEntity, AddOnEntity, ServiceIncompatibilityEntity, RemovalStepEntity, ServiceLangEntity, LanguageEntity])],
  controllers: [ServicesController],
  providers: [ServicesService],
  exports: [ServicesService, SequelizeModule],
})
export class ServicesModule { }