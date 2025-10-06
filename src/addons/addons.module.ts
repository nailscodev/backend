import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { AddOnsController } from './infrastructure/addons.controller';
import { AddOnEntity } from './infrastructure/persistence/entities/addon.entity';

@Module({
  imports: [
    SequelizeModule.forFeature([AddOnEntity]),
  ],
  controllers: [AddOnsController],
  providers: [],
  exports: [SequelizeModule],
})
export class AddOnsModule {}