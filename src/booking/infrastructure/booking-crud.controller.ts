import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  NotFoundException,
  BadRequestException,
  HttpException,
  InternalServerErrorException,
  HttpStatus,
  ValidationPipe,
  ParseUUIDPipe,
  ParseIntPipe,
  HttpCode,
  ConflictException,
  Inject,
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
import { Op, QueryTypes, Transaction } from 'sequelize';
import { InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { BookingEntity } from './persistence/entities/booking.entity';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { BookingStatus } from '../domain/value-objects/booking-status.vo';
import { Public } from '../../common/decorators/public.decorator';
import { RequireAuth } from '../../common/decorators/require-auth.decorator';
import { BookingListItemDto } from './dto/booking-list-item.dto';
import { UpcomingBookingDto } from './dto/upcoming-booking.dto';
import { MailService } from '../../common/services/mail.service';
import { AuditService } from '../../common/services/audit.service';
import { CustomerEntity } from '../../customers/infrastructure/persistence/entities/customer.entity';
import { ServiceEntity } from '../../services/infrastructure/persistence/entities/service.entity';
import { AddOnEntity } from '../../addons/infrastructure/persistence/entities/addon.entity';
import { bookingConfirmationEmail } from '../../common/templates/booking-confirmation-email';

interface StaffMember {
  id: string;
  firstName: string;
  lastName: string;
}

interface AvailableStaffMember {
  id: string;
  name: string;
  workloadMinutes: number;
}

@ApiTags('bookings')
@Controller('bookings')
export class BookingCrudController {
  private readonly logger = new Logger(BookingCrudController.name);

  constructor(
    @InjectModel(BookingEntity)
    private bookingModel: typeof BookingEntity,
    @InjectModel(CustomerEntity)
    private customerModel: typeof CustomerEntity,
    @InjectModel(ServiceEntity)
    private serviceModel: typeof ServiceEntity,
    @InjectModel(AddOnEntity)
    private addOnModel: typeof AddOnEntity,
    private sequelize: Sequelize,
    @Inject(MailService)
    private mailService: MailService,
    private auditService: AuditService,
  ) { }

  private async sendBookingConfirmationEmail(booking: BookingEntity, dto: CreateBookingDto): Promise<void> {
    try {
      if (!dto.customerId) return;

      const customer = await this.customerModel.findByPk(dto.customerId);
      if (!customer?.email) return;

      const services: Array<{ name: string; price: number }> = [];

      if (dto.serviceId) {
        const service = await this.serviceModel.findByPk(dto.serviceId);
        if (service) {
          services.push({ name: service.name, price: service.price });
        }
      }

      if (dto.addOnIds?.length) {
        const addOns = await this.addOnModel.findAll({ where: { id: dto.addOnIds } });
        for (const addOn of addOns) {
          services.push({ name: addOn.name, price: addOn.price });
        }
      }

      const html = bookingConfirmationEmail({
        customerFirstName: customer.firstName,
        appointmentDate: dto.appointmentDate,
        startTime: dto.startTime,
        endTime: dto.endTime,
        services,
        totalPrice: services.reduce((sum, s) => sum + s.price, 0),
      });

      await this.mailService.sendMail({
        to: customer.email,
        subject: 'Your Appointment is Confirmed – N&CO. MIDTOWN',
        html,
      });
    } catch (err) {
      this.logger.error(`Failed to send booking confirmation email: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  /**
   * Validates that [startTime, endTime) on appointmentDate falls within an active
   * shift for the given staff member.  Handles both the new weekly-keyed JSONB
   * format `{ monday: [{shiftStart, shiftEnd}] }` and the legacy flat-array format.
   */
  private async checkStaffShift(
    staffId: string,
    appointmentDate: string,
    startTime: string,
    endTime: string,
  ): Promise<{ valid: boolean; reason?: string }> {
    const staffRows = await this.sequelize.query<{ shifts: any }>(  
      `SELECT shifts FROM staff WHERE id = :staffId LIMIT 1`,
      { replacements: { staffId }, type: QueryTypes.SELECT, raw: true },
    );
    if (!staffRows.length) return { valid: false, reason: 'Staff member not found' };

    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayOfWeek = dayNames[new Date(`${appointmentDate}T12:00:00`).getDay()];

    const parseTime = (t: string) => {
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m;
    };

    let rawShifts = staffRows[0].shifts;
    if (typeof rawShifts === 'string') {
      try { rawShifts = JSON.parse(rawShifts); } catch { rawShifts = null; }
    }

    let dayShifts: Array<{ shiftStart: string; shiftEnd: string }> = [];
    if (rawShifts && typeof rawShifts === 'object' && !Array.isArray(rawShifts)) {
      // New weekly format: { monday: [{shiftStart, shiftEnd}], ... }
      dayShifts = rawShifts[dayOfWeek] || [];
    } else if (Array.isArray(rawShifts)) {
      // Legacy flat-array format — applies to all days
      dayShifts = rawShifts;
    }

    if (dayShifts.length === 0) {
      return { valid: false, reason: `Staff does not work on ${dayOfWeek}` };
    }

    const slotStart = parseTime(startTime.substring(0, 5));
    const slotEnd   = parseTime(endTime.substring(0, 5));
    const withinShift = dayShifts.some(
      s => slotStart >= parseTime(s.shiftStart) && slotEnd <= parseTime(s.shiftEnd),
    );

    return withinShift
      ? { valid: true }
      : { valid: false, reason: 'Requested time is outside staff working hours' };
  }

  @RequireAuth()
  @Get()
  @ApiOperation({
    summary: 'Get all bookings',
    description: 'Retrieve a paginated list of bookings with optional filtering by status, customer, staff, or date.',
  })
  @ApiQuery({ name: 'page', required: false, type: 'number', description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: 'number', description: 'Items per page (default: 10, max: 100)' })
  @ApiQuery({ name: 'status', required: false, enum: BookingStatus, description: 'Filter by booking status' })
  @ApiQuery({ name: 'customerId', required: false, type: 'string', description: 'Filter by customer ID (UUID)' })
  @ApiQuery({ name: 'staffId', required: false, type: 'string', description: 'Filter by staff ID (UUID)' })
  @ApiQuery({ name: 'serviceId', required: false, type: 'string', description: 'Filter by service ID (UUID)' })
  @ApiQuery({ name: 'date', required: false, type: 'string', description: 'Filter by date (YYYY-MM-DD format)' })
  @ApiQuery({ name: 'startDate', required: false, type: 'string', description: 'Filter by start date range (YYYY-MM-DD format)' })
  @ApiQuery({ name: 'endDate', required: false, type: 'string', description: 'Filter by end date range (YYYY-MM-DD format)' })
  @ApiQuery({ name: 'search', required: false, type: 'string', description: 'Search in booking ID or notes' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Bookings retrieved successfully',
  })
  async findAll(
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 10,
    @Query('status') status?: BookingStatus,
    @Query('customerId') customerId?: string,
    @Query('staffId') staffId?: string,
    @Query('serviceId') serviceId?: string,
    @Query('date') date?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('search') search?: string,
  ) {
    const where: Record<string, any> = {};

    if (status) {
      where.status = status;
    }

    if (customerId) {
      where.customerId = customerId;
    }

    if (staffId) {
      where.staffId = staffId;
    }

    if (serviceId) {
      where.serviceId = serviceId;
    }

    if (search) {
      (where as any)[Op.or] = [
        {
          id: {
            [Op.iLike]: `%${search}%`
          }
        },
        {
          notes: {
            [Op.iLike]: `%${search}%`
          }
        }
      ];
    }

    if (date) {
      where.appointmentDate = date;
    }

    // Add date range filter
    if (startDate && endDate) {
      where.appointmentDate = {
        [Op.between]: [startDate, endDate],
      };
    }

    // Limit pagination
    const maxLimit = 100;
    const actualLimit = Math.min(limit, maxLimit);

    const { rows: bookings, count: total } = await this.bookingModel.findAndCountAll({
      where,
      offset: (page - 1) * actualLimit,
      limit: actualLimit,
      order: [['appointmentDate', 'ASC'], ['startTime', 'ASC']]
    });

    return {
      success: true,
      data: bookings,
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

  @RequireAuth()
  @Get('list')
  @ApiOperation({
    summary: 'Get bookings list with full details',
    description: 'Retrieve a paginated list of bookings with customer, service, and staff information.',
  })
  @ApiQuery({ name: 'page', required: false, type: 'number', description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: 'number', description: 'Items per page (default: 10, max: 100)' })
  @ApiQuery({ name: 'status', required: false, enum: BookingStatus, description: 'Filter by booking status' })
  @ApiQuery({ name: 'startDate', required: false, type: 'string', description: 'Filter by start date range (YYYY-MM-DD format)' })
  @ApiQuery({ name: 'endDate', required: false, type: 'string', description: 'Filter by end date range (YYYY-MM-DD format)' })
  @ApiQuery({ name: 'search', required: false, type: 'string', description: 'Search in booking ID, customer name, email, staff name, or notes' })
  @ApiQuery({ name: 'customerId', required: false, type: 'string', description: 'Filter by customer ID' })
  @ApiQuery({ name: 'staffId', required: false, type: 'string', description: 'Filter by staff ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Bookings list retrieved successfully',
    type: [BookingListItemDto],
  })
  async getBookingsList(
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 10,
    @Query('status') status?: BookingStatus,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('search') search?: string,
    @Query('customerId') customerId?: string,
    @Query('staffId') staffId?: string,
  ) {
    // Build WHERE conditions
    const whereConditions: string[] = ['1=1'];
    const replacements: Record<string, any> = {};

    if (status) {
      whereConditions.push(`b.status = :status`);
      replacements.status = status;
    }

    if (customerId) {
      whereConditions.push(`b."customerId" = :customerId`);
      replacements.customerId = customerId;
    }

    if (staffId) {
      whereConditions.push(`b."staffId" = :staffId`);
      replacements.staffId = staffId;
    }

    if (startDate && endDate) {
      whereConditions.push(`b."appointmentDate" BETWEEN :startDate AND :endDate`);
      replacements.startDate = startDate;
      replacements.endDate = endDate;
    } else if (startDate) {
      whereConditions.push(`b."appointmentDate" >= :startDate`);
      replacements.startDate = startDate;
    } else if (endDate) {
      whereConditions.push(`b."appointmentDate" <= :endDate`);
      replacements.endDate = endDate;
    }

    if (search) {
      whereConditions.push(`(
        b.id::text ILIKE :search OR
        CONCAT(COALESCE(c."firstName", ''), ' ', COALESCE(c."lastName", '')) ILIKE :search OR
        COALESCE(c.email, '') ILIKE :search OR
        COALESCE(b.notes, '') ILIKE :search OR
        CONCAT(COALESCE(st."firstName", ''), ' ', COALESCE(st."lastName", '')) ILIKE :search
      )`);
      replacements.search = `%${search}%`;
    }

    const whereClause = whereConditions.join(' AND ');

    // Limit pagination
    const maxLimit = 100;
    const actualLimit = Math.min(limit, maxLimit);
    const offset = (page - 1) * actualLimit;

    replacements.limit = actualLimit;
    replacements.offset = offset;

    // Get total count
    const countResult: any[] = await this.sequelize.query(
      `
      SELECT COUNT(*) as total
      FROM bookings b
      LEFT JOIN customers c ON b."customerId" = c.id
      LEFT JOIN staff st ON b."staffId" = st.id
      WHERE ${whereClause}
      `,
      {
        replacements,
        type: QueryTypes.SELECT,
      },
    );

    const total = parseInt(countResult[0]?.total || '0');

    // Get bookings with full details
    const result: any[] = await this.sequelize.query(
      `
      SELECT 
        b.id,
        CASE 
          WHEN c.id IS NULL THEN '[BREAK]'
          ELSE CONCAT(c."firstName", ' ', c."lastName")
        END as "customerName",
        c.email as "customerEmail",
        c.phone as "customerPhone",
        CASE 
          WHEN s.id IS NULL THEN 'Break/Pause'
          ELSE s.name
        END as "serviceName",
        cat.id as "categoryId",
        CASE 
          WHEN cat.id IS NULL THEN 'Break'
          ELSE cat.name
        END as "categoryName",
        CONCAT(st."firstName", ' ', st."lastName") as "staffName",
        b."appointmentDate",
        b."startTime",
        b."endTime",
        b.status,
        b."paymentMethod",
        b."totalPrice",
        b.web,
        b.notes,
        b."cancellationReason",
        b."createdAt"
      FROM bookings b
      LEFT JOIN customers c ON b."customerId" = c.id
      LEFT JOIN services s ON b."serviceId" = s.id
      LEFT JOIN categories cat ON s.category_id = cat.id
      LEFT JOIN staff st ON b."staffId" = st.id
      WHERE ${whereClause}
      ORDER BY b."appointmentDate" DESC, b."startTime" DESC
      LIMIT :limit OFFSET :offset
      `,
      {
        replacements,
        type: QueryTypes.SELECT,
      },
    );

    const bookings: BookingListItemDto[] = result.map(row => ({
      id: row.id,
      customerName: row.customerName,
      customerEmail: row.customerEmail,
      customerPhone: row.customerPhone,
      serviceName: row.serviceName,
      categoryId: row.categoryId,
      categoryName: row.categoryName,
      staffName: row.staffName,
      appointmentDate: row.appointmentDate,
      startTime: row.startTime,
      endTime: row.endTime,
      status: row.status,
      paymentMethod: row.paymentMethod,
      totalPrice: parseFloat(row.totalPrice || '0'),
      web: row.web,
      notes: row.notes,
      cancellationReason: row.cancellationReason,
      createdAt: row.createdAt,
    }));

    return {
      success: true,
      data: bookings,
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

  @RequireAuth()
  @Get('upcoming')
  @ApiOperation({
    summary: 'Get upcoming bookings',
    description: 'Retrieve upcoming in-progress bookings starting from now.',
  })
  @ApiQuery({ name: 'limit', required: false, type: 'number', description: 'Number of bookings to return (default: 10)' })
  @ApiQuery({ name: 'lang', required: false, type: 'string', description: 'Language code (EN/ES, default: EN)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Upcoming bookings retrieved successfully',
    type: [UpcomingBookingDto],
  })
  async getUpcomingBookings(
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 10,
    @Query('lang') lang: string = 'EN',
  ): Promise<{ success: boolean; data: UpcomingBookingDto[] }> {
    const langRowsUp = await this.sequelize.query<{ id: string }>(
      `SELECT id FROM languages WHERE code = :lang LIMIT 1`,
      { replacements: { lang }, type: QueryTypes.SELECT },
    );
    const langIdUp = langRowsUp[0]?.id ?? null;

    const result: any[] = await this.sequelize.query(
      `
      SELECT 
        b.id,
        CASE 
          WHEN c.id IS NULL THEN '[BREAK]'
          ELSE CONCAT(c."firstName", ' ', c."lastName")
        END as "customerName",
        CASE 
          WHEN s.id IS NULL THEN 'Break/Pause'
          ELSE COALESCE(sl.title, s.name)
        END as "serviceName",
        CONCAT(st."firstName", ' ', st."lastName") as "staffName",
        b."appointmentDate",
        b."startTime",
        b.status,
        b."totalPrice"
      FROM bookings b
      LEFT JOIN customers c ON b."customerId" = c.id
      LEFT JOIN services s ON b."serviceId" = s.id
      LEFT JOIN services_lang sl ON s.id = sl.service_id 
        AND sl.language_id = :langId
      INNER JOIN staff st ON b."staffId" = st.id
      WHERE b.status IN ('pending', 'in_progress')
      ORDER BY b."appointmentDate" ASC, b."startTime" ASC
      LIMIT :limit
      `,
      {
        replacements: { limit, langId: langIdUp },
        type: QueryTypes.SELECT,
      },
    );

    const upcomingBookings = result.map(row => ({
      id: row.id,
      customerName: row.customerName,
      serviceName: row.serviceName,
      staffName: row.staffName,
      appointmentDate: row.appointmentDate,
      startTime: row.startTime,
      status: row.status,
      totalPrice: parseFloat(row.totalPrice || '0'),
    }));

    return {
      success: true,
      data: upcomingBookings,
    };
  }

  @Post('create-multiple')
  @ApiOperation({
    summary: 'Create multiple bookings atomically',
    description: 'Create multiple bookings in a single transaction. If any fails, all are rolled back.'
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        customerId: { type: 'string', format: 'uuid' },
        bookings: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              serviceId: { type: 'string', format: 'uuid' },
              staffId: { type: 'string', format: 'uuid' },
              appointmentDate: { type: 'string', format: 'date' },
              startTime: { type: 'string', format: 'date-time' },
              endTime: { type: 'string', format: 'date-time' },
              totalPrice: { type: 'number' },
              notes: { type: 'string' }
            }
          }
        }
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Bookings created successfully',
  })
  async createMultiple(
    @Body() body: {
      customerId: string;
      bookings: Array<{
        serviceId: string;
        staffId: string;
        appointmentDate: string;
        startTime: string;
        endTime: string;
        totalPrice: number;
        notes?: string;
      }>;
    }
  ) {
    if (!body.bookings || !Array.isArray(body.bookings) || body.bookings.length === 0) {
      throw new BadRequestException('bookings must be a non-empty array');
    }
    if (body.bookings.length > 20) {
      throw new BadRequestException('Cannot create more than 20 bookings in a single request');
    }
    // Atomic check-and-create: SERIALIZABLE transaction + advisory lock per slot.
    // Acquiring the lock before the conflict check prevents TOCTOU races where two
    // concurrent requests for the same slot both pass the check and both insert.
    const createdBookings = await this.sequelize.transaction(
      { isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE },
      async (t) => {
        // Acquire per-slot advisory locks first to serialise concurrent requests
        for (const bookingData of body.bookings) {
          const lockKey = `${bookingData.staffId}:${bookingData.appointmentDate}:${bookingData.startTime}`;
          await this.sequelize.query(
            'SELECT pg_advisory_xact_lock(hashtext(:lockKey))',
            { replacements: { lockKey }, transaction: t },
          );
        }

        // Validate that each slot falls within the assigned staff member's shift hours
        for (const slot of body.bookings) {
          const toHHMM = (t: string) => (t.includes('T') ? t.split('T')[1] : t).substring(0, 5);
          const shiftCheck = await this.checkStaffShift(
            slot.staffId,
            slot.appointmentDate,
            toHHMM(slot.startTime),
            toHHMM(slot.endTime),
          );
          if (!shiftCheck.valid) {
            throw new BadRequestException(
              `Booking at ${toHHMM(slot.startTime)}: ${shiftCheck.reason ?? 'Requested time is outside staff working hours'}`,
            );
          }
        }

        // Verify availability INSIDE the locked transaction
        const conflicts: Array<{ staffId: string; startTime: string }> = [];
        for (const slot of body.bookings) {
          const existingBookings = await this.bookingModel.findAll({
            where: {
              staffId: slot.staffId,
              appointmentDate: slot.appointmentDate,
              status: { [Op.in]: ['pending', 'in_progress'] },
            },
            lock: t.LOCK.UPDATE,
            transaction: t,
          });
          for (const booking of existingBookings) {
            const slotStart = new Date(slot.startTime);
            const slotEnd = new Date(slot.endTime);
            const bookingStart = new Date(booking.startTime);
            const bookingEnd = new Date(booking.endTime);
            if (slotStart < bookingEnd && slotEnd > bookingStart) {
              conflicts.push({ staffId: slot.staffId, startTime: slot.startTime });
              break;
            }
          }
        }

        if (conflicts.length > 0) {
          throw new ConflictException({
            message: 'One or more time slots are no longer available',
            conflicts,
          });
        }

        // Create all bookings within the secured transaction
        const created: BookingEntity[] = [];
        for (const bookingData of body.bookings) {
          const booking = await this.bookingModel.create(
            {
              customerId: body.customerId,
              serviceId: bookingData.serviceId,
              staffId: bookingData.staffId,
              appointmentDate: bookingData.appointmentDate,
              startTime: new Date(bookingData.startTime),
              endTime: new Date(bookingData.endTime),
              totalPrice: bookingData.totalPrice,
              status: BookingStatus.IN_PROGRESS,
              notes: bookingData.notes || '',
            } as any,
            { transaction: t },
          );
          created.push(booking);
        }
        return created;
      },
    );

    return {
      success: true,
      bookings: createdBookings,
    };
  }

  @Post('assign-optimal-staff')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Find optimal staff for "Any Artist" booking (internal — called during booking creation)',
    description: 'Assigns the best available staff member based on availability and workload for a specific date and time.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['date', 'time', 'duration'],
      properties: {
        date: { type: 'string', description: 'Date in YYYY-MM-DD format', example: '2024-10-23' },
        time: { type: 'string', description: 'Time in HH:MM format', example: '14:00' },
        duration: { type: 'number', description: 'Duration in minutes', example: 90 }
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Optimal staff member found and assigned',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        staffId: { type: 'string' },
        staffName: { type: 'string' },
        workload: { type: 'number', description: 'Total minutes worked this week' },
        reason: { type: 'string' }
      }
    }
  })
  async assignOptimalStaff(@Body() body: { date: string; time: string; duration: number }) {
    const { date, time, duration } = body;

    // Validate inputs
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new BadRequestException('Date must be in YYYY-MM-DD format');
    }
    if (!time || !/^\d{2}:\d{2}$/.test(time)) {
      throw new BadRequestException('Time must be in HH:MM format');
    }
    if (!duration || duration <= 0) {
      throw new BadRequestException('Duration must be a positive number');
    }

    // Calculate the week range for the given date
    const requestDate = new Date(date);
    const startOfWeek = new Date(requestDate);
    const dayOfWeek = startOfWeek.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Adjust so Monday = 0
    startOfWeek.setDate(startOfWeek.getDate() - daysToMonday);
    startOfWeek.setUTCHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    endOfWeek.setUTCHours(23, 59, 59, 999);

    // Get all active staff members
    const allActiveStaff: StaffMember[] = await this.sequelize.query(
      `SELECT id, "firstName", "lastName" FROM staff WHERE status = 'ACTIVE' AND "isBookable" = true`,
      {
        type: QueryTypes.SELECT,
        raw: true
      }
    );

    if (allActiveStaff.length === 0) {
      throw new BadRequestException('No active staff members available');
    }

    // Parse the requested slot as plain HH:MM strings — same as booking creation and
    // getBackofficeAvailability use. Never create Date objects for TIME columns to avoid
    // UTC offset bugs (the DB stores TIME without timezone).
    const parseTimeToMinutes = (t: string) => {
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m;
    };
    const requestStartMinutes = parseTimeToMinutes(time);
    const requestEndMinutes = requestStartMinutes + duration;
    // Pre-format end time as HH:MM for the shift helper
    const requestEndTimeStr = `${String(Math.floor(requestEndMinutes / 60)).padStart(2, '0')}:${String(requestEndMinutes % 60).padStart(2, '0')}`;

    // Find staff members who are available at the requested time
    const availableStaff: AvailableStaffMember[] = [];

    for (const staff of allActiveStaff) {
      // Skip staff whose shift does not cover the requested slot
      const shiftCheck = await this.checkStaffShift(staff.id, date, time, requestEndTimeStr);
      if (!shiftCheck.valid) continue;

      // Fetch all non-cancelled bookings for this staff on the requested date,
      // then compare times as plain minutes — no UTC Date objects.
      const dayBookings = await this.sequelize.query<{ startTime: string; endTime: string }>(

        `SELECT "startTime", "endTime" FROM bookings
         WHERE "staffId" = :staffId AND "appointmentDate" = :date
           AND status NOT IN ('cancelled', 'CANCELLED')`,
        { replacements: { staffId: staff.id, date }, type: QueryTypes.SELECT, raw: true }
      );

      const hasConflict = dayBookings.some(b => {
        const bStart = parseTimeToMinutes(String(b.startTime).substring(0, 5));
        const bEnd   = parseTimeToMinutes(String(b.endTime).substring(0, 5));
        return requestStartMinutes < bEnd && requestEndMinutes > bStart;
      });

      if (!hasConflict) {
        // Calculate weekly workload using the same string-arithmetic approach
        const weeklyBookings = await this.sequelize.query<{ startTime: string; endTime: string }>(
          `SELECT "startTime", "endTime" FROM bookings
           WHERE "staffId" = :staffId
             AND "appointmentDate" BETWEEN :weekStart AND :weekEnd
             AND status NOT IN ('cancelled', 'CANCELLED')`,
          {
            replacements: {
              staffId: staff.id,
              weekStart: startOfWeek.toISOString().split('T')[0],
              weekEnd: endOfWeek.toISOString().split('T')[0],
            },
            type: QueryTypes.SELECT,
            raw: true,
          }
        );

        // Calculate total workload in minutes using plain string parsing
        const totalWorkloadMinutes = weeklyBookings.reduce((sum, b) => {
          const bStart = parseTimeToMinutes(String(b.startTime).substring(0, 5));
          const bEnd   = parseTimeToMinutes(String(b.endTime).substring(0, 5));
          return sum + Math.max(0, bEnd - bStart);
        }, 0);

        availableStaff.push({
          id: staff.id,
          name: `${staff.firstName} ${staff.lastName}`,
          workloadMinutes: totalWorkloadMinutes
        });
      }
    }

    if (availableStaff.length === 0) {
      throw new BadRequestException('No staff members available at the requested time');
    }

    // Sort by workload (ascending) - staff with least workload first
    availableStaff.sort((a, b) => a.workloadMinutes - b.workloadMinutes);

    const optimalStaff = availableStaff[0];

    return {
      success: true,
      staffId: optimalStaff.id,
      staffName: optimalStaff.name,
      workload: optimalStaff.workloadMinutes,
      reason: `Selected staff member with lowest weekly workload (${optimalStaff.workloadMinutes} minutes). ${availableStaff.length} staff members were available.`
    };
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get booking by ID',
    description: 'Retrieve a specific booking by its unique identifier.',
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    description: 'Booking unique identifier (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Booking retrieved successfully',
    type: BookingEntity,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Booking not found',
  })
  async findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    const booking = await this.bookingModel.findByPk(id);

    if (!booking) {
      throw new NotFoundException(`Booking with ID ${id} not found`);
    }

    return booking;
  }

  @Public()
  @ApiOperation({
    summary: 'Create a new booking',
    description: 'Creates a new booking with the provided information. Validates time availability and service details.',
  })
  @ApiBody({
    type: CreateBookingDto,
    description: 'Booking creation data',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Booking has been created successfully',
    type: BookingEntity,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data or booking conflict',
  })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body(new ValidationPipe({ transform: true })) createBookingDto: CreateBookingDto,
  ) {
    try {
      // Frontend sends startTime as "HH:mm:ss", we store it directly as TIME
      const appointmentDate = createBookingDto.appointmentDate;

      // Handle "Any Available Technician" case - auto-assign optimal staff
      let assignedStaffId = createBookingDto.staffId;
      if (!createBookingDto.staffId || createBookingDto.staffId === 'any') {
        this.logger.debug('🔄 Auto-assigning staff for "any" selection...');
        
        // Calculate duration in minutes from time strings
        const parseTimeToMinutes = (timeStr: string) => {
          const [h, m] = timeStr.split(':').map(Number);
          return h * 60 + m;
        };
        const startMinutes = parseTimeToMinutes(createBookingDto.startTime);
        const endMinutes = parseTimeToMinutes(createBookingDto.endTime);
        const durationMinutes = endMinutes - startMinutes;
        
        try {
          const optimalStaffResult = await this.assignOptimalStaff({
            date: appointmentDate,
            time: createBookingDto.startTime,
            duration: durationMinutes
          });
          
          if (optimalStaffResult.success && optimalStaffResult.staffId) {
            assignedStaffId = optimalStaffResult.staffId;
            this.logger.debug(`✅ Auto-assigned staff: ${optimalStaffResult.staffName} (${assignedStaffId})`);
          } else {
            throw new BadRequestException('No staff members available at the requested time');
          }
        } catch (error) {
          this.logger.error(`Staff auto-assignment failed: ${error instanceof Error ? error.message : String(error)}`);
          throw new BadRequestException('Unable to assign staff automatically. Please select a specific staff member or try a different time.');
        }
      }

      // Compute totalPrice server-side — never trust the client-supplied value.
      // Fetch service price and add-on prices in parallel to cut one DB round-trip.
      let serverTotalPrice = 0;
      if (createBookingDto.serviceId) {
        const [service, addOns] = await Promise.all([
          this.serviceModel.findByPk(createBookingDto.serviceId, { attributes: ['price'] }),
          createBookingDto.addOnIds?.length
            ? this.addOnModel.findAll({ where: { id: createBookingDto.addOnIds }, attributes: ['price'] })
            : Promise.resolve([]),
        ]);
        if (service) {
          serverTotalPrice = Number((service as any).price) || 0;
          serverTotalPrice += addOns.reduce((sum, a) => sum + (Number((a as any).price) || 0), 0);
        }
      }

      // Set default status to 'in_progress' if not provided
      const bookingData = {
        ...createBookingDto,
        staffId: assignedStaffId,
        startTime: createBookingDto.startTime, // Just pass the time string "HH:MM:SS"
        endTime: createBookingDto.endTime, // Just pass the time string "HH:MM:SS"
        status: createBookingDto.status || 'in_progress',
        totalPrice: serverTotalPrice, // server-computed, ignores any client-supplied value
      };

      // Reject bookings that fall outside the staff member's shift hours
      if (!assignedStaffId) throw new InternalServerErrorException('Staff ID could not be resolved');
      const shiftCheck = await this.checkStaffShift(
        assignedStaffId,
        appointmentDate,
        createBookingDto.startTime,
        createBookingDto.endTime,
      );
      if (!shiftCheck.valid) {
        throw new BadRequestException(shiftCheck.reason ?? 'Requested time is outside staff working hours');
      }

      // Atomic check-and-create: PostgreSQL advisory lock + SERIALIZABLE transaction.
      // Advisory lock is keyed on staffId:date:startTime — concurrent requests for the
      // SAME slot wait here instead of racing through the availability check. This
      // solves the phantom-read issue that SERIALIZABLE alone can't prevent on an
      // initially-empty result set.
      const createdBooking = await this.sequelize.transaction(
        { isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE },
        async (t) => {
          // Acquire per-slot advisory lock — serialises concurrent inserts for the same slot
          const lockKey = `${assignedStaffId}:${createBookingDto.appointmentDate}:${createBookingDto.startTime}`;
          await this.sequelize.query(
            'SELECT pg_advisory_xact_lock(hashtext(:lockKey))',
            { replacements: { lockKey }, transaction: t },
          );

          // Check for conflicting bookings before creating
          const conflictingBookings = await this.bookingModel.findAll({
            where: {
              staffId: assignedStaffId,
              appointmentDate: createBookingDto.appointmentDate,
              status: {
                [Op.notIn]: ['cancelled', 'completed']
              }
            },
            lock: t.LOCK.UPDATE,
            transaction: t,
          });

          // Check if there's any time overlap
          // Times are stored as "HH:MM:SS" strings - compare them directly
          const parseTimeToMinutes = (timeStr: string) => {
            const [h, m] = timeStr.split(':').map(Number);
            return h * 60 + m;
          };

          const requestStartMinutes = parseTimeToMinutes(createBookingDto.startTime);
          const requestEndMinutes = parseTimeToMinutes(createBookingDto.endTime);

          for (const booking of conflictingBookings) {
            const existingStartMinutes = parseTimeToMinutes(String(booking.startTime).slice(0, 5));
            const existingEndMinutes = parseTimeToMinutes(String(booking.endTime).slice(0, 5));

            // Check for overlap: new booking overlaps if:
            // new start < existing end AND new end > existing start
            const hasOverlap = requestStartMinutes < existingEndMinutes && requestEndMinutes > existingStartMinutes;

            if (hasOverlap) {
              const formatMinutes = (m: number) => `${Math.floor(m/60).toString().padStart(2,'0')}:${(m%60).toString().padStart(2,'0')}`;
              throw new BadRequestException(
                `This time slot is no longer available. The staff member already has a booking from ${formatMinutes(existingStartMinutes)} to ${formatMinutes(existingEndMinutes)}.`
              );
            }
          }

          return await this.bookingModel.create(bookingData as any, { transaction: t });
        }
      );

      // Fire-and-forget — never blocks booking creation
      this.sendBookingConfirmationEmail(createdBooking, createBookingDto).catch(() => {});

      return createdBooking;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Booking creation failed: ' + errorMessage);
    }
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateBookingDto: UpdateBookingDto) {
    const booking = await this.bookingModel.findByPk(id);

    if (!booking) {
      throw new NotFoundException(`Booking with ID ${id} not found`);
    }

    try {
      this.logger.debug('🔄 Updating booking with data:', JSON.stringify(updateBookingDto, null, 2));
      this.logger.debug('📝 ServiceId received:', updateBookingDto.serviceId, 'Type:', typeof updateBookingDto.serviceId);
      
      // Handle addon updates explicitly
      const updateData: any = { ...updateBookingDto };
      
      // Handle addOnIds (includes both normal and removal addons)
      if ('addOnIds' in updateBookingDto) {
        this.logger.debug('📝 Updating addOnIds (combined normal + removal):', updateBookingDto.addOnIds);
        updateData.addOnIds = updateBookingDto.addOnIds || null;
      }
      
      await booking.update(updateData);
      
      // Reload the booking to get updated values
      await booking.reload();
      
      this.logger.debug('✅ Booking updated successfully. Final addOnIds:', booking.addOnIds);
      
      return booking;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error updating booking: ${errorMessage}`);
      throw new BadRequestException('Error updating booking: ' + errorMessage);
    }
  }

  @Put(':id/cancel')
  async cancel(@Param('id') id: string, @Body('reason') reason?: string) {
    const booking = await this.bookingModel.findByPk(id);

    if (!booking) {
      throw new NotFoundException(`Booking with ID ${id} not found`);
    }

    try {
      await booking.update({
        status: BookingStatus.CANCELLED,
        notes: reason
          ? `${booking.notes ? booking.notes + ' | ' : ''}Cancelled: ${reason.replace(/<[^>]*>/g, '').substring(0, 500)}`
          : booking.notes,
      });
      this.auditService.log({ action: 'booking.cancelled', actorId: 'system', actorRole: 'system', resourceType: 'Booking', resourceId: id, metadata: { reason } });
      return booking;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException('Error cancelling booking: ' + errorMessage);
    }
  }

  @Put(':id/confirm')
  async confirm(@Param('id') id: string) {
    const booking = await this.bookingModel.findByPk(id);

    if (!booking) {
      throw new NotFoundException(`Booking with ID ${id} not found`);
    }

    try {
      await booking.update({
        status: BookingStatus.IN_PROGRESS,
      });
      this.auditService.log({ action: 'booking.confirmed', actorId: 'system', actorRole: 'system', resourceType: 'Booking', resourceId: id });
      return booking;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException('Error confirming booking: ' + errorMessage);
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const booking = await this.bookingModel.findByPk(id);

    if (!booking) {
      throw new NotFoundException(`Booking with ID ${id} not found`);
    }

    await booking.destroy();
    return { message: `Booking with ID ${id} has been deleted` };
  }
}
