import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpStatus,
  ValidationPipe,
  ParseUUIDPipe,
  ParseIntPipe,
  ParseBoolPipe,
  HttpCode,
  Header,
  BadRequestException,
  ServiceUnavailableException,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { StaffService } from '../../application/staff.service';
import { CreateStaffDto } from '../../application/dto/create-staff.dto';
import { UpdateStaffDto } from '../../application/dto/update-staff.dto';
import { StaffResponseDto } from '../../application/dto/staff-response.dto';
import { PaginatedStaffResponseDto } from '../../application/dto/paginated-staff-response.dto';
import { StaffStatisticsResponseDto } from '../../application/dto/staff-statistics-response.dto';
import { StaffRole, StaffStatus } from '../../domain/staff.types';
import { AppCacheService } from '../../../shared/cache/cache.service';

// Mock guard - replace with actual JWT guard when authentication is implemented
class MockJwtGuard {
  canActivate(): boolean {
    return true;
  }
}

@ApiTags('staff')
@Controller('staff')
@UseGuards(MockJwtGuard)
@ApiBearerAuth()
export class StaffController {
  private readonly logger = new Logger(StaffController.name);

  constructor(
    private readonly staffService: StaffService,
    private readonly cache: AppCacheService,
  ) { }

  /** Retry a DB operation; on exhaustion fall back to stale cache or throw 503. */
  private async retryDbQuery<T>(
    operation: () => Promise<T>,
    staleKey: string,
    label: string,
    maxAttempts = 6,
    delayMs = 2000,
  ): Promise<T> {
    let lastError: Error | null = null;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        this.logger.warn(`${label} DB attempt ${attempt}/${maxAttempts}: ${lastError.message}`);
        if (attempt < maxAttempts) {
          await new Promise(r => setTimeout(r, delayMs));
        }
      }
    }
    const stale = this.cache.getStale<T>(staleKey);
    if (stale) {
      this.logger.warn(`${label}: serving stale data after ${maxAttempts} DB retries`);
      return stale;
    }
    const msg = lastError?.message ?? 'Unknown error';
    this.logger.error(`${label}: all DB retries exhausted — ${msg}`);
    throw new ServiceUnavailableException(`${label} temporarily unavailable: ${msg}`);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new staff member',
    description: 'Creates a new staff member'
  })
  @ApiBody({ type: CreateStaffDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Staff member created successfully',
    type: StaffResponseDto
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data'
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Staff member with this email already exists'
  })
  async createStaff(
    @Body(ValidationPipe) createStaffDto: CreateStaffDto,
  ): Promise<StaffResponseDto> {
    return await this.staffService.createStaff(createStaffDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all staff members',
    description: 'Retrieves paginated list of staff members with optional filters'
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 10, max: 100)' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search by name or email' })
  @ApiQuery({ name: 'role', required: false, enum: StaffRole, description: 'Filter by role' })
  @ApiQuery({ name: 'status', required: false, enum: StaffStatus, description: 'Filter by status' })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean, description: 'Filter by active status' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Staff members retrieved successfully',
    type: PaginatedStaffResponseDto
  })
  async findAllStaff(
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('search') search?: string,
    @Query('role') role?: StaffRole,
    @Query('status') status?: StaffStatus,
    @Query('isActive', new ParseBoolPipe({ optional: true })) isActive?: boolean,
  ): Promise<PaginatedStaffResponseDto> {
    return await this.staffService.findAllStaff(
      { page: page || 1, limit: limit || 10 },
      { search, role, status, isActive }
    );
  }

  @Get('available')
  @Header('Cache-Control', 'public, max-age=120, stale-while-revalidate=240')
  @ApiOperation({
    summary: 'Get available staff members',
    description: 'Retrieves staff members who are active and available for bookings, optionally filtered by service IDs'
  })
  @ApiQuery({
    name: 'serviceIds',
    required: false,
    type: [String],
    description: 'Array of service UUIDs to filter staff by',
    example: ['service-uuid-1', 'service-uuid-2']
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Available staff members retrieved successfully',
    type: [StaffResponseDto]
  })
  async findAvailableStaff(
    @Query('serviceIds') serviceIds?: string | string[]
  ): Promise<StaffResponseDto[]> {
    const key = `staff:available:${Array.isArray(serviceIds) ? serviceIds.sort().join(',') : (serviceIds || '')}`;
    const cached = this.cache.get<StaffResponseDto[]>(key);
    if (cached) return cached;

    return this.retryDbQuery(
      async () => {
        let result: StaffResponseDto[];
        if (serviceIds) {
          const serviceIdArray = Array.isArray(serviceIds)
            ? serviceIds
            : serviceIds.split(',').map(id => id.trim());
          result = await this.staffService.findStaffByServiceIds(serviceIdArray);
        } else {
          result = await this.staffService.findAvailableStaff();
        }
        this.cache.set(key, result, 120); // 2 min TTL
        return result;
      },
      key,
      'findAvailableStaff',
    );
  }

  @Get('statistics')
  @ApiOperation({
    summary: 'Get staff statistics',
    description: 'Retrieves statistical information about staff members'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Staff statistics retrieved successfully',
    type: StaffStatisticsResponseDto
  })
  async getStaffStatistics(): Promise<StaffStatisticsResponseDto> {
    return await this.staffService.getStaffStatistics();
  }

  @Get('by-service/:serviceId')
  @ApiOperation({
    summary: 'Get staff members by service',
    description: 'Retrieves staff members who can perform a specific service'
  })
  @ApiParam({ name: 'serviceId', type: String, description: 'Service UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Staff members retrieved successfully',
    type: [StaffResponseDto]
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid service ID'
  })
  async findStaffByService(
    @Param('serviceId', ParseUUIDPipe) serviceId: string,
  ): Promise<StaffResponseDto[]> {
    return await this.staffService.findStaffByServiceId(serviceId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get staff member by ID',
    description: 'Retrieves a specific staff member by their ID'
  })
  @ApiParam({ name: 'id', type: String, description: 'Staff member UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Staff member retrieved successfully',
    type: StaffResponseDto
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Staff member not found'
  })
  async findStaffById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<StaffResponseDto> {
    return await this.staffService.findStaffById(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update staff member',
    description: 'Updates an existing staff member'
  })
  @ApiParam({ name: 'id', type: String, description: 'Staff member UUID' })
  @ApiBody({ type: UpdateStaffDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Staff member updated successfully',
    type: StaffResponseDto
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Staff member not found'
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data'
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Email already in use by another staff member'
  })
  async updateStaff(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) updateStaffDto: UpdateStaffDto,
  ): Promise<StaffResponseDto> {
    const result = await this.staffService.updateStaff(id, updateStaffDto);
    this.cache.deleteByPrefix('staff:');
    return result;
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete staff member',
    description: 'Permanently deletes a staff member'
  })
  @ApiParam({ name: 'id', type: String, description: 'Staff member UUID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Staff member deleted successfully'
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Staff member not found'
  })
  async deleteStaff(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.staffService.deleteStaff(id);
    this.cache.deleteByPrefix('staff:');
  }

  @Patch(':id/activate')
  @ApiOperation({
    summary: 'Activate staff member',
    description: 'Activates a staff member (sets status to ACTIVE)'
  })
  @ApiParam({ name: 'id', type: String, description: 'Staff member UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Staff member activated successfully',
    type: StaffResponseDto
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Staff member not found'
  })
  async activateStaff(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<StaffResponseDto> {
    return await this.staffService.activateStaff(id);
  }

  @Patch(':id/deactivate')
  @ApiOperation({
    summary: 'Deactivate staff member',
    description: 'Deactivates a staff member (sets status to INACTIVE)'
  })
  @ApiParam({ name: 'id', type: String, description: 'Staff member UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Staff member deactivated successfully',
    type: StaffResponseDto
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Staff member not found'
  })
  async deactivateStaff(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<StaffResponseDto> {
    return await this.staffService.deactivateStaff(id);
  }

  // Staff-service relationship endpoints
  // Implementation pending
  // These methods were temporarily removed during database refactoring
}