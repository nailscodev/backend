import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
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
  ): Promise<PaginatedResponse<ServiceEntity>> {
    return this.servicesService.findAll(
      { search, category, isActive },
      { page: page || 1, limit: Math.min(limit || 10, 100) }
    );
  }

  @Get('list')
  @SkipResponseWrapper(true)
  @ApiOperation({
    summary: 'Get all services as simple array',
    description: 'Retrieves all active services as a simple array for frontend consumption'
  })
  @ApiQuery({ name: 'category', required: false, type: String, description: 'Filter by category' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Services retrieved successfully',
    type: [ServiceEntity]
  })
  async getServicesList(
    @Query('category') category?: string,
  ): Promise<ServiceEntity[]> {
    const result = await this.servicesService.findAll(
      { category, isActive: true },
      { page: 1, limit: 1000 } // Get all services
    );
    return result.data;
  }

  @Get('categories/list')
  @SkipResponseWrapper(true)
  @ApiOperation({
    summary: 'Get service categories',
    description: 'Retrieves list of unique service categories'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Categories retrieved successfully',
    type: [String]
  })
  async getCategories(): Promise<string[]> {
    return this.servicesService.getCategories();
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

  @Get(':id')
  @ApiOperation({
    summary: 'Get service by ID',
    description: 'Retrieves a specific service by its ID'
  })
  @ApiParam({ name: 'id', type: String, description: 'Service UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Service retrieved successfully'
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Service not found'
  })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<ServiceEntity> {
    return this.servicesService.findOne(id);
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
  async create(@Body(ValidationPipe) createServiceDto: CreateServiceDto): Promise<ServiceEntity> {
    this.logger.log(`Creating new service: ${createServiceDto.name}`);
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
    @Body(ValidationPipe) updateServiceDto: UpdateServiceDto,
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