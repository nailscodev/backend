import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ServiceEntity } from '../infrastructure/persistence/entities/service.entity';
import { ServiceIncompatibilityEntity } from '../infrastructure/persistence/entities/service-incompatibility.entity';
import { RemovalStepEntity } from '../infrastructure/persistence/entities/removal-step.entity';
import { ComboEligibleEntity } from '../infrastructure/persistence/entities/combo-eligible.entity';
import { CategoryEntity } from '../../categories/infrastructure/persistence/entities/category.entity';
import { ServiceLangEntity } from '../infrastructure/persistence/entities/service-lang.entity';
import { LanguageEntity } from '../../shared/domain/entities/language.entity';
import { CreateServiceDto, UpdateServiceDto } from './dto';
import { Op, QueryTypes } from 'sequelize';
import { AddOnEntity } from '../../addons/infrastructure/persistence/entities/addon.entity';
import { Sequelize } from 'sequelize-typescript';

interface ServiceFilters {
  page: number;
  limit: number;
  search?: string;
  category?: string;
  isActive?: boolean;
}

interface PaginationOptions {
  page?: number;
  limit?: number;
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class ServicesService {
  private readonly logger = new Logger(ServicesService.name);

  constructor(
    @InjectModel(ServiceEntity)
    private readonly serviceModel: typeof ServiceEntity,
    @InjectModel(AddOnEntity)
    private readonly addOnModel: typeof AddOnEntity,
    @InjectModel(ServiceIncompatibilityEntity)
    private readonly serviceIncompatibilityModel: typeof ServiceIncompatibilityEntity,
    @InjectModel(RemovalStepEntity)
    private readonly removalStepModel: typeof RemovalStepEntity,
    @InjectModel(ComboEligibleEntity)
    private readonly comboEligibleModel: typeof ComboEligibleEntity,
    @InjectModel(ServiceLangEntity)
    private readonly serviceLangModel: typeof ServiceLangEntity,
    @InjectModel(LanguageEntity)
    private readonly languageModel: typeof LanguageEntity,
    private readonly sequelize: Sequelize,
  ) { }

  /**
   * Apply translations to a service entity based on language code
   */
  private async applyServiceTranslations(
    service: ServiceEntity,
    languageCode?: string,
  ): Promise<ServiceEntity> {
    if (!languageCode || languageCode.toUpperCase() === 'EN') {
      // No translation needed for English or if no language specified
      return service;
    }

    try {
      // Find the language by code
      const language = await this.languageModel.findOne({
        where: { code: languageCode.toUpperCase(), isActive: true },
      });

      if (!language) {
        this.logger.warn(`Language ${languageCode} not found, returning original`);
        return service;
      }

      // Find translation for this service
      const translation = await this.serviceLangModel.findOne({
        where: {
          serviceId: service.id,
          languageId: language.id,
        },
      });

      if (translation) {
        // Apply translation to service
        service.name = translation.title;
        service.description = translation.description;
      }
    } catch (error) {
      this.logger.error(`Error applying translations: ${error.message}`);
    }

    return service;
  }

  /**
   * Apply translations to multiple services
   */
  private async applyServicesTranslations(
    services: ServiceEntity[],
    languageCode?: string,
  ): Promise<ServiceEntity[]> {
    if (!languageCode || languageCode.toUpperCase() === 'EN') {
      return services;
    }

    return Promise.all(
      services.map((service) => this.applyServiceTranslations(service, languageCode)),
    );
  }

  async create(createServiceDto: CreateServiceDto): Promise<ServiceEntity> {

    const serviceData = {
      name: createServiceDto.name,
      description: createServiceDto.description,
      categoryId: createServiceDto.categoryId,
      price: createServiceDto.price,
      duration: createServiceDto.duration,
      bufferTime: createServiceDto.bufferTime ?? 15,
      isActive: createServiceDto.isActive ?? true,
      isPopular: createServiceDto.isPopular ?? false,
      requirements: createServiceDto.requirements ?? [],
      compatibleAddOns: createServiceDto.compatibleAddOns ?? [],
      displayOrder: createServiceDto.displayOrder ?? 0,
      imageUrl: createServiceDto.imageUrl,
    };

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const createdService = await this.serviceModel.create(serviceData as any);

    return createdService;
  }

  async findAll(
    filters: Omit<ServiceFilters, 'page' | 'limit'>,
    pagination: PaginationOptions = {},
    languageCode?: string,
  ): Promise<PaginatedResponse<ServiceEntity>> {
    const { search, category, isActive } = filters;
    const page = pagination.page || 1;
    const limit = pagination.limit || 10;

    const offset = (page - 1) * limit;
    const whereClause: Record<string, any> = {};

    if (search) {
      whereClause.name = { [Op.iLike]: `%${search}%` };
    }

    if (category) {
      whereClause.categoryId = category;
    }

    if (typeof isActive === 'boolean') {
      whereClause.isActive = isActive;
    }

    const { rows: data, count: total } = await this.serviceModel.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: CategoryEntity,
          as: 'categoryRelation',
          attributes: ['id', 'name', 'displayOrder']
        }
      ],
      order: [['displayOrder', 'ASC'], ['name', 'ASC']],
      limit,
      offset,
      raw: false,
    });

    // Apply translations if language code is provided
    const translatedData = await this.applyServicesTranslations(data, languageCode);

    return {
      data: translatedData,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getCategories(): Promise<CategoryEntity[]> {
    try {
      // Obtener todas las categorías activas desde la tabla categories
      const categories = await CategoryEntity.findAll({
        where: { isActive: true },
        order: [['displayOrder', 'ASC']]
      });

      return categories;
    } catch (error) {
      this.logger.error('Error fetching categories:', error);
      return [];
    }
  }

  async findCategories(): Promise<CategoryEntity[]> {
    return this.getCategories();
  }

  async findOne(id: string): Promise<ServiceEntity> {
    const service = await this.serviceModel.findByPk(id, {
      include: [
        {
          model: CategoryEntity,
          as: 'categoryRelation',
          attributes: ['id', 'name', 'displayOrder']
        }
      ]
    });
    if (!service) {
      throw new NotFoundException(`Service with ID ${id} not found`);
    }
    return service;
  }

  async update(id: string, updateServiceDto: UpdateServiceDto): Promise<ServiceEntity> {

    const service = await this.findOne(id);
    await service.update(updateServiceDto);
    return service;
  }

  async remove(id: string): Promise<{ message: string }> {

    // Verificar que el servicio existe primero
    const service = await this.findOne(id);

    // Usar el modelo directamente para eliminar paranoid:true no me dejaba
    const deletedCount = await this.serviceModel.destroy({
      where: { id }
    });

    if (deletedCount === 0) {
      this.logger.error(`Failed to delete service with ID: ${id}`);
      throw new NotFoundException(`Service with ID ${id} could not be deleted`);
    }
    return { message: `Service with ID ${id} has been deleted` };
  }

  async getAddonsByServiceIds(serviceIds: string[]): Promise<AddOnEntity[]> {

    if (!serviceIds || serviceIds.length === 0) {
      return [];
    }

    try {
      // Use raw SQL query to get add-ons by service IDs
      const placeholders = serviceIds.map(() => '?').join(',');
      const query = `
        SELECT DISTINCT a.*
        FROM addons a
        INNER JOIN service_addons sa ON a.id = sa.addon_id
        INNER JOIN services s ON sa.service_id = s.id
        WHERE s.id IN (${placeholders})
          AND a."deletedAt" IS NULL
          AND a."isActive" = true
          AND a.removal = false
          AND s."deletedAt" IS NULL
        ORDER BY a."displayOrder" ASC, a.name ASC
      `;

      const addOns = await this.sequelize.query(query, {
        replacements: serviceIds,
        type: QueryTypes.SELECT,
        model: AddOnEntity,
        mapToModel: true
      });
      return addOns;
    } catch (error) {
      this.logger.error('Error fetching add-ons by service IDs:', error);
      throw error;
    }
  }

  async getRemovalAddonsByServiceIds(serviceIds: string[]): Promise<AddOnEntity[]> {

    if (!serviceIds || serviceIds.length === 0) {
      return [];
    }

    try {
      // Use raw SQL query to get ONLY removal add-ons by service IDs
      const placeholders = serviceIds.map(() => '?').join(',');
      const query = `
        SELECT DISTINCT a.*
        FROM addons a
        INNER JOIN service_addons sa ON a.id = sa.addon_id
        INNER JOIN services s ON sa.service_id = s.id
        WHERE s.id IN (${placeholders})
          AND a."deletedAt" IS NULL
          AND a."isActive" = true
          AND a.removal = true
          AND s."deletedAt" IS NULL
        ORDER BY a."displayOrder" ASC, a.name ASC
      `;

      const addOns = await this.sequelize.query(query, {
        replacements: serviceIds,
        type: QueryTypes.SELECT,
        model: AddOnEntity,
        mapToModel: true
      });
      return addOns;
    } catch (error) {
      this.logger.error('Error fetching removal add-ons by service IDs:', error);
      throw error;
    }
  }

  async getIncompatibleCategories(categoryIds: string[]): Promise<string[]> {

    if (!categoryIds || categoryIds.length === 0) {
      return [];
    }

    try {
      const incompatibilities = await this.serviceIncompatibilityModel.findAll({
        where: {
          categoryId: {
            [Op.in]: categoryIds,
          },
        },
        attributes: ['incompatibleCategoryId'],
      });

      const incompatibleCategoryIds = incompatibilities.map(
        (inc) => inc.incompatibleCategoryId,
      );

      // Remove duplicates
      const uniqueIncompatibleIds = [...new Set(incompatibleCategoryIds)];
      return uniqueIncompatibleIds;
    } catch (error) {
      this.logger.error('Error fetching incompatible categories:', error);
      throw error;
    }
  }

  async requiresRemovalStep(categoryIds: string[]): Promise<boolean> {
    if (!categoryIds || categoryIds.length === 0) {
      return false;
    }

    try {
      const removalCategories = await this.removalStepModel.findAll({
        where: {
          categoryId: {
            [Op.in]: categoryIds,
          },
        },
      });

      const requiresRemoval = removalCategories.length > 0;

      return requiresRemoval;
    } catch (error) {
      this.logger.error('Error checking removal step requirement:', error);
      throw error;
    }
  }

  /**
   * Check if the given service IDs match any combo eligible rule
   * Returns the matching rule with suggested combo if found
   */
  async checkComboEligible(serviceIds: string[]): Promise<{
    isEligible: boolean;
    matchedRule?: ComboEligibleEntity;
    suggestedCombo?: ServiceEntity;
  }> {
    if (!serviceIds || serviceIds.length === 0) {
      return { isEligible: false };
    }

    try {
      // Sort service IDs to ensure consistent comparison
      const sortedServiceIds = [...serviceIds].sort();

      // Find all active combo eligible rules
      const rules = await this.comboEligibleModel.findAll({
        where: { isActive: true },
      });

      // Check each rule to see if it matches the provided service IDs
      for (const rule of rules) {
        const ruleServiceIds = [...rule.serviceIds].sort();

        // Check if the arrays are equal (same services selected)
        if (
          sortedServiceIds.length === ruleServiceIds.length &&
          sortedServiceIds.every((id, index) => id === ruleServiceIds[index])
        ) {
          // Found a matching rule
          let suggestedCombo: ServiceEntity | undefined;

          if (rule.suggestedComboId) {
            suggestedCombo = await this.serviceModel.findByPk(rule.suggestedComboId) ?? undefined;
          }

          return {
            isEligible: true,
            matchedRule: rule,
            suggestedCombo,
          };
        }
      }

      return { isEligible: false };
    } catch (error) {
      this.logger.error('Error checking combo eligibility:', error);
      throw error;
    }
  }

  /**
   * Get all active combo eligible rules
   */
  async getAllComboEligibleRules(): Promise<ComboEligibleEntity[]> {
    try {
      return await this.comboEligibleModel.findAll({
        where: { isActive: true },
        order: [['createdAt', 'ASC']],
      });
    } catch (error) {
      this.logger.error('Error fetching combo eligible rules:', error);
      throw error;
    }
  }
}