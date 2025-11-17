import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { CategoryEntity } from './infrastructure/persistence/entities/category.entity';
import { CategoriesController } from './infrastructure/controllers/categories.controller';
import { CategoriesService } from './application/services/categories.service';

@Module({
  imports: [SequelizeModule.forFeature([CategoryEntity])],
  controllers: [CategoriesController],
  providers: [CategoriesService],
  exports: [CategoriesService, SequelizeModule],
})
export class CategoriesModule { }
