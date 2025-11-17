import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ServiceEntity } from '../infrastructure/persistence/entities/service.entity';
import { ServiceIncompatibilityEntity } from '../infrastructure/persistence/entities/service-incompatibility.entity';
import { RemovalStepEntity } from '../infrastructure/persistence/entities/removal-step.entity';
import { CategoryEntity } from '../../categories/infrastructure/persistence/entities/category.entity';
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
    private readonly sequelize: Sequelize,
  ) { }

  async create(createServiceDto: CreateServiceDto): Promise<ServiceEntity> {
    this.logger.log(`Creating new service: ${createServiceDto.name}`);

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
    this.logger.log(`Service created successfully with ID: ${createdService.id}`);

    return createdService;
  }

  async findAll(
    filters: Omit<ServiceFilters, 'page' | 'limit'>,
    pagination: PaginationOptions = {}
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

    return {
      data,
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

      this.logger.log(`Found ${categories.length} categories in database`);

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
    this.logger.log(`Updating service with ID: ${id}`);

    const service = await this.findOne(id);
    await service.update(updateServiceDto);

    this.logger.log(`Service updated successfully: ${id}`);
    return service;
  }

  async remove(id: string): Promise<{ message: string }> {
    this.logger.log(`Deleting service with ID: ${id}`);

    // Verificar que el servicio existe primero
    const service = await this.findOne(id);
    this.logger.log(`Found service to delete: ${service.name} (ID: ${service.id})`);

    // Usar el modelo directamente para eliminar paranoid:true no me dejaba
    const deletedCount = await this.serviceModel.destroy({
      where: { id }
    });

    if (deletedCount === 0) {
      this.logger.error(`Failed to delete service with ID: ${id}`);
      throw new NotFoundException(`Service with ID ${id} could not be deleted`);
    }

    this.logger.log(`Service deleted successfully: ${id} (${deletedCount} row(s) affected)`);
    return { message: `Service with ID ${id} has been deleted` };
  }

  async getAddonsByServiceIds(serviceIds: string[]): Promise<AddOnEntity[]> {
    this.logger.log(`Getting add-ons for service IDs: ${serviceIds.join(', ')}`);

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
          AND s."deletedAt" IS NULL
        ORDER BY a."displayOrder" ASC, a.name ASC
      `;

      const addOns = await this.sequelize.query(query, {
        replacements: serviceIds,
        type: QueryTypes.SELECT,
        model: AddOnEntity,
        mapToModel: true
      });

      this.logger.log(`Found ${addOns.length} unique add-ons for the specified services`);
      return addOns;
    } catch (error) {
      this.logger.error('Error fetching add-ons by service IDs:', error);
      throw error;
    }
  }

  async getIncompatibleCategories(categoryIds: string[]): Promise<string[]> {
    this.logger.log(`Getting incompatible categories for: ${categoryIds.join(', ')}`);

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

      this.logger.log(`Found ${uniqueIncompatibleIds.length} incompatible categories`);
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
      this.logger.log(`Removal step required: ${requiresRemoval} for categories: ${categoryIds.join(', ')}`);

      return requiresRemoval;
    } catch (error) {
      this.logger.error('Error checking removal step requirement:', error);
      throw error;
    }
  }
}