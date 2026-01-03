import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { CategoryEntity } from '../../infrastructure/persistence/entities/category.entity';
import { CategoryLangEntity } from '../../infrastructure/persistence/entities/category-lang.entity';
import { LanguageEntity } from '../../../shared/domain/entities/language.entity';

@Injectable()
export class CategoriesService {
  private readonly logger = new Logger(CategoriesService.name);

  constructor(
    @InjectModel(CategoryEntity)
    private readonly categoryModel: typeof CategoryEntity,
    @InjectModel(CategoryLangEntity)
    private readonly categoryLangModel: typeof CategoryLangEntity,
    @InjectModel(LanguageEntity)
    private readonly languageModel: typeof LanguageEntity,
  ) { }

  /**
   * Apply translations to a category entity based on language code
   */
  private async applyCategoryTranslations(
    category: CategoryEntity,
    languageCode?: string,
  ): Promise<CategoryEntity> {
    if (!languageCode) {
      // No language specified, return original
      return category;
    }

    try {
      // Find the language by code
      const language = await this.languageModel.findOne({
        where: { code: languageCode.toUpperCase(), isActive: true },
      });

      if (!language) {
        this.logger.warn(`Language ${languageCode} not found, returning original`);
        return category;
      }

      // Find translation for this category
      const translation = await this.categoryLangModel.findOne({
        where: {
          categoryId: category.id,
          languageId: language.id,
        },
      });

      if (translation) {
        // Apply translation to category name
        category.name = translation.title;
        this.logger.log(`Applied translation for category ${category.id}: ${translation.title}`);
      } else {
        this.logger.warn(`No translation found for category ${category.id} in language ${languageCode}`);
      }
    } catch (error) {
      this.logger.error(`Error applying translations: ${error.message}`);
    }

    return category;
  }

  async findAll(languageCode?: string): Promise<CategoryEntity[]> {
    const categories = await this.categoryModel.findAll({
      where: { isActive: true },
      order: [['displayOrder', 'ASC']],
    });

    // Apply translations if language code is provided
    if (languageCode) {
      const translatedCategories = await Promise.all(
        categories.map(category => this.applyCategoryTranslations(category, languageCode))
      );
      return translatedCategories;
    }

    return categories;
  }

  async findOne(id: string, languageCode?: string): Promise<any> {
    const category = await this.categoryModel.findByPk(id);
    
    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    // Get all translations for editing
    const languages = await this.languageModel.findAll({
      where: { code: ['EN', 'ES'] },
    });

    const enLanguage = languages.find(l => l.code === 'EN');
    const esLanguage = languages.find(l => l.code === 'ES');

    let titleEn = '';
    let titleEs = '';
    let descriptionEn = '';
    let descriptionEs = '';

    if (enLanguage) {
      const enTranslation = await this.categoryLangModel.findOne({
        where: { categoryId: id, languageId: enLanguage.id },
      });
      if (enTranslation) {
        titleEn = enTranslation.title;
        descriptionEn = enTranslation.description || '';
      }
    }

    if (esLanguage) {
      const esTranslation = await this.categoryLangModel.findOne({
        where: { categoryId: id, languageId: esLanguage.id },
      });
      if (esTranslation) {
        titleEs = esTranslation.title;
        descriptionEs = esTranslation.description || '';
      }
    }

    // Apply translation to name if language code is provided
    if (languageCode) {
      const translatedCategory = await this.applyCategoryTranslations(category, languageCode);
      return {
        ...translatedCategory.toJSON(),
        titleEn,
        titleEs,
        descriptionEn,
        descriptionEs,
      };
    }

    return {
      ...category.toJSON(),
      titleEn,
      titleEs,
      descriptionEn,
      descriptionEs,
    };
  }

  async findByName(name: string): Promise<CategoryEntity | null> {
    return this.categoryModel.findOne({ where: { name } });
  }

  async create(createData: {
    name: string;
    displayOrder: number;
    imageUrl?: string;
    titleEn?: string;
    titleEs?: string;
    descriptionEn?: string;
    descriptionEs?: string;
  }): Promise<CategoryEntity> {
    const category = await this.categoryModel.create({
      name: createData.name,
      displayOrder: createData.displayOrder,
      imageUrl: createData.imageUrl,
      isActive: true,
    });

    // Create translations if provided
    await this.createOrUpdateTranslations(category.id, {
      titleEn: createData.titleEn,
      titleEs: createData.titleEs,
      descriptionEn: createData.descriptionEn,
      descriptionEs: createData.descriptionEs,
    });

    return category;
  }

  async update(id: string, updateData: {
    name?: string;
    displayOrder?: number;
    imageUrl?: string;
    isActive?: boolean;
    titleEn?: string;
    titleEs?: string;
    descriptionEn?: string;
    descriptionEs?: string;
  }): Promise<CategoryEntity> {
    const category = await this.categoryModel.findByPk(id);
    
    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    // Update category base data
    await category.update({
      name: updateData.name,
      displayOrder: updateData.displayOrder,
      imageUrl: updateData.imageUrl,
      isActive: updateData.isActive,
    });

    // Update translations if provided
    await this.createOrUpdateTranslations(id, {
      titleEn: updateData.titleEn,
      titleEs: updateData.titleEs,
      descriptionEn: updateData.descriptionEn,
      descriptionEs: updateData.descriptionEs,
    });

    return category;
  }

  private async createOrUpdateTranslations(categoryId: string, translations: {
    titleEn?: string;
    titleEs?: string;
    descriptionEn?: string;
    descriptionEs?: string;
  }): Promise<void> {
    // Get language IDs
    const languages = await this.languageModel.findAll({
      where: { code: ['EN', 'ES'] },
    });

    const enLanguage = languages.find(l => l.code === 'EN');
    const esLanguage = languages.find(l => l.code === 'ES');

    // Create or update English translation
    if (enLanguage && translations.titleEn) {
      const existingEn = await this.categoryLangModel.findOne({
        where: { categoryId, languageId: enLanguage.id },
      });

      if (existingEn) {
        await existingEn.update({
          title: translations.titleEn,
          description: translations.descriptionEn || undefined,
        });
      } else {
        const createData: any = {
          categoryId,
          languageId: enLanguage.id,
          title: translations.titleEn,
        };
        if (translations.descriptionEn) {
          createData.description = translations.descriptionEn;
        }
        await this.categoryLangModel.create(createData);
      }
    }

    // Create or update Spanish translation
    if (esLanguage && translations.titleEs) {
      const existingEs = await this.categoryLangModel.findOne({
        where: { categoryId, languageId: esLanguage.id },
      });

      if (existingEs) {
        await existingEs.update({
          title: translations.titleEs,
          description: translations.descriptionEs || undefined,
        });
      } else {
        const createData: any = {
          categoryId,
          languageId: esLanguage.id,
          title: translations.titleEs,
        };
        if (translations.descriptionEs) {
          createData.description = translations.descriptionEs;
        }
        await this.categoryLangModel.create(createData);
      }
    }
  }

  async delete(id: string): Promise<void> {
    const category = await this.categoryModel.findByPk(id);
    
    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    await category.destroy();
  }
}
