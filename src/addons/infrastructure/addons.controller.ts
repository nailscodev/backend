import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Headers,
  NotFoundException,
  BadRequestException,
  HttpStatus,
  ValidationPipe,
  ParseUUIDPipe,
  ParseIntPipe,
  HttpCode,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { Op, QueryTypes } from 'sequelize';
import { InjectModel } from '@nestjs/sequelize';
import { AddOnEntity } from './persistence/entities/addon.entity';
import { AddOnLangEntity } from './persistence/entities/addon-lang.entity';
import { LanguageEntity } from '../../shared/domain/entities/language.entity';
import { CreateAddOnDto } from '../application/dto/create-addon.dto';
import { UpdateAddOnDto } from '../application/dto/update-addon.dto';

@ApiTags('addons')
@Controller('addons')
export class AddOnsController {
  private readonly logger = new Logger(AddOnsController.name);

  constructor(
    @InjectModel(AddOnEntity)
    private addOnModel: typeof AddOnEntity,
    @InjectModel(AddOnLangEntity)
    private addOnLangModel: typeof AddOnLangEntity,
    @InjectModel(LanguageEntity)
    private languageModel: typeof LanguageEntity,
  ) { }

  /**
   * Apply translations to an addon entity based on language code
   */
  private async applyAddonTranslations(
    addon: AddOnEntity,
    languageCode?: string,
  ): Promise<AddOnEntity> {
    if (!languageCode || languageCode.toUpperCase() === 'EN') {
      return addon;
    }

    try {
      const language = await this.languageModel.findOne({
        where: { code: languageCode.toUpperCase(), isActive: true },
      });

      if (!language) {
        this.logger.warn(`Language ${languageCode} not found, returning original`);
        return addon;
      }

      const translation = await this.addOnLangModel.findOne({
        where: {
          addonId: addon.id,
          languageId: language.id,
        },
      });

      if (translation) {
        addon.name = translation.title;
        addon.description = translation.description;
      }
    } catch (error) {
      this.logger.error(`Error applying translations: ${error.message}`);
    }

    return addon;
  }

  /**
   * Apply translations to multiple addons
   */
  private async applyAddonsTranslations(
    addons: AddOnEntity[],
    languageCode?: string,
  ): Promise<AddOnEntity[]> {
    if (!languageCode || languageCode.toUpperCase() === 'EN') {
      return addons;
    }

    return Promise.all(
      addons.map((addon) => this.applyAddonTranslations(addon, languageCode)),
    );
  }

  @Get()
  @ApiOperation({
    summary: 'Get all add-ons',
    description: 'Retrieve a paginated list of add-ons with optional filtering by active status or compatible service.',
  })
  @ApiQuery({ name: 'page', required: false, type: 'number', description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: 'number', description: 'Items per page (default: 10, max: 100)' })
  @ApiQuery({ name: 'isActive', required: false, type: 'boolean', description: 'Filter by active status' })
  @ApiQuery({ name: 'serviceId', required: false, type: 'string', description: 'Filter by compatible service ID' })
  @ApiQuery({ name: 'search', required: false, type: 'string', description: 'Search in name and description' })
  @ApiQuery({ name: 'lang', required: false, type: 'string', description: 'Language code (EN or ES)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Add-ons retrieved successfully',
    type: [AddOnEntity],
  })
  async findAll(
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 10,
    @Query('isActive') isActive?: string,
    @Query('serviceId') serviceId?: string,
    @Query('search') search?: string,
    @Query('lang') lang?: string,
    @Headers('accept-language') acceptLanguage?: string,
  ) {
    const where: Record<string, any> = {};

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    // By default, exclude removal add-ons (unless explicitly requested)
    where.removal = false;

    if (serviceId) {
      where.compatibleServiceIds = {
        [Op.contains]: [serviceId],
      };
    }

    if (search) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      (where as any)[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
      ];
    }

    // Limit pagination
    const maxLimit = 100;
    const actualLimit = Math.min(limit, maxLimit);

    const { rows: addOns, count: total } = await this.addOnModel.findAndCountAll({
      where,
      offset: (page - 1) * actualLimit,
      limit: actualLimit,
      order: [['displayOrder', 'ASC'], ['name', 'ASC']],
    });

    // Use lang query param, or fall back to accept-language header
    const languageCode = lang || acceptLanguage?.split(',')[0]?.split('-')[0];

    // Apply translations if language code is provided
    const translatedAddOns = await this.applyAddonsTranslations(addOns, languageCode);

    return {
      success: true,
      data: translatedAddOns,
      pagination: {
        page,
        limit: actualLimit,
        total,
        totalPages: Math.ceil(total / actualLimit),
        hasNextPage: page < Math.ceil(total / actualLimit),
        hasPrevPage: page > 1,
      },
    };
  }

  @Get('compatible/:serviceId')
  @ApiOperation({
    summary: 'Get add-ons compatible with a service',
    description: 'Retrieve add-ons that are compatible with a specific service.',
  })
  @ApiParam({
    name: 'serviceId',
    type: 'string',
    description: 'Service unique identifier (UUID)',
  })
  @ApiQuery({ name: 'lang', required: false, type: 'string', description: 'Language code (EN or ES)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Compatible add-ons retrieved successfully',
    type: [AddOnEntity],
  })
  async getCompatibleWithService(
    @Param('serviceId', new ParseUUIDPipe()) serviceId: string,
    @Query('lang') lang?: string,
    @Headers('accept-language') acceptLanguage?: string,
  ) {
    const addOns = await this.addOnModel.findAll({
      where: {
        isActive: true,
        removal: false, // Only show non-removal add-ons
        compatibleServiceIds: {
          [Op.contains]: [serviceId],
        },
      },
      order: [['displayOrder', 'ASC'], ['name', 'ASC']],
    });

    // Use lang query param, or fall back to accept-language header
    const languageCode = lang || acceptLanguage?.split(',')[0]?.split('-')[0];

    // Apply translations if language code is provided
    const translatedAddOns = await this.applyAddonsTranslations(addOns, languageCode);

    return {
      success: true,
      data: translatedAddOns,
    };
  }

  @Get('incompatibilities/:addonIds')
  @ApiOperation({
    summary: 'Get incompatible add-ons for given add-on IDs',
    description: 'Retrieves the list of add-on IDs that are incompatible with the provided add-on IDs',
  })
  @ApiParam({
    name: 'addonIds',
    type: 'string',
    description: 'Comma-separated list of add-on UUIDs',
    example: 'uuid1,uuid2,uuid3'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Incompatible add-on IDs retrieved successfully',
  })
  async getIncompatibleAddons(
    @Param('addonIds') addonIds: string,
  ) {
    if (!addonIds) {
      return {
        success: true,
        data: [],
      };
    }

    const addonIdArray = addonIds.split(',').map(id => id.trim());

    // Query addon_incompatibilities table
    const sequelize = this.addOnModel.sequelize;
    if (!sequelize) {
      throw new Error('Sequelize instance not available');
    }

    const incompatibilities = await sequelize.query(
      `
      SELECT DISTINCT incompatible_addon_id
      FROM addon_incompatibilities
      WHERE addon_id IN (:addonIds)
      `,
      {
        replacements: { addonIds: addonIdArray },
        type: QueryTypes.SELECT,
      }
    );

    const incompatibleIds = (incompatibilities as any[]).map(row => row.incompatible_addon_id);

    return {
      success: true,
      data: incompatibleIds,
    };
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get add-on by ID',
    description: 'Retrieve a specific add-on by its unique identifier.',
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    description: 'Add-on unique identifier (UUID)',
  })
  @ApiQuery({ name: 'lang', required: false, type: 'string', description: 'Language code (EN or ES)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Add-on retrieved successfully',
    type: AddOnEntity,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Add-on not found',
  })
  async findOne(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Query('lang') lang?: string,
    @Headers('accept-language') acceptLanguage?: string,
  ) {
    const addOn = await this.addOnModel.findByPk(id);

    if (!addOn) {
      throw new NotFoundException(`Add-on with ID ${id} not found`);
    }

    // Use lang query param, or fall back to accept-language header
    const languageCode = lang || acceptLanguage?.split(',')[0]?.split('-')[0];

    // Apply translation if language code is provided
    const translatedAddOn = await this.applyAddonTranslations(addOn, languageCode);

    return {
      success: true,
      data: translatedAddOn,
    };
  }

  @Post()
  @ApiOperation({
    summary: 'Create a new add-on',
    description: 'Creates a new add-on with the provided information.',
  })
  @ApiBody({
    type: CreateAddOnDto,
    description: 'Add-on creation data',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Add-on has been created successfully',
    type: AddOnEntity,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body(new ValidationPipe({ transform: true })) createAddOnDto: CreateAddOnDto,
  ) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const addOn = await this.addOnModel.create(createAddOnDto as any);

      return {
        success: true,
        data: addOn,
        message: 'Add-on created successfully',
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException('Error creating add-on: ' + errorMessage);
    }
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Update an add-on',
    description: 'Updates an existing add-on with the provided information.',
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    description: 'Add-on unique identifier (UUID)',
  })
  @ApiBody({
    type: UpdateAddOnDto,
    description: 'Add-on update data',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Add-on has been updated successfully',
    type: AddOnEntity,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Add-on not found',
  })
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body(new ValidationPipe({ transform: true })) updateAddOnDto: UpdateAddOnDto,
  ) {
    const addOn = await this.addOnModel.findByPk(id);

    if (!addOn) {
      throw new NotFoundException(`Add-on with ID ${id} not found`);
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      await addOn.update(updateAddOnDto as any);

      return {
        success: true,
        data: addOn,
        message: 'Add-on updated successfully',
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException('Error updating add-on: ' + errorMessage);
    }
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete an add-on',
    description: 'Soft deletes an add-on (sets deletedAt timestamp).',
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    description: 'Add-on unique identifier (UUID)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Add-on has been deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Add-on not found',
  })
  async remove(@Param('id', new ParseUUIDPipe()) id: string) {
    const addOn = await this.addOnModel.findByPk(id);

    if (!addOn) {
      throw new NotFoundException(`Add-on with ID ${id} not found`);
    }

    try {
      await addOn.destroy(); // Soft delete due to paranoid: true

      return {
        success: true,
        message: 'Add-on deleted successfully',
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException('Error deleting add-on: ' + errorMessage);
    }
  }

  @Put(':id/activate')
  @ApiOperation({
    summary: 'Activate an add-on',
    description: 'Sets an add-on as active.',
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    description: 'Add-on unique identifier (UUID)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Add-on activated successfully',
  })
  async activate(@Param('id', new ParseUUIDPipe()) id: string) {
    const addOn = await this.addOnModel.findByPk(id);

    if (!addOn) {
      throw new NotFoundException(`Add-on with ID ${id} not found`);
    }

    await addOn.update({ isActive: true });

    return {
      success: true,
      data: addOn,
      message: 'Add-on activated successfully',
    };
  }

  @Put(':id/deactivate')
  @ApiOperation({
    summary: 'Deactivate an add-on',
    description: 'Sets an add-on as inactive.',
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    description: 'Add-on unique identifier (UUID)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Add-on deactivated successfully',
  })
  async deactivate(@Param('id', new ParseUUIDPipe()) id: string) {
    const addOn = await this.addOnModel.findByPk(id);

    if (!addOn) {
      throw new NotFoundException(`Add-on with ID ${id} not found`);
    }

    await addOn.update({ isActive: false });

    return {
      success: true,
      data: addOn,
      message: 'Add-on deactivated successfully',
    };
  }
}