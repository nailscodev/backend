import { Injectable, NotFoundException, ConflictException, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, WhereOptions, literal } from 'sequelize';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { StaffResponseDto } from './dto/staff-response.dto';
import { StaffStatisticsResponseDto } from './dto/staff-statistics-response.dto';
import { PaginatedStaffResponseDto } from './dto/paginated-staff-response.dto';
import { StaffEntity } from '../infrastructure/persistence/entities/staff.entity';
import { StaffRole, StaffStatus } from '../infrastructure/persistence/entities/staff.entity';
import { ServiceEntity } from '../../services/infrastructure/persistence/entities/service.entity';
import { BookingEntity } from '../../booking/infrastructure/persistence/entities/booking.entity';

interface PaginationParams {
  page: number;
  limit: number;
}

interface StaffFilters {
  search?: string;
  role?: StaffRole;
  status?: StaffStatus;
  isActive?: boolean;
}

@Injectable()
export class StaffService {
  private readonly logger = new Logger(StaffService.name);
  private readonly DEFAULT_PAGE = 1;
  private readonly DEFAULT_LIMIT = 10;
  private readonly MAX_LIMIT = 100;

  constructor(
    @InjectModel(StaffEntity)
    private readonly staffModel: typeof StaffEntity,
    @InjectModel(ServiceEntity)
    private readonly serviceModel: typeof ServiceEntity,
    @InjectModel(BookingEntity)
    private readonly bookingModel: typeof BookingEntity,
  ) { }

  /**
   * Creates a new staff member
   */
  async createStaff(createStaffDto: CreateStaffDto): Promise<StaffResponseDto> {

    // Check if email already exists
    const existingStaff = await this.staffModel.findOne({
      where: { email: createStaffDto.email.toLowerCase().trim() }
    });

    if (existingStaff) {
      throw new ConflictException('Staff member with this email already exists');
    }

    try {
      const staffData = {
        firstName: createStaffDto.firstName,
        lastName: createStaffDto.lastName,
        email: createStaffDto.email.toLowerCase().trim(),
        phone: createStaffDto.phone,
        role: createStaffDto.role,
        status: createStaffDto.status || StaffStatus.ACTIVE,
        specialties: createStaffDto.specialties || [],
        workingDays: createStaffDto.workingDays || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        startDate: createStaffDto.startDate ? new Date(createStaffDto.startDate) : undefined,
        bio: createStaffDto.bio,
        commissionPercentage: createStaffDto.commissionPercentage,
        hourlyRate: createStaffDto.hourlyRate,
        profilePictureUrl: createStaffDto.profilePictureUrl,
        notes: createStaffDto.notes,
        isBookable: createStaffDto.isBookable ?? true
      };

       
      const createdStaff = await this.staffModel.create(staffData as any);

      // Assign services if provided
      if (createStaffDto.serviceIds && createStaffDto.serviceIds.length > 0) {
        await this.assignServicesToStaff(createdStaff.id, createStaffDto.serviceIds);
      }

      return await this.mapToResponseDto(createdStaff);
    } catch (error: unknown) {
      this.logger.error('Failed to create staff member', error);
      throw new BadRequestException('Failed to create staff member');
    }
  }

  /**
   * Retrieves paginated list of staff members with optional filters
   */
  async findAllStaff(
    pagination: PaginationParams = { page: this.DEFAULT_PAGE, limit: this.DEFAULT_LIMIT },
    filters: StaffFilters = {}
  ): Promise<PaginatedStaffResponseDto> {

    const validatedPagination = this.validatePagination(pagination);
    const whereClause = this.buildWhereClause(filters);

    try {
      const { rows: staff, count: total } = await this.staffModel.findAndCountAll({
        where: whereClause,
        offset: (validatedPagination.page - 1) * validatedPagination.limit,
        limit: validatedPagination.limit,
        order: [['lastName', 'ASC'], ['firstName', 'ASC']],
        include: [
          {
            model: this.serviceModel,
            as: 'services',
            attributes: ['id', 'name', 'duration', 'price'],
            through: { attributes: [] }
          }
        ]
      });

      const staffDtos = await Promise.all(staff.map(s => this.mapToResponseDto(s)));

      return {
        data: staffDtos,
        pagination: {
          page: validatedPagination.page,
          limit: validatedPagination.limit,
          total,
          pages: Math.ceil(total / validatedPagination.limit)
        }
      };
    } catch (error: unknown) {
      this.logger.error('Failed to retrieve staff', error);
      throw new BadRequestException('Failed to retrieve staff');
    }
  }

  /**
   * Finds a staff member by ID
   */
  async findStaffById(id: string): Promise<StaffResponseDto> {

    const staff = await this.staffModel.findByPk(id, {
      include: [
        {
          model: this.serviceModel,
          as: 'services',
          attributes: ['id', 'name', 'duration', 'price'],
          through: { attributes: [] }
        }
      ]
    });

    if (!staff) {
      throw new NotFoundException(`Staff member with ID ${id} not found`);
    }

    return await this.mapToResponseDto(staff);
  }

  /**
   * Finds a staff member by email
   */
  async findStaffByEmail(email: string): Promise<StaffResponseDto | null> {

    const staff = await this.staffModel.findOne({
      where: { email: email.toLowerCase().trim() }
    });

    return staff ? await this.mapToResponseDto(staff) : null;
  }

  /**
   * Finds all available staff members
   */
  async findAvailableStaff(): Promise<StaffResponseDto[]> {

    try {
      const staff = await this.staffModel.findAll({
        where: {
          status: StaffStatus.ACTIVE,
          isBookable: true
        },
        order: [['lastName', 'ASC'], ['firstName', 'ASC']],
        include: [
          {
            model: this.serviceModel,
            as: 'services',
            attributes: ['id', 'name', 'duration', 'price'],
            through: { attributes: [] }
          }
        ]
      });

      return await Promise.all(staff.map(s => this.mapToResponseDto(s)));
    } catch (error: unknown) {
      this.logger.error('Failed to retrieve available staff', error);
      throw new BadRequestException('Failed to retrieve available staff');
    }
  }

  /**
   * Finds staff members who can perform a specific service
   */
  async findStaffByServiceId(serviceId: string): Promise<StaffResponseDto[]> {

    try {
      const staff = await this.staffModel.findAll({
        include: [{
          model: ServiceEntity,
          where: { id: serviceId },
          attributes: [],
          through: { attributes: [] }
        }],
        where: {
          status: StaffStatus.ACTIVE
        },
        order: [['lastName', 'ASC'], ['firstName', 'ASC']]
      });

      return await Promise.all(staff.map(s => this.mapToResponseDto(s)));
    } catch (error: unknown) {
      this.logger.error(`Failed to find staff by service ID: ${serviceId}`, error);
      throw new BadRequestException('Failed to find staff by service');
    }
  }

  /**
   * Finds staff members who can perform AT LEAST ONE of the specified services
   * If a service is a combo, it expands to its associated services
   * Falls back to returning all available staff if staff_services has no data
   */
  async findStaffByServiceIds(serviceIds: string[]): Promise<StaffResponseDto[]> {
    this.logger.log(`Finding staff for services: ${serviceIds?.join(', ') || 'none'}`);

    // If no service IDs provided, return all available staff
    if (!serviceIds || serviceIds.length === 0) {
      this.logger.log('No service IDs provided, returning all available staff');
      return await this.findAvailableStaff();
    }

    try {
      // Expand combo services to their component services
      const expandedServiceIds = await this.expandComboServices(serviceIds);
      this.logger.log(`Expanded service IDs: ${expandedServiceIds.join(', ')}`);

      // Find staff members who can perform AT LEAST ONE of the specified services
      // For VIP combo, two different technicians can each do one service
      const staff = await this.staffModel.findAll({
        where: {
          status: StaffStatus.ACTIVE,
          isBookable: true,
          id: {
            [Op.in]: literal(`(
              SELECT DISTINCT staff_id FROM staff_services 
              WHERE service_id IN ('${expandedServiceIds.join("','")}')
            )`)
          }
        },
        order: [['lastName', 'ASC'], ['firstName', 'ASC']]
      });

      this.logger.log(`Found ${staff.length} staff members who can perform at least one of ${expandedServiceIds.length} services`);

      // If no staff found, return empty array (don't fall back)
      if (staff.length === 0) {
        this.logger.warn('No staff found who can perform any of the selected services');
        return [];
      }

      return await Promise.all(staff.map(s => this.mapToResponseDto(s)));
    } catch (error: unknown) {
      this.logger.error('Error finding staff by service IDs, falling back to all available', error);
      // Only fall back on actual errors, not on "no results"
      return await this.findAvailableStaff();
    }
  }

  /**
   * Expands combo services to their associated service IDs
   * If a service has associatedServiceIds (is a combo), return those instead of the combo ID
   */
  private async expandComboServices(serviceIds: string[]): Promise<string[]> {
    const expandedIds: string[] = [];

    // Fetch all services to check which ones are combos
    const services = await this.serviceModel.findAll({
      where: { id: { [Op.in]: serviceIds } },
      attributes: ['id', 'name', 'associatedServiceIds']
    });

    for (const serviceId of serviceIds) {
      const service = services.find(s => s.id === serviceId);
      
      if (service && service.associatedServiceIds && service.associatedServiceIds.length > 0) {
        // This is a combo - use its associated services instead
        this.logger.log(`Service ${service.name} (${serviceId}) is a combo, expanding to: ${service.associatedServiceIds.join(', ')}`);
        expandedIds.push(...service.associatedServiceIds);
      } else {
        // Regular service - keep as is
        expandedIds.push(serviceId);
      }
    }

    // Remove duplicates
    return [...new Set(expandedIds)];
  }

  /**
   * Updates an existing staff member
   */
  async updateStaff(id: string, updateStaffDto: UpdateStaffDto): Promise<StaffResponseDto> {

    const existingStaff = await this.findStaffEntityById(id);

    if (updateStaffDto.email && updateStaffDto.email !== existingStaff.email) {
      await this.validateEmailUniqueness(updateStaffDto.email, id);
    }

    this.validateBusinessRules(updateStaffDto);

    try {
      const updateData = this.prepareUpdateData(updateStaffDto);
      await existingStaff.update(updateData);

      // Update services if provided
      if (updateStaffDto.serviceIds !== undefined) {
        await this.assignServicesToStaff(id, updateStaffDto.serviceIds);
      }

      return await this.mapToResponseDto(existingStaff);
    } catch (error: unknown) {
      this.logger.error(`Failed to update staff member: ${id}`, error);
      throw new BadRequestException('Failed to update staff member');
    }
  }

  /**
   * Deletes a staff member (soft delete)
   */
  async deleteStaff(id: string): Promise<void> {

    const staff = await this.findStaffEntityById(id);

    try {
      await staff.destroy();
    } catch (error: unknown) {
      this.logger.error(`Failed to delete staff member: ${id}`, error);
      throw new BadRequestException('Failed to delete staff member');
    }
  }

  /**
   * Activates a staff member
   */
  async activateStaff(id: string): Promise<StaffResponseDto> {
    return await this.updateStaffStatus(id, StaffStatus.ACTIVE);
  }

  /**
   * Deactivates a staff member
   */
  async deactivateStaff(id: string): Promise<StaffResponseDto> {
    return await this.updateStaffStatus(id, StaffStatus.INACTIVE);
  }

  /**
   * Gets staff statistics
   */
  async getStaffStatistics(): Promise<StaffStatisticsResponseDto> {

    try {
      const [totalStaff, activeStaff, inactiveStaff, onVacationStaff, sickLeaveStaff] = await Promise.all([
        this.staffModel.count(),
        this.staffModel.count({ where: { status: StaffStatus.ACTIVE } }),
        this.staffModel.count({ where: { status: StaffStatus.INACTIVE } }),
        this.staffModel.count({ where: { status: StaffStatus.ON_VACATION } }),
        this.staffModel.count({ where: { status: StaffStatus.SICK_LEAVE } })
      ]);

      const availableStaff = await this.staffModel.count({
        where: {
          status: StaffStatus.ACTIVE,
          isBookable: true
        }
      });

      return {
        totalStaff,
        activeStaff,
        inactiveStaff,
        onVacationStaff,
        sickLeaveStaff,
        availableStaff,
        utilizationRate: totalStaff > 0 ? Math.round((availableStaff / totalStaff) * 100) : 0
      };
    } catch (error: unknown) {
      this.logger.error('Failed to get staff statistics', error);
      throw new BadRequestException('Failed to get staff statistics');
    }
  }

  // Private helper methods

  private async findStaffEntityById(id: string): Promise<StaffEntity> {
    const staff = await this.staffModel.findByPk(id);
    if (!staff) {
      throw new NotFoundException(`Staff member with ID ${id} not found`);
    }
    return staff;
  }

  private async updateStaffStatus(id: string, status: StaffStatus): Promise<StaffResponseDto> {
    const staff = await this.findStaffEntityById(id);

    try {
      await staff.update({ status });
      return await this.mapToResponseDto(staff);
    } catch (error: unknown) {
      this.logger.error(`Failed to update staff status: ${id}`, error);
      throw new BadRequestException('Failed to update staff status');
    }
  }

  private validatePagination(pagination: PaginationParams): PaginationParams {
    const page = Math.max(1, pagination.page || this.DEFAULT_PAGE);
    const limit = Math.min(Math.max(1, pagination.limit || this.DEFAULT_LIMIT), this.MAX_LIMIT);
    return { page, limit };
  }

  private buildWhereClause(filters: StaffFilters): WhereOptions<StaffEntity> {
    const where: WhereOptions<StaffEntity> = {};

    if (filters.search?.trim()) {
       
      (where as any)[Op.or] = [
        { firstName: { [Op.iLike]: `%${filters.search.trim()}%` } },
        { lastName: { [Op.iLike]: `%${filters.search.trim()}%` } },
        { email: { [Op.iLike]: `%${filters.search.trim()}%` } }
      ];
    }

    if (filters.role) {
       
      (where as any).role = filters.role;
    }

    if (filters.status) {
       
      (where as any).status = filters.status;
    }

    if (filters.isActive !== undefined) {
      if (filters.isActive) {
         
        (where as any).status = StaffStatus.ACTIVE;
      } else {
         
        (where as any).status = { [Op.ne]: StaffStatus.ACTIVE };
      }
    }

    return where;
  }

  private async validateEmailUniqueness(email: string, excludeId?: string): Promise<void> {
    const normalizedEmail = email.toLowerCase().trim();
    const whereClause: WhereOptions<StaffEntity> = { email: normalizedEmail };

    if (excludeId) {
       
      (whereClause as any).id = { [Op.ne]: excludeId };
    }

    const existingStaff = await this.staffModel.findOne({ where: whereClause });

    if (existingStaff) {
      throw new ConflictException('Staff member with this email already exists');
    }
  }

  private validateBusinessRules(staffDto: CreateStaffDto | UpdateStaffDto): void {
    if (staffDto.commissionPercentage !== undefined) {
      if (staffDto.commissionPercentage < 0 || staffDto.commissionPercentage > 100) {
        throw new BadRequestException('Commission percentage must be between 0 and 100');
      }
    }

    if (staffDto.hourlyRate !== undefined && staffDto.hourlyRate < 0) {
      throw new BadRequestException('Hourly rate cannot be negative');
    }

    if (staffDto.startDate && 'endDate' in staffDto && staffDto.endDate) {
      if (new Date(staffDto.startDate) > new Date(staffDto.endDate)) {
        throw new BadRequestException('Start date cannot be after end date');
      }
    }
  }

  private prepareStaffData(createStaffDto: CreateStaffDto): Partial<StaffEntity> {
    return {
      ...createStaffDto,
      email: createStaffDto.email.toLowerCase().trim(),
      firstName: createStaffDto.firstName.trim(),
      lastName: createStaffDto.lastName.trim(),
      phone: createStaffDto.phone?.trim(),
      role: createStaffDto.role || StaffRole.TECHNICIAN,
      status: createStaffDto.status || StaffStatus.ACTIVE,
      isBookable: createStaffDto.isBookable ?? true,
      startDate: createStaffDto.startDate ? new Date(createStaffDto.startDate) : new Date(),
      specialties: createStaffDto.specialties?.filter(Boolean) || [],

    };
  }

  private prepareUpdateData(updateStaffDto: UpdateStaffDto): Partial<StaffEntity> {
    const updateData: Partial<StaffEntity> = {};

    if (updateStaffDto.email !== undefined) {
      updateData.email = updateStaffDto.email.toLowerCase().trim();
    }
    if (updateStaffDto.firstName !== undefined) {
      updateData.firstName = updateStaffDto.firstName.trim();
    }
    if (updateStaffDto.lastName !== undefined) {
      updateData.lastName = updateStaffDto.lastName.trim();
    }
    if (updateStaffDto.phone !== undefined) {
      updateData.phone = updateStaffDto.phone?.trim();
    }
    if (updateStaffDto.role !== undefined) {
      updateData.role = updateStaffDto.role;
    }
    if (updateStaffDto.status !== undefined) {
      updateData.status = updateStaffDto.status;
    }
    if (updateStaffDto.isBookable !== undefined) {
      updateData.isBookable = updateStaffDto.isBookable;
    }
    if (updateStaffDto.startDate !== undefined) {
      updateData.startDate = updateStaffDto.startDate ? new Date(updateStaffDto.startDate) : undefined;
    }
    if (updateStaffDto.endDate !== undefined) {
      updateData.endDate = updateStaffDto.endDate ? new Date(updateStaffDto.endDate) : undefined;
    }
    if (updateStaffDto.specialties !== undefined) {
      updateData.specialties = updateStaffDto.specialties?.filter(Boolean) || [];
    }
    if (updateStaffDto.workingDays !== undefined) {
      updateData.workingDays = updateStaffDto.workingDays?.filter(Boolean) || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    }

    if (updateStaffDto.commissionPercentage !== undefined) {
      updateData.commissionPercentage = updateStaffDto.commissionPercentage;
    }
    if (updateStaffDto.hourlyRate !== undefined) {
      updateData.hourlyRate = updateStaffDto.hourlyRate;
    }
    if (updateStaffDto.bio !== undefined) {
      updateData.bio = updateStaffDto.bio;
    }
    if (updateStaffDto.profilePictureUrl !== undefined) {
      updateData.profilePictureUrl = updateStaffDto.profilePictureUrl;
    }
    if (updateStaffDto.notes !== undefined) {
      updateData.notes = updateStaffDto.notes;
    }

    return updateData;
  }

  /**
   * Assigns services to a staff member
   * Replaces all existing service assignments
   */
  private async assignServicesToStaff(staffId: string, serviceIds: string[]): Promise<void> {
    try {
      // Get the staff instance with services
      const staff = await this.staffModel.findByPk(staffId);
      if (!staff) {
        throw new NotFoundException(`Staff member with ID ${staffId} not found`);
      }

      // Verify all services exist
      if (serviceIds.length > 0) {
        const services = await this.serviceModel.findAll({
          where: { id: { [Op.in]: serviceIds } }
        });

        if (services.length !== serviceIds.length) {
          throw new BadRequestException('One or more service IDs are invalid');
        }
      }

      // Use Sequelize's setServices to replace all associations
      // This will delete old relationships and create new ones
      await staff.$set('services', serviceIds);

      this.logger.log(`Assigned ${serviceIds.length} services to staff ${staffId}`);
    } catch (error: unknown) {
      this.logger.error(`Failed to assign services to staff ${staffId}`, error);
      throw error instanceof BadRequestException || error instanceof NotFoundException
        ? error
        : new BadRequestException('Failed to assign services to staff');
    }
  }

  private async mapToResponseDto(staff: StaffEntity): Promise<StaffResponseDto> {
    const services = staff.services ? staff.services.map(service => ({
      id: service.id,
      name: service.name,
      duration: service.duration,
      price: service.price
    })) : [];

    // Count pending bookings (in_progress, pending, rescheduled)
    const pendingBookingsCount = await this.bookingModel.count({
      where: {
        staffId: staff.id,
        status: {
          [Op.in]: ['in_progress', 'pending', 'rescheduled']
        }
      }
    });

    // Count completed bookings
    const completedBookingsCount = await this.bookingModel.count({
      where: {
        staffId: staff.id,
        status: 'completed'
      }
    });

    return {
      id: staff.id,
      firstName: staff.firstName,
      lastName: staff.lastName,
      fullName: `${staff.firstName} ${staff.lastName}`,
      email: staff.email,
      phone: staff.phone,
      role: staff.role,
      status: staff.status,

      specialties: staff.specialties || [],
      workingDays: staff.workingDays || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      commissionPercentage: staff.commissionPercentage,
      hourlyRate: staff.hourlyRate,
      startDate: staff.startDate,
      endDate: staff.endDate,
      bio: staff.bio,
      profilePictureUrl: staff.profilePictureUrl,
      notes: staff.notes,
      isBookable: staff.isBookable,
      isActive: staff.status === StaffStatus.ACTIVE,
      isAvailable: staff.status === StaffStatus.ACTIVE && staff.isBookable,
      createdAt: staff.createdAt,
      updatedAt: staff.updatedAt,
      services: services,
      servicesCount: services.length,
      pendingBookingsCount: pendingBookingsCount,
      completedBookingsCount: completedBookingsCount
    };
  }
}