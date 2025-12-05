import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { AddOnsController } from './infrastructure/addons.controller';
import { AddOnEntity } from './infrastructure/persistence/entities/addon.entity';
import { AddonIncompatibilityEntity } from './infrastructure/persistence/entities/addon-incompatibility.entity';

@Module({
  imports: [
    SequelizeModule.forFeature([AddOnEntity, AddonIncompatibilityEntity]),
  ],
  controllers: [AddOnsController],
  providers: [],
  exports: [SequelizeModule],
})
export class AddOnsModule { }