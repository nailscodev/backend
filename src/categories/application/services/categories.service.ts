import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { CategoryEntity } from '../../infrastructure/persistence/entities/category.entity';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(CategoryEntity)
    private readonly categoryModel: typeof CategoryEntity,
  ) { }

  async findAll(): Promise<CategoryEntity[]> {
    return this.categoryModel.findAll({
      where: { isActive: true },
      order: [['displayOrder', 'ASC']],
    });
  }

  async findOne(id: string): Promise<CategoryEntity | null> {
    return this.categoryModel.findByPk(id);
  }

  async findByName(name: string): Promise<CategoryEntity | null> {
    return this.categoryModel.findOne({ where: { name } });
  }
}
