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
  ValidationPipe,
  ParseUUIDPipe,
  ParseIntPipe,
  ParseBoolPipe,
  HttpStatus,
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

import { ServiceEntity } from './persistence/entities/service.entity';
import { CreateServiceDto, UpdateServiceDto } from '../application/dto';
import { ServicesService } from '../application/services.service';
import { SkipResponseWrapper } from '../../common/interceptors/response.interceptor';

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@ApiTags('services')
@Controller('services')
export class ServicesController {
  private readonly logger = new Logger(ServicesController.name);

  constructor(private readonly servicesService: ServicesService) { }

  @Get()
  @ApiOperation({
    summary: 'Get all services',
    description: 'Retrieves paginated list of services with optional filters'
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 10, max: 100)' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search by service name' })
  @ApiQuery({ name: 'category', required: false, type: String, description: 'Filter by category' })
  @ApiQuery({ name: 'is_active', required: false, type: Boolean, description: 'Filter by active status' })
  @ApiQuery({ name: 'lang', required: false, type: String, description: 'Language code (EN or ES)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Services retrieved successfully'
  })
  async findAll(
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('is_active', new ParseBoolPipe({ optional: true })) isActive?: boolean,
    @Query('lang') lang?: string,
    @Headers('accept-language') acceptLanguage?: string,
  ): Promise<PaginatedResponse<ServiceEntity>> {
    // Use lang query param, or fall back to accept-language header
    const languageCode = lang || acceptLanguage?.split(',')[0]?.split('-')[0];

    return this.servicesService.findAll(
      { search, category, isActive },
      { page: page || 1, limit: Math.min(limit || 10, 100) },
      languageCode
    );
  }

  @Get('list')
  @SkipResponseWrapper(true)
  @ApiOperation({
    summary: 'Get all services as simple array',
    description: 'Retrieves all active services as a simple array for frontend consumption'
  })
  @ApiQuery({ name: 'category', required: false, type: String, description: 'Filter by category' })
  @ApiQuery({ name: 'lang', required: false, type: String, description: 'Language code (EN or ES)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Services retrieved successfully',
    type: [ServiceEntity]
  })
  async getServicesList(
    @Query('category') category?: string,
    @Query('lang') lang?: string,
    @Headers('accept-language') acceptLanguage?: string,
  ): Promise<ServiceEntity[]> {
    // Use lang query param, or fall back to accept-language header
    const languageCode = lang || acceptLanguage?.split(',')[0]?.split('-')[0];

    const result = await this.servicesService.findAll(
      { category, isActive: true },
      { page: 1, limit: 1000 }, // Get all services
      languageCode
    );
    return result.data;
  }

  @Get('categories/list')
  @SkipResponseWrapper(true)
  @ApiOperation({
    summary: 'Get service categories',
    description: 'Retrieves list of unique service categories from database'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Categories retrieved successfully'
  })
  async getCategories() {
    return this.servicesService.getCategories();
  }

  @Get('categories/incompatibilities')
  @SkipResponseWrapper(true)
  @ApiOperation({
    summary: 'Get incompatible categories',
    description: 'Returns category IDs that are incompatible with the given category IDs'
  })
  @ApiQuery({
    name: 'categoryIds',
    required: true,
    type: String,
    description: 'Comma-separated list of category UUIDs',
    example: 'c1a2b3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d,c2b3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Incompatible categories retrieved successfully',
    schema: {
      type: 'array',
      items: { type: 'string', format: 'uuid' },
      example: ['c5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b', 'c6a7b8c9-d0e1-4f2a-3b4c-5d6e7f8a9b0c']
    }
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid category IDs format'
  })
  async getIncompatibleCategories(
    @Query('categoryIds') categoryIds: string,
  ): Promise<string[]> {
    if (!categoryIds) {
      return [];
    }

    const categoryIdArray = categoryIds.split(',').map(id => id.trim());

    return this.servicesService.getIncompatibleCategories(categoryIdArray);
  }

  @Get('categories/requires-removal')
  @SkipResponseWrapper(true)
  @ApiOperation({
    summary: 'Check if categories require removal step',
    description: 'Returns whether the given categories require showing the removal step in booking flow'
  })
  @ApiQuery({
    name: 'categoryIds',
    required: true,
    type: String,
    description: 'Comma-separated list of category UUIDs',
    example: 'c1a2b3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Removal step requirement checked successfully',
    schema: {
      type: 'object',
      properties: {
        requiresRemoval: { type: 'boolean', example: true }
      }
    }
  })
  async checkRemovalStepRequired(
    @Query('categoryIds') categoryIds: string,
  ): Promise<{ requiresRemoval: boolean }> {
    if (!categoryIds) {
      return { requiresRemoval: false };
    }

    const categoryIdArray = categoryIds.split(',').map(id => id.trim());

    const requiresRemoval = await this.servicesService.requiresRemovalStep(categoryIdArray);
    return { requiresRemoval };
  }

  @Get('addons/by-services')
  @SkipResponseWrapper(true)
  @ApiOperation({
    summary: 'Get add-ons by service IDs',
    description: 'Retrieves add-ons that are associated with the specified service IDs'
  })
  @ApiQuery({
    name: 'serviceIds',
    required: true,
    type: String,
    description: 'Comma-separated list of service UUIDs',
    example: 'uuid1,uuid2,uuid3'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Add-ons retrieved successfully'
  })
  async getAddonsByServices(
    @Query('serviceIds') serviceIds: string,
  ) {
    if (!serviceIds) {
      return [];
    }

    const serviceIdArray = serviceIds.split(',').map(id => id.trim());
    return await this.servicesService.getAddonsByServiceIds(serviceIdArray);
  }

  @Get('removal-addons/by-services')
  @SkipResponseWrapper(true)
  @ApiOperation({
    summary: 'Get removal add-ons by service IDs',
    description: 'Retrieves removal add-ons (removal=true) that are associated with the specified service IDs'
  })
  @ApiQuery({
    name: 'serviceIds',
    required: true,
    type: String,
    description: 'Comma-separated list of service UUIDs',
    example: 'uuid1,uuid2,uuid3'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Removal add-ons retrieved successfully'
  })
  async getRemovalAddonsByServices(
    @Query('serviceIds') serviceIds: string,
  ) {
    if (!serviceIds) {
      return [];
    }

    const serviceIdArray = serviceIds.split(',').map(id => id.trim());
    return await this.servicesService.getRemovalAddonsByServiceIds(serviceIdArray);
  }

  @Get('combo-eligible/check')
  @SkipResponseWrapper(true)
  @ApiOperation({
    summary: 'Check combo eligibility',
    description: 'Checks if the given service IDs match any combo eligible rule'
  })
  @ApiQuery({
    name: 'serviceIds',
    required: true,
    type: String,
    description: 'Comma-separated list of service UUIDs to check',
    example: 'uuid1,uuid2'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Combo eligibility checked successfully',
    schema: {
      type: 'object',
      properties: {
        isEligible: { type: 'boolean', example: true },
        matchedRule: {
          type: 'object',
          description: 'The matching combo eligible rule if found',
        },
        suggestedCombo: {
          type: 'object',
          description: 'The suggested combo service to offer',
        }
      }
    }
  })
  async checkComboEligible(
    @Query('serviceIds') serviceIds: string,
  ) {
    if (!serviceIds) {
      return { isEligible: false };
    }

    const serviceIdArray = serviceIds.split(',').map(id => id.trim());
    return this.servicesService.checkComboEligible(serviceIdArray);
  }

  @Get('combo-eligible/rules')
  @SkipResponseWrapper(true)
  @ApiOperation({
    summary: 'Get all combo eligible rules',
    description: 'Retrieves all active combo eligible rules'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Combo eligible rules retrieved successfully',
  })
  async getComboEligibleRules() {
    return this.servicesService.getAllComboEligibleRules();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get service by ID',
    description: 'Retrieves a specific service by its ID'
  })
  @ApiParam({ name: 'id', type: String, description: 'Service UUID' })
  @ApiQuery({
    name: 'lang',
    required: false,
    description: 'Language code for translations (EN, ES)',
    example: 'EN'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Service retrieved successfully'
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Service not found'
  })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('lang') lang?: string
  ): Promise<ServiceEntity> {
    return this.servicesService.findOne(id, lang);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new service',
    description: 'Creates a new service with the provided data'
  })
  @ApiBody({ type: CreateServiceDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Service created successfully'
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data'
  })
  async create(@Body() createServiceDto: CreateServiceDto): Promise<ServiceEntity> {
    return this.servicesService.create(createServiceDto);
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Update service',
    description: 'Updates an existing service with new data'
  })
  @ApiParam({ name: 'id', type: String, description: 'Service UUID' })
  @ApiBody({ type: UpdateServiceDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Service updated successfully'
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Service not found'
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data'
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateServiceDto: UpdateServiceDto,
  ): Promise<ServiceEntity> {
    return this.servicesService.update(id, updateServiceDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete service',
    description: 'Permanently deletes a service'
  })
  @ApiParam({ name: 'id', type: String, description: 'Service UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Service deleted successfully'
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Service not found'
  })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<{ message: string }> {
    return this.servicesService.remove(id);
  }
}