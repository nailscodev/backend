import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Header,
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
import { MultiServiceAvailabilityService } from '../application/services/multi-service-availability.service';
import { SkipCsrf } from '../../common/decorators/csrf.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { RequireAuth } from '../../common/decorators/require-auth.decorator';
import { DashboardStatsDto } from './dto/dashboard-stats.dto';
import { BestSellingServiceDto } from './dto/best-selling-service.dto';
import { TopStaffDto } from './dto/top-staff.dto';
import { UpcomingBookingDto } from './dto/upcoming-booking.dto';
import { BookingsBySourceDto } from './dto/bookings-by-source.dto';
import { BookingListItemDto } from './dto/booking-list-item.dto';
import { ManualAdjustment } from '../../common/entities/manual-adjustment.entity';
import { BookingConfig } from '../../common/config/booking.config';
import { MailService } from '../../common/services/mail.service';
import { CustomerEntity } from '../../customers/infrastructure/persistence/entities/customer.entity';
import { ServiceEntity } from '../../services/infrastructure/persistence/entities/service.entity';
import { AddOnEntity } from '../../addons/infrastructure/persistence/entities/addon.entity';
import { bookingConfirmationEmail } from '../../common/templates/booking-confirmation-email';

// Interfaces for type safety
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

interface CountRow {
  count: string | number;
}

// Force recompilation

@ApiTags('bookings')
@Controller('bookings')
export class ReservationsController {
  private readonly logger = new Logger(ReservationsController.name);

  constructor(
    @InjectModel(BookingEntity)
    private bookingModel: typeof BookingEntity,
    @InjectModel(ManualAdjustment)
    private manualAdjustmentModel: typeof ManualAdjustment,
    @InjectModel(CustomerEntity)
    private customerModel: typeof CustomerEntity,
    @InjectModel(ServiceEntity)
    private serviceModel: typeof ServiceEntity,
    @InjectModel(AddOnEntity)
    private addOnModel: typeof AddOnEntity,
    private sequelize: Sequelize,
    private multiServiceAvailabilityService: MultiServiceAvailabilityService,
    @Inject(MailService)
    private mailService: MailService,
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
  @Get('dashboard/stats')
  @Header('Cache-Control', 'private, max-age=60')
  @ApiOperation({
    summary: 'Get dashboard statistics',
    description: 'Retrieve dashboard statistics including cash, bank payments, bookings count, distinct services, and new customers for a given date range.',
  })
  @ApiQuery({ name: 'startDate', required: true, type: 'string', description: 'Start date in YYYY-MM-DD format' })
  @ApiQuery({ name: 'endDate', required: true, type: 'string', description: 'End date in YYYY-MM-DD format' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Dashboard statistics retrieved successfully',
    type: DashboardStatsDto,
  })
  async getDashboardStats(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ): Promise<{ success: boolean; data: DashboardStatsDto }> {
    if (!startDate || !endDate) {
      throw new BadRequestException('startDate and endDate are required');
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
      throw new BadRequestException('startDate and endDate must be in YYYY-MM-DD format');
    }

    // All aggregation done in SQL — no full-row fetches into Node.js memory
    const [bookingAggRows, adjustmentAggRows, distinctServicesResult, newCustomersResult] =
      await Promise.all([
        // Aggregate cash / bank / count from completed bookings in one pass
        this.sequelize.query<{
          cash: string;
          bank: string;
          total: string;
          bookings: string;
        }>(
          `SELECT
             COALESCE(SUM(CASE WHEN "paymentMethod" = 'CASH' THEN "totalPrice" ELSE 0 END), 0) AS cash,
             COALESCE(SUM(CASE WHEN "paymentMethod" = 'CARD' THEN "totalPrice" ELSE 0 END), 0) AS bank,
             COALESCE(SUM("totalPrice"), 0)                                                     AS total,
             COUNT(*)                                                                           AS bookings
           FROM bookings
           WHERE status = 'completed'
             AND "appointmentDate" >= :startDate
             AND "appointmentDate" <= :endDate`,
          { replacements: { startDate, endDate }, type: QueryTypes.SELECT },
        ),
        // Aggregate manual adjustments in one pass
        this.sequelize.query<{
          cash: string;
          bank: string;
          total: string;
        }>(
          `SELECT
             COALESCE(SUM(CASE WHEN "paymentMethod" = 'CASH'
                              THEN CASE WHEN type = 'expense' THEN -amount ELSE amount END
                              ELSE 0 END), 0) AS cash,
             COALESCE(SUM(CASE WHEN "paymentMethod" = 'CARD'
                              THEN CASE WHEN type = 'expense' THEN -amount ELSE amount END
                              ELSE 0 END), 0) AS bank,
             COALESCE(SUM(CASE WHEN type = 'expense' THEN -amount ELSE amount END), 0) AS total
           FROM manual_adjustments
           WHERE DATE("createdAt") >= :startDate
             AND DATE("createdAt") <= :endDate`,
          { replacements: { startDate, endDate }, type: QueryTypes.SELECT },
        ),
        this.sequelize.query<CountRow>(
          `SELECT COUNT(DISTINCT "serviceId") AS count
           FROM bookings
           WHERE status = 'completed'
             AND "appointmentDate" >= :startDate
             AND "appointmentDate" <= :endDate`,
          { replacements: { startDate, endDate }, type: QueryTypes.SELECT },
        ),
        this.sequelize.query<CountRow>(
          `SELECT COUNT(DISTINCT c.id) AS count
           FROM customers c
           INNER JOIN bookings b ON b."customerId" = c.id
           WHERE b.status = 'completed'
             AND b."appointmentDate" >= :startDate
             AND b."appointmentDate" <= :endDate
             AND c."createdAt" >= :startDate
             AND c."createdAt" <= (:endDate || ' 23:59:59')::timestamp`,
          { replacements: { startDate, endDate }, type: QueryTypes.SELECT },
        ),
      ]);

    const bRow = bookingAggRows[0];
    const aRow = adjustmentAggRows[0];

    const bookingCash = parseFloat(bRow?.cash ?? '0');
    const bookingBank = parseFloat(bRow?.bank ?? '0');
    const bookingsCount = parseInt(bRow?.bookings ?? '0', 10);
    const bookingTotal = parseFloat(bRow?.total ?? '0');

    const adjCash = parseFloat(aRow?.cash ?? '0');
    const adjBank = parseFloat(aRow?.bank ?? '0');
    const manualAdjustmentsTotal = parseFloat(aRow?.total ?? '0');

    const distinctServices = parseInt(String(distinctServicesResult[0]?.count ?? '0'), 10);
    const newCustomers = parseInt(String(newCustomersResult[0]?.count ?? '0'), 10);

    return {
      success: true,
      data: {
        cash: bookingCash + adjCash,
        bank: bookingBank + adjBank,
        totalRevenue: bookingTotal + manualAdjustmentsTotal,
        manualAdjustmentsTotal,
        bookings: bookingsCount,
        completedTransactions: bookingsCount,
        distinctServices,
        newCustomers,
      },
    };
  }

  @RequireAuth()
  @Get('dashboard/revenue-over-time')
  @ApiOperation({
    summary: 'Get revenue over time',
    description: 'Retrieve daily revenue data for a given date range for trending analysis.',
  })
  @ApiQuery({ name: 'startDate', required: true, type: 'string', description: 'Start date in YYYY-MM-DD format' })
  @ApiQuery({ name: 'endDate', required: true, type: 'string', description: 'End date in YYYY-MM-DD format' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Revenue over time retrieved successfully',
  })
  async getRevenueOverTime(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ): Promise<{ success: boolean; data: Array<{ date: string; cash: number; bank: number; bookings: number }> }> {
    // NOTE: returns daily breakdown split by payment method (cash / bank) plus bookings count
    if (!startDate || !endDate) {
      throw new BadRequestException('startDate and endDate are required');
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
      throw new BadRequestException('startDate and endDate must be in YYYY-MM-DD format');
    }

    // Get daily revenue from completed bookings split by payment method
    const bookingsResult: any[] = await this.sequelize.query(
      `
      SELECT 
        b."appointmentDate" as date,
        b."paymentMethod" as payment_method,
        SUM(b."totalPrice") as revenue,
        COUNT(b.id) as bookings
      FROM bookings b
      WHERE b.status = 'completed'
        AND b."appointmentDate" >= :startDate::date
        AND b."appointmentDate" <= :endDate::date
      GROUP BY b."appointmentDate", b."paymentMethod"
      ORDER BY b."appointmentDate" ASC
      `,
      {
        replacements: { startDate, endDate },
        type: QueryTypes.SELECT,
      },
    );

    // Get daily revenue from manual adjustments split by payment method
    const adjustmentsResult: any[] = await this.sequelize.query(
      `
      SELECT 
        DATE(ma."createdAt") as date,
        ma."paymentMethod" as payment_method,
        SUM(CASE WHEN ma.type = 'expense' THEN -ma.amount ELSE ma.amount END) as revenue
      FROM manual_adjustments ma
      WHERE DATE(ma."createdAt") >= :startDate::date
        AND DATE(ma."createdAt") <= :endDate::date
      GROUP BY DATE(ma."createdAt"), ma."paymentMethod"
      ORDER BY DATE(ma."createdAt") ASC
      `,
      {
        replacements: { startDate, endDate },
        type: QueryTypes.SELECT,
      },
    );

    // Combine bookings and adjustments by date and payment method
    const combinedData = new Map<string, { cash: number; bank: number; bookings: number }>();

    const addToDate = (dateStr: string, paymentMethod: string | null, amount: number, bookingsCount = 0) => {
      const existing = combinedData.get(dateStr) || { cash: 0, bank: 0, bookings: 0 };
      if (paymentMethod === 'CASH') {
        existing.cash += amount;
      } else {
        // treat CARD and other as bank/card
        existing.bank += amount;
      }
      existing.bookings += bookingsCount;
      combinedData.set(dateStr, existing);
    };

    // Add bookings data
    bookingsResult.forEach(row => {
      const dateStr = row.date instanceof Date ? row.date.toISOString().split('T')[0] : String(row.date);
      const paymentMethod = row.payment_method || 'CARD';
      const revenue = parseFloat(row.revenue || '0');
      const bookingsCount = parseInt(row.bookings || '0');
      addToDate(dateStr, paymentMethod, revenue, bookingsCount);
    });

    // Add adjustments data
    adjustmentsResult.forEach(row => {
      const dateStr = row.date instanceof Date ? row.date.toISOString().split('T')[0] : String(row.date);
      const paymentMethod = row.payment_method || 'CARD';
      const revenue = parseFloat(row.revenue || '0');
      addToDate(dateStr, paymentMethod, revenue, 0);
    });

    // Convert to array and fill missing dates with 0
    const revenueOverTime: Array<{ date: string; cash: number; bank: number; bookings: number }> = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const data = combinedData.get(dateStr) || { cash: 0, bank: 0, bookings: 0 };
      revenueOverTime.push({
        date: dateStr,
        cash: data.cash,
        bank: data.bank,
        bookings: data.bookings
      });
    }

    return {
      success: true,
      data: revenueOverTime,
    };
  }

  @RequireAuth()
  @Get('dashboard/revenue-by-service')
  @ApiOperation({
    summary: 'Get revenue by service',
    description: 'Retrieve revenue grouped by service for a given date range.',
  })
  @ApiQuery({ name: 'startDate', required: true, type: 'string', description: 'Start date in YYYY-MM-DD format' })
  @ApiQuery({ name: 'endDate', required: true, type: 'string', description: 'End date in YYYY-MM-DD format' })
  @ApiQuery({ name: 'lang', required: false, type: 'string', description: 'Language code (EN/ES, default: EN)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Revenue by service retrieved successfully',
  })
  async getRevenueByService(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('lang') lang: string = 'EN',
  ): Promise<{ success: boolean; data: Array<{ service: string; revenue: number }> }> {
    if (!startDate || !endDate) {
      throw new BadRequestException('startDate and endDate are required');
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
      throw new BadRequestException('startDate and endDate must be in YYYY-MM-DD format');
    }

    const langRowsRev = await this.sequelize.query<{ id: string }>(
      `SELECT id FROM languages WHERE code = :lang LIMIT 1`,
      { replacements: { lang }, type: QueryTypes.SELECT },
    );
    const langIdRev = langRowsRev[0]?.id ?? null;

    const result: any[] = await this.sequelize.query(
      `
      SELECT 
        COALESCE(sl.title, s.name) as "serviceName",
        SUM(b."totalPrice") as "totalRevenue"
      FROM bookings b
      INNER JOIN services s ON b."serviceId" = s.id
      LEFT JOIN services_lang sl ON s.id = sl.service_id 
        AND sl.language_id = :langId
      WHERE b.status = 'completed'
        AND b."appointmentDate" >= :startDate::date
        AND b."appointmentDate" <= :endDate::date
      GROUP BY s.id, COALESCE(sl.title, s.name)
      ORDER BY SUM(b."totalPrice") DESC
      `,
      {
        replacements: { startDate, endDate, langId: langIdRev },
        type: QueryTypes.SELECT,
      },
    );

    const revenueByService = result.map(row => ({
      service: row.serviceName,
      revenue: parseFloat(row.totalRevenue || '0'),
    }));

    return {
      success: true,
      data: revenueByService,
    };
  }

  @RequireAuth()
  @Get('invoices')
  @ApiOperation({
    summary: 'Get all invoices',
    description: 'Retrieve all invoices including completed bookings and manual adjustments for a given date range with pagination.',
  })
  @ApiQuery({ name: 'startDate', required: true, type: 'string', description: 'Start date in YYYY-MM-DD format' })
  @ApiQuery({ name: 'endDate', required: true, type: 'string', description: 'End date in YYYY-MM-DD format' })
  @ApiQuery({ name: 'page', required: false, type: 'number', description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: 'number', description: 'Items per page (default: 10)' })
  @ApiQuery({ name: 'lang', required: false, type: 'string', description: 'Language code (EN/ES, default: EN)' })
  @ApiQuery({ name: 'serviceId', required: false, type: 'string', description: 'Service ID filter' })
  @ApiQuery({ name: 'paymentMethod', required: false, type: 'string', description: 'Payment method filter (cash/card)' })
  @ApiQuery({ name: 'type', required: false, type: 'string', description: 'Transaction type filter (income/expense)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Invoices retrieved successfully',
  })
  async getInvoices(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 10,
    @Query('lang') lang: string = 'EN',
    @Query('serviceId') serviceId?: string,
    @Query('paymentMethod') paymentMethod?: string,
    @Query('type') transactionType?: string,
  ): Promise<{ success: boolean; data: any[]; pagination: any }> {
    if (!startDate || !endDate) {
      throw new BadRequestException('startDate and endDate are required');
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
      throw new BadRequestException('startDate and endDate must be in YYYY-MM-DD format');
    }

    // Resolve language ID once — avoids a correlated subquery per row
    const langRows = await this.sequelize.query<{ id: string }>(
      `SELECT id FROM languages WHERE code = :lang LIMIT 1`,
      { replacements: { lang }, type: QueryTypes.SELECT },
    );
    const langId = langRows[0]?.id ?? null;

    // ── Booking leg WHERE conditions ──────────────────────────────────────────
    const bookingConditions: string[] = [
      `b.status = 'completed'`,
      `b."appointmentDate" >= :startDate`,
      `b."appointmentDate" <= :endDate`,
    ];
    const rp: Record<string, any> = { startDate, endDate, langId, limit, offset: (page - 1) * limit };

    if (paymentMethod && paymentMethod !== 'All') {
      bookingConditions.push(`b."paymentMethod" = :paymentMethod`);
      rp.paymentMethod = paymentMethod;
    }
    const excludeBookings =
      (serviceId && serviceId !== 'All' && serviceId === 'MANUAL_ADJUSTMENT') ||
      transactionType === 'expense';
    const includeSpecificService = serviceId && serviceId !== 'All' && serviceId !== 'MANUAL_ADJUSTMENT';
    if (excludeBookings) {
      bookingConditions.push(`1 = 0`);
    } else if (includeSpecificService) {
      bookingConditions.push(`b."serviceId" = :serviceId`);
      rp.serviceId = serviceId;
    }

    // ── Manual-adjustment leg WHERE conditions ────────────────────────────────
    const adjConditions: string[] = [
      `DATE(ma."createdAt") >= :startDate`,
      `DATE(ma."createdAt") <= :endDate`,
    ];
    if (paymentMethod && paymentMethod !== 'All') {
      adjConditions.push(`ma."paymentMethod" = :paymentMethod`);
    }
    const excludeAdj = includeSpecificService; // specific serviceId → no manual adjustments
    const includeOnlyAdj = serviceId === 'MANUAL_ADJUSTMENT';
    if (excludeAdj) {
      adjConditions.push(`1 = 0`);
    }
    if (transactionType === 'income') {
      adjConditions.push(`(CASE WHEN ma.type = 'expense' THEN -ma.amount ELSE ma.amount END) >= 0`);
    } else if (transactionType === 'expense') {
      adjConditions.push(`(CASE WHEN ma.type = 'expense' THEN -ma.amount ELSE ma.amount END) < 0`);
    }
    if (includeOnlyAdj) {
      bookingConditions.push(`1 = 0`); // already excluded above, belt-and-suspenders
    }

    const bookingWhere = bookingConditions.join(' AND ');
    const adjWhere = adjConditions.join(' AND ');

    // ── UNION ALL + single paginated query ────────────────────────────────────
    const unionSQL = `
      SELECT
        b.id,
        'booking'                                             AS "type",
        CONCAT(c."firstName", ' ', c."lastName")             AS "customerName",
        c.email                                              AS "customerEmail",
        COALESCE(sl.title, s.name)                           AS "serviceName",
        b."appointmentDate",
        b."startTime",
        b."endTime",
        b."paymentMethod",
        b."totalPrice",
        b."createdAt"
      FROM bookings b
      INNER JOIN customers c  ON b."customerId" = c.id
      INNER JOIN services  s  ON b."serviceId"  = s.id
      LEFT  JOIN services_lang sl
             ON s.id = sl.service_id AND sl.language_id = :langId
      WHERE ${bookingWhere}

      UNION ALL

      SELECT
        ma.id,
        CASE WHEN ma.type = 'income' THEN 'adjustment_income' ELSE 'adjustment_expense' END AS "type",
        'Manual Adjustment'                                   AS "customerName",
        ''                                                    AS "customerEmail",
        ma.description                                        AS "serviceName",
        DATE(ma."createdAt")                                  AS "appointmentDate",
        TO_CHAR(ma."createdAt", 'HH24:MI')                   AS "startTime",
        TO_CHAR(ma."createdAt", 'HH24:MI')                   AS "endTime",
        ma."paymentMethod",
        CASE WHEN ma.type = 'expense' THEN -ma.amount ELSE ma.amount END AS "totalPrice",
        ma."createdAt"
      FROM manual_adjustments ma
      WHERE ${adjWhere}
    `;

    const [countRows, dataRows] = await Promise.all([
      this.sequelize.query<{ total: string }>(
        `SELECT COUNT(*) AS total FROM (${unionSQL}) sub`,
        { replacements: rp, type: QueryTypes.SELECT },
      ),
      this.sequelize.query(
        `${unionSQL}
         ORDER BY "appointmentDate" DESC, "startTime" DESC
         LIMIT :limit OFFSET :offset`,
        { replacements: rp, type: QueryTypes.SELECT },
      ),
    ]);

    const total = parseInt(countRows[0]?.total ?? '0', 10);
    const totalPages = Math.ceil(total / limit);

    return {
      success: true,
      data: dataRows,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  @Post('manual-adjustments')
  @ApiOperation({
    summary: 'Create a manual adjustment',
    description: 'Create a manual adjustment (income or expense) for cash/bank reconciliation.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        type: { type: 'string', enum: ['income', 'expense'], description: 'Type of adjustment' },
        description: { type: 'string', description: 'Description of the adjustment' },
        amount: { type: 'number', description: 'Amount of the adjustment' },
        paymentMethod: { type: 'string', enum: ['CASH', 'CARD'], description: 'Payment method' },
        adjustmentDate: { type: 'string', format: 'date', description: 'Date of adjustment (YYYY-MM-DD), defaults to current date' },
        createdBy: { type: 'string', format: 'uuid', description: 'User ID who created the adjustment (optional)' },
      },
      required: ['type', 'description', 'amount', 'paymentMethod'],
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Manual adjustment created successfully',
  })
  async createManualAdjustment(
    @Body() createDto: {
      type: 'income' | 'expense';
      description: string;
      amount: number;
      paymentMethod: 'CASH' | 'CARD';
      adjustmentDate?: string; // Optional adjustment date in YYYY-MM-DD format
      createdBy?: string;
    },
  ): Promise<{ success: boolean; data: ManualAdjustment }> {
    if (!createDto.type || !createDto.description || !createDto.amount || !createDto.paymentMethod) {
      throw new BadRequestException('type, description, amount, and paymentMethod are required');
    }

    if (createDto.amount <= 0) {
      throw new BadRequestException('amount must be greater than 0');
    }

    // Parse adjustmentDate if provided, or use current timestamp
    let adjustmentTimestamp: Date = new Date();
    
    if (createDto.adjustmentDate) {
      try {
        // Parse date string (YYYY-MM-DD) without timezone issues
        const [year, month, day] = createDto.adjustmentDate.split('-').map(Number);
        
        if (!year || !month || !day) {
          throw new BadRequestException('Invalid adjustmentDate format. Use YYYY-MM-DD');
        }
        
        // Create date with current time but using the selected date
        const now = new Date();
        adjustmentTimestamp = new Date(
          year,
          month - 1, // Month is 0-indexed in JavaScript
          day,
          now.getHours(),
          now.getMinutes(),
          now.getSeconds(),
          now.getMilliseconds()
        );
      } catch {
        throw new BadRequestException('Invalid adjustmentDate format. Use YYYY-MM-DD');
      }
    }

    const adjustment = await this.manualAdjustmentModel.create({
      type: createDto.type,
      description: createDto.description,
      amount: createDto.amount,
      paymentMethod: createDto.paymentMethod,
      createdBy: createDto.createdBy || null,
      createdAt: adjustmentTimestamp, // Override the default createdAt with custom date
      updatedAt: adjustmentTimestamp,
    });

    return {
      success: true,
      data: adjustment,
    };
  }

  @RequireAuth()
  @Get('dashboard/best-selling-services')
  @ApiOperation({
    summary: 'Get best selling services',
    description: 'Retrieve the top performing services by bookings count and revenue for a given date range.',
  })
  @ApiQuery({ name: 'startDate', required: true, type: 'string', description: 'Start date in YYYY-MM-DD format' })
  @ApiQuery({ name: 'endDate', required: true, type: 'string', description: 'End date in YYYY-MM-DD format' })
  @ApiQuery({ name: 'limit', required: false, type: 'number', description: 'Number of services to return (default: 5)' })
  @ApiQuery({ name: 'lang', required: false, type: 'string', description: 'Language code (EN/ES, default: EN)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Best selling services retrieved successfully',
    type: [BestSellingServiceDto],
  })
  async getBestSellingServices(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 5,
    @Query('lang') lang: string = 'EN',
  ): Promise<{ success: boolean; data: BestSellingServiceDto[] }> {
    if (!startDate || !endDate) {
      throw new BadRequestException('startDate and endDate are required');
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
      throw new BadRequestException('startDate and endDate must be in YYYY-MM-DD format');
    }

    const langRowsBest = await this.sequelize.query<{ id: string }>(
      `SELECT id FROM languages WHERE code = :lang LIMIT 1`,
      { replacements: { lang }, type: QueryTypes.SELECT },
    );
    const langIdBest = langRowsBest[0]?.id ?? null;

    const result: any[] = await this.sequelize.query(
      `
      SELECT 
        s.id as "serviceId",
        COALESCE(sl.title, s.name) as "serviceName",
        COUNT(b.id) as "bookingsCount",
        SUM(b."totalPrice") as "totalRevenue",
        AVG(b."totalPrice") as "averagePrice"
      FROM bookings b
      INNER JOIN services s ON b."serviceId" = s.id
      LEFT JOIN services_lang sl ON s.id = sl.service_id 
        AND sl.language_id = :langId
      WHERE b.status = 'completed'
        AND b."appointmentDate" >= :startDate
        AND b."appointmentDate" <= :endDate
      GROUP BY s.id, COALESCE(sl.title, s.name)
      ORDER BY COUNT(b.id) DESC, SUM(b."totalPrice") DESC
      LIMIT :limit
      `,
      {
        replacements: { startDate, endDate, limit, langId: langIdBest },
        type: QueryTypes.SELECT,
      },
    );

    const bestSellingServices = result.map(row => ({
      serviceId: row.serviceId,
      serviceName: row.serviceName,
      bookingsCount: parseInt(row.bookingsCount || '0'),
      totalRevenue: parseFloat(row.totalRevenue || '0'),
      averagePrice: parseFloat(row.averagePrice || '0'),
    }));

    return {
      success: true,
      data: bestSellingServices,
    };
  }

  @RequireAuth()
  @Get('dashboard/top-staff')
  @ApiOperation({
    summary: 'Get top performing staff',
    description: 'Retrieve staff members ranked by bookings count and revenue for a given date range.',
  })
  @ApiQuery({ name: 'startDate', required: true, type: 'string', description: 'Start date in YYYY-MM-DD format' })
  @ApiQuery({ name: 'endDate', required: true, type: 'string', description: 'End date in YYYY-MM-DD format' })
  @ApiQuery({ name: 'limit', required: false, type: 'number', description: 'Number of staff members to return (default: 10)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Top staff retrieved successfully',
    type: [TopStaffDto],
  })
  async getTopStaff(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 10,
  ): Promise<{ success: boolean; data: TopStaffDto[] }> {
    if (!startDate || !endDate) {
      throw new BadRequestException('startDate and endDate are required');
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
      throw new BadRequestException('startDate and endDate must be in YYYY-MM-DD format');
    }

    const result: any[] = await this.sequelize.query(
      `
      SELECT 
        s.id as "staffId",
        CONCAT(s."firstName", ' ', s."lastName") as "staffName",
        COUNT(b.id) as "bookingsCount",
        SUM(b."totalPrice") as "totalRevenue",
        s.role as role
      FROM bookings b
      INNER JOIN staff s ON b."staffId" = s.id
      WHERE b.status = 'completed'
        AND b."appointmentDate" >= :startDate
        AND b."appointmentDate" <= :endDate
      GROUP BY s.id, s."firstName", s."lastName", s.role
      ORDER BY COUNT(b.id) DESC, SUM(b."totalPrice") DESC
      LIMIT :limit
      `,
      {
        replacements: { startDate, endDate, limit },
        type: QueryTypes.SELECT,
      },
    );

    this.logger.debug('Top Staff Query Result:', result);
    this.logger.debug('Query parameters:', { startDate, endDate, limit });

    const topStaff = result.map(row => ({
      staffId: row.staffId,
      staffName: row.staffName,
      bookingsCount: parseInt(row.bookingsCount || '0'),
      totalRevenue: parseFloat(row.totalRevenue || '0'),
      role: row.role || 'Technician',
    }));

    this.logger.debug('Top Staff Mapped:', topStaff);

    return {
      success: true,
      data: topStaff,
    };
  }

  @RequireAuth()
  @Get('dashboard/bookings-by-source')
  @ApiOperation({
    summary: 'Get bookings by source',
    description: 'Retrieve count of bookings grouped by source (web vs other) for a given date range.',
  })
  @ApiQuery({ name: 'startDate', required: true, type: 'string', description: 'Start date in YYYY-MM-DD format' })
  @ApiQuery({ name: 'endDate', required: true, type: 'string', description: 'End date in YYYY-MM-DD format' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Bookings by source retrieved successfully',
    type: BookingsBySourceDto,
  })
  async getBookingsBySource(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ): Promise<{ success: boolean; data: BookingsBySourceDto }> {
    if (!startDate || !endDate) {
      throw new BadRequestException('startDate and endDate are required');
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
      throw new BadRequestException('startDate and endDate must be in YYYY-MM-DD format');
    }

    const result: any[] = await this.sequelize.query(
      `
      SELECT 
        web,
        COUNT(*) as count
      FROM bookings
      WHERE status = 'completed'
        AND "appointmentDate" >= :startDate
        AND "appointmentDate" <= :endDate
      GROUP BY web
      `,
      {
        replacements: { startDate, endDate },
        type: QueryTypes.SELECT,
      },
    );

    this.logger.debug('Bookings by Source Query Result:', result);

    // Initialize counts
    let webCount = 0;
    let otherCount = 0;

    // Process results
    result.forEach(row => {
      if (row.web === true) {
        webCount = parseInt(row.count || '0');
      } else {
        otherCount = parseInt(row.count || '0');
      }
    });

    const data: BookingsBySourceDto = {
      web: webCount,
      other: otherCount,
    };

    return {
      success: true,
      data,
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

  @RequireAuth()
  @Get('available-slots')
  @Header('Cache-Control', 'private, max-age=30, stale-while-revalidate=60')
  @ApiOperation({
    summary: 'Get available time slots',
    description: 'Retrieve available time slots for a specific date, excluding already booked times.',
  })
  @ApiQuery({ name: 'date', required: true, type: 'string', description: 'Date in YYYY-MM-DD format' })
  @ApiQuery({ name: 'staffId', required: false, type: 'string', description: 'Filter by staff ID (UUID)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Available time slots retrieved successfully',
  })
  async getAvailableTimeSlots(
    @Query('date') date: string,
    @Query('staffId') staffId?: string,
  ) {
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new BadRequestException('Date must be in YYYY-MM-DD format');
    }

    try {
    // Build where clause for existing bookings
    const where: Record<string, any> = {
      appointmentDate: date,
      status: {
        [Op.not]: BookingStatus.CANCELLED
      }
    };

    if (staffId) {
      where.staffId = staffId;
    }

    // Get existing bookings for the date
    const existingBookings = await this.bookingModel.findAll({
      where,
      attributes: ['startTime', 'endTime', 'staffId'],
      order: [['startTime', 'ASC']]
    });

    // Get all active staff members to know total available staff
    const allActiveStaff: Array<{ id: string; workingDays: string[]; shifts: Array<{ shiftStart: string; shiftEnd: string }> }> = await this.sequelize.query(
      `SELECT id, "workingDays", shifts FROM staff WHERE status = 'ACTIVE' AND "isBookable" = true`,
      {
        type: QueryTypes.SELECT,
        raw: true
      }
    );

    // Filter staff by working day
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayAbbreviations: Record<string, string> = { 'Sunday': 'Sun', 'Monday': 'Mon', 'Tuesday': 'Tue', 'Wednesday': 'Wed', 'Thursday': 'Thu', 'Friday': 'Fri', 'Saturday': 'Sat' };
    const requestedDate = new Date(`${date}T12:00:00`);
    const dayOfWeek = dayNames[requestedDate.getDay()];
    const dayAbbr = dayAbbreviations[dayOfWeek];
    const filteredStaff = allActiveStaff.filter(staff => {
      const wd = staff.workingDays || [];
      if (wd.includes(dayOfWeek) || wd.includes(dayAbbr)) return true;
      // Fallback for new-format staff whose workingDays[] may be empty:
      // check the shifts object (keyed by lowercase day name e.g. "monday").
      const staffShifts = (staff as any).shifts;
      if (staffShifts && typeof staffShifts === 'object' && !Array.isArray(staffShifts)) {
        const dayShifts = staffShifts[dayOfWeek.toLowerCase()];
        return Array.isArray(dayShifts) && dayShifts.length > 0;
      }
      return false;
    });

    const allActiveStaffIds: string[] = filteredStaff.map(staff => staff.id);

    // Generate all possible time slots (business hours: 07:30 - 21:30)
    const allTimeSlots = this.generateTimeSlots();

    // Group bookings by staff
    const bookedSlotsByStaff = new Map<string, Set<string>>();

    // Initialize all active staff with empty sets
    allActiveStaffIds.forEach((id: string) => {
      bookedSlotsByStaff.set(id, new Set());
    });

    existingBookings.forEach(booking => {
      const staff = booking.staffId;
      if (!bookedSlotsByStaff.has(staff)) {
        bookedSlotsByStaff.set(staff, new Set());
      }

      // Extract time from booking - format "HH:MM:SS" from PostgreSQL TIME
      let startTime: string;
      let endTime: string;

      if (typeof booking.startTime === 'string') {
        // Time string like "21:30:00" - take first 5 chars for "HH:MM"
        startTime = booking.startTime.slice(0, 5);
        endTime = booking.endTime.slice(0, 5);
      } else {
        // Fallback for Date object (shouldn't happen with TIME type)
        const startTimeObj = new Date(booking.startTime);
        const endTimeObj = new Date(booking.endTime);
        startTime = startTimeObj.toTimeString().slice(0, 5);
        endTime = endTimeObj.toTimeString().slice(0, 5);
      }

      allTimeSlots.forEach(slot => {
        // Check if this slot would overlap with the existing booking
        // Assume each slot is 60 minutes duration (can be made configurable later)
        const slotDurationMinutes = 60;

        // Convert time to minutes for comparison
        const parseTimeToMinutes = (timeStr: string) => {
          const [hours, minutes] = timeStr.split(':').map(Number);
          return hours * 60 + minutes;
        };

        // Calculate slot times in minutes (no timezone conversion needed)
        const slotStartMinutes = parseTimeToMinutes(slot.time);
        const slotEndMinutes = slotStartMinutes + slotDurationMinutes;

        // Parse booking times
        const bookingStartMinutes = parseTimeToMinutes(startTime);
        const bookingEndMinutes = parseTimeToMinutes(endTime);

        // Check for overlap: slot overlaps with booking if:
        // slot start < booking end AND slot end > booking start
        const slotOverlaps = slotStartMinutes < bookingEndMinutes && slotEndMinutes > bookingStartMinutes;

        if (slotOverlaps) {
          bookedSlotsByStaff.get(staff).add(slot.time);
        }
      });
    });

    // Helper: parse shifts safely — raw Sequelize queries may return JSONB as a string
    const parseShifts = (raw: unknown): Array<{ shiftStart: string; shiftEnd: string }> => {
      if (!raw) return [];
      if (Array.isArray(raw)) return raw;
      try { return JSON.parse(raw as string); } catch { return []; }
    };

    // Helper: check if a time slot falls within staff shifts
    const isSlotWithinShifts = (slotTime: string, rawShifts: unknown) => {
      const shifts = parseShifts(rawShifts);
      if (shifts.length === 0) return true; // no shifts defined = always available
      const [h, m] = slotTime.split(':').map(Number);
      const slotMin = h * 60 + m;
      const slotEndMin = slotMin + 60; // 1-hour intervals
      return shifts.some(shift => {
        const [sh, sm] = shift.shiftStart.split(':').map(Number);
        const [eh, em] = shift.shiftEnd.split(':').map(Number);
        return slotMin >= sh * 60 + sm && slotEndMin <= eh * 60 + em;
      });
    };

    // Filter available slots
    const availableSlots = allTimeSlots.map(slot => {
      let isAvailable = true;

      if (staffId) {
        // If specific staff requested, check only their bookings + shifts
        const staffData = filteredStaff.find(s => s.id === staffId);
        if (!staffData) {
          isAvailable = false; // staff doesn't work this day
        } else {
          const staffBookedSlots = bookedSlotsByStaff.get(staffId) || new Set();
          isAvailable = !staffBookedSlots.has(slot.time) && isSlotWithinShifts(slot.time, staffData.shifts);
        }
      } else {
        // If no staff filter ("Any artist"), slot is available if at least one staff member is free and within shifts
        const freeStaffCount = filteredStaff.filter(staff => {
          const staffBookedSlots = bookedSlotsByStaff.get(staff.id) || new Set();
          return !staffBookedSlots.has(slot.time) && isSlotWithinShifts(slot.time, staff.shifts);
        }).length;

        // Slot is available if at least one staff member is free
        isAvailable = freeStaffCount > 0;
      }

      return {
        ...slot,
        available: isAvailable
      };
    });

    // Group by time periods
    const groupedSlots = {
      morning: availableSlots.filter(slot => slot.time >= '07:30' && slot.time < '12:00'),
      afternoon: availableSlots.filter(slot => slot.time >= '12:00' && slot.time < '17:00'),
      evening: availableSlots.filter(slot => slot.time >= '17:00' && slot.time <= '21:30')
    };

    return {
      success: true,
      data: groupedSlots,
      date,
      staffId: staffId || 'all'
    };
    } catch (error) {
      throw new BadRequestException(
        `Failed to retrieve available slots: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * POST /bookings/backoffice-availability
   * Efficient endpoint for backoffice booking creation
   * Returns available slots considering all services, addons, removals, and staff selection
   */
  @Public() // Called by turnero (public booking flow) without auth
  @SkipCsrf() // Read-like operation (querying availability), no state change
  @Post('backoffice-availability')
  @ApiOperation({
    summary: 'Get available time slots for backoffice booking creation',
    description: 'Optimized endpoint for backoffice that returns available slots based on services, addons, removals, and selected staff. Supports both consecutive and VIP combo modes.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        services: {
          type: 'array',
          description: 'Array of services with their configuration',
          items: {
            type: 'object',
            properties: {
              serviceId: { type: 'string' },
              duration: { type: 'number' },
              bufferTime: { type: 'number' },
              staffId: { type: 'string', description: 'Staff ID or "any" for any available staff' },
              addons: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    duration: { type: 'number' }
                  }
                }
              }
            }
          }
        },
        removals: {
          type: 'array',
          description: 'Array of removal addons (applied to first service)',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              duration: { type: 'number' }
            }
          }
        },
        date: { type: 'string', description: 'Date in YYYY-MM-DD format' },
        isVIPCombo: { type: 'boolean', description: 'True for simultaneous services, false for consecutive' }
      },
      required: ['services', 'date']
    }
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Available time slots retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              startTime: { type: 'string' },
              endTime: { type: 'string' },
              totalDuration: { type: 'number' },
              staffAssignments: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    serviceId: { type: 'string' },
                    staffId: { type: 'string' },
                    staffName: { type: 'string' }
                  }
                }
              }
            }
          }
        }
      }
    }
  })
  @HttpCode(HttpStatus.OK)
  async getBackofficeAvailability(
    @Body() body: {
      services: Array<{
        serviceId: string;
        duration: number;
        bufferTime: number;
        staffId?: string;
        addons?: Array<{ id: string; duration: number }>;
      }>;
      removals?: Array<{ id: string; duration: number }>;
      date: string;
      isVIPCombo?: boolean;
    },
  ) {
    try {
      const { services, removals = [], date, isVIPCombo = false } = body;

      // Validation
      if (!services || !Array.isArray(services) || services.length === 0) {
        throw new BadRequestException('services must be a non-empty array');
      }

      if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        throw new BadRequestException('Date must be in YYYY-MM-DD format');
      }

      this.logger.debug(`\n📅 BACKOFFICE AVAILABILITY REQUEST:`);
      this.logger.debug(`   Date: ${date}`);
      this.logger.debug(`   Services: ${services.length}`);
      this.logger.debug(`   Removals: ${removals.length}`);
      this.logger.debug(`   Mode: ${isVIPCombo ? 'VIP COMBO (Simultaneous)' : 'CONSECUTIVE'}`);

      // Get all active staff with proper typing
      interface StaffRecord {
        id: string;
        firstName: string;
        lastName: string;
        workingDays?: string[];
        shifts?: Array<{ shiftStart: string; shiftEnd: string }>;
      }

      const allActiveStaff = await this.sequelize.query<StaffRecord>(
        `SELECT id, "firstName", "lastName", "workingDays", shifts FROM staff WHERE status = 'ACTIVE' AND "isBookable" = true`,
        {
          type: QueryTypes.SELECT,
          raw: true
        }
      );

      // Filter staff by working day
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const dayAbbreviations: Record<string, string> = { 'Sunday': 'Sun', 'Monday': 'Mon', 'Tuesday': 'Tue', 'Wednesday': 'Wed', 'Thursday': 'Thu', 'Friday': 'Fri', 'Saturday': 'Sat' };
      const requestedDate = new Date(`${date}T12:00:00`);
      const dayOfWeek = dayNames[requestedDate.getDay()];
      const dayAbbr = dayAbbreviations[dayOfWeek];
      const filteredActiveStaff = allActiveStaff.filter(staff => {
        const wd = (staff as any).workingDays || [];
        return wd.includes(dayOfWeek) || wd.includes(dayAbbr);
      });

      // Get existing bookings for the date
      const existingBookings = await this.bookingModel.findAll({
        where: {
          appointmentDate: date,
          status: { [Op.not]: BookingStatus.CANCELLED }
        },
        attributes: ['id', 'staffId', 'startTime', 'endTime'],
        order: [['startTime', 'ASC']]
      });

      this.logger.debug(`📋 Found ${existingBookings.length} existing bookings for ${date}`);

      // Calculate total duration for each service including addons and removals
      const servicesWithTotalDuration = services.map((service, index) => {
        const addonsDuration = (service.addons || []).reduce((sum, addon) => sum + addon.duration, 0);
        const removalsDuration = index === 0 ? removals.reduce((sum, removal) => sum + removal.duration, 0) : 0;
        const effectiveBufferTime = BookingConfig.getEffectiveBufferTime(service.bufferTime);
        return {
          ...service,
          totalDuration: service.duration + addonsDuration + removalsDuration + effectiveBufferTime
        };
      });

      // Helper to get shifts for current day from new weekly structure or fallback to legacy format
      const getShiftsForStaffDay = (staffData: any): Array<{ shiftStart: string; shiftEnd: string }> => {
        const staffShifts = staffData.shifts;
        
        // If shifts is in new format (weekly structure)
        if (staffShifts && typeof staffShifts === 'object' && !Array.isArray(staffShifts)) {
          const dayKey = dayOfWeek.toLowerCase();
          this.logger.debug(`🔍 Looking for day key: "${dayKey}" in staff shifts`);
          
          const dayShifts = staffShifts[dayKey];
          this.logger.debug(`📅 Raw day shifts for ${dayKey}: ${JSON.stringify(dayShifts)}`);
          
          // In the new format, dayShifts is directly an array of shift objects
          if (Array.isArray(dayShifts)) {
            this.logger.debug(`✅ Found ${dayShifts.length} shifts for ${dayKey}`);
            return dayShifts.filter(shift => 
              shift && 
              typeof shift === 'object' && 
              shift.shiftStart && 
              shift.shiftEnd
            );
          }
          
          this.logger.debug(`❌ Day shifts is not an array for ${dayKey}: ${typeof dayShifts}`);
          return [];
        }
        
        // Fallback to legacy format (array of shifts for all days)
        if (staffShifts && Array.isArray(staffShifts)) {
          this.logger.debug(`📋 Using legacy format, found ${staffShifts.length} shifts`);
          return staffShifts.filter(shift => 
            shift && 
            typeof shift === 'object' && 
            shift.shiftStart && 
            shift.shiftEnd
          );
        }
        
        this.logger.debug(`❌ No valid shifts format found`);
        return [];
      };

      // Calculate working hours range based on selected staff
      const calculateWorkingHours = () => {
        const specificStaffIds = services
          .map(s => s.staffId)
          .filter(id => id && id !== 'any');

        this.logger.debug(`🔍 Looking for specific staff IDs: ${JSON.stringify(specificStaffIds)}`);
        this.logger.debug(`📊 Available staff count: ${filteredActiveStaff.length}`);

        let earliestStart = '09:00:00';
        let latestEnd = '19:00:00';

        if (specificStaffIds.length > 0) {
          // Use working hours from specific staff
          let foundSpecificHours = false;
          
          for (const staffId of specificStaffIds) {
            this.logger.debug(`🔎 Searching for staff ID: ${staffId}`);
            const staffData = filteredActiveStaff.find(s => s.id === staffId);
            
            if (staffData) {
              this.logger.debug(`✅ Found staff: ${staffData.firstName} ${staffData.lastName}`);
              
              const dayShifts = getShiftsForStaffDay(staffData);
              this.logger.debug(`📅 Day shifts for ${dayOfWeek}: ${JSON.stringify(dayShifts)}`);
              
              if (dayShifts.length > 0) {
                foundSpecificHours = true;
                // Find earliest start and latest end from all shifts for this staff
                for (const shift of dayShifts) {
                  // Convert timestamps to HH:MM:SS if needed
                  const shiftStart = shift.shiftStart.length === 5 ? `${shift.shiftStart}:00` : shift.shiftStart;
                  const shiftEnd = shift.shiftEnd.length === 5 ? `${shift.shiftEnd}:00` : shift.shiftEnd;
                  
                  this.logger.debug(`⏰ Processing shift: ${shiftStart} - ${shiftEnd}`);
                  
                  if (shiftStart < earliestStart) {
                    earliestStart = shiftStart;
                    this.logger.debug(`📅 Updated earliest start to: ${earliestStart}`);
                  }
                  if (shiftEnd > latestEnd) {
                    latestEnd = shiftEnd;
                    this.logger.debug(`📅 Updated latest end to: ${latestEnd}`);
                  }
                }
              } else {
                this.logger.debug(`⚠️ No shifts found for staff ${staffData.firstName} on ${dayOfWeek}`);
              }
            } else {
              this.logger.debug(`❌ Staff ID ${staffId} not found in filtered staff`);
            }
          }
          
          // If we found specific staff hours, use them; otherwise fall back to all staff
          if (foundSpecificHours) {
            this.logger.debug(`✅ Using specific staff hours: ${earliestStart} - ${latestEnd}`);
          } else {
            this.logger.debug('🔍 No specific staff hours found, using hours from all available staff');
          }
        }

        // If no specific staff or we need to expand the range, check all available staff
        if (specificStaffIds.length === 0 || specificStaffIds.some(id => id === 'any') || earliestStart === '09:00:00') {
          this.logger.debug(`🌍 Checking all ${filteredActiveStaff.length} available staff for working hours`);
          
          for (const staffData of filteredActiveStaff) {
            const dayShifts = getShiftsForStaffDay(staffData);
            
            for (const shift of dayShifts) {
              // Convert timestamps to HH:MM:SS if needed
              const shiftStart = shift.shiftStart.length === 5 ? `${shift.shiftStart}:00` : shift.shiftStart;
              const shiftEnd = shift.shiftEnd.length === 5 ? `${shift.shiftEnd}:00` : shift.shiftEnd;
              
              if (shiftStart < earliestStart) {
                earliestStart = shiftStart;
              }
              if (shiftEnd > latestEnd) {
                latestEnd = shiftEnd;
              }
            }
          }
          this.logger.debug(`🌍 Final working hours from all staff: ${earliestStart} - ${latestEnd}`);
        }

        return { earliestStart, latestEnd };
      };

      const { earliestStart, latestEnd } = calculateWorkingHours();
      
      // Calculate the maximum service duration to determine when to stop generating slots
      const maxServiceDuration = Math.max(...servicesWithTotalDuration.map(s => s.totalDuration));
      
      // Parse hours for time slot generation
      const startHour = parseInt(earliestStart.split(':')[0]);
      const startMinute = parseInt(earliestStart.split(':')[1]);
      const endHour = parseInt(latestEnd.split(':')[0]);
      const endMinute = parseInt(latestEnd.split(':')[1]);
      
      // Calculate the latest possible start time for a service to finish before closing
      const latestEndMinutes = endHour * 60 + endMinute;
      const latestStartMinutes = latestEndMinutes - maxServiceDuration;
      const latestStartHour = Math.floor(latestStartMinutes / 60);
      const latestStartMin = latestStartMinutes % 60;

      this.logger.debug(`⏰ Generating time slots from ${earliestStart} to ${latestEnd} based on staff schedules`);
      this.logger.debug(`🕐 Max service duration: ${maxServiceDuration} minutes`);
      this.logger.debug(`🕐 Latest start time: ${latestStartHour.toString().padStart(2, '0')}:${latestStartMin.toString().padStart(2, '0')} (to finish by ${latestEnd})`);

      // Generate time slots based on staff working hours (30-min intervals)
      const generateTimeSlots = () => {
        const slots: string[] = [];
        let currentHour = startHour;
        let currentMinute = startMinute;

        while (currentHour < latestStartHour || (currentHour === latestStartHour && currentMinute <= latestStartMin)) {
          slots.push(`${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}:00`);
          
          currentMinute += 30;
          if (currentMinute >= 60) {
            currentHour++;
            currentMinute = 0;
          }
        }
        
        this.logger.debug(`📅 Generated ${slots.length} time slots from ${slots[0]} to ${slots[slots.length - 1]}`);
        this.logger.debug(`🎯 Last slot ${slots[slots.length - 1]} + ${maxServiceDuration}min = ends at ${addMinutesToTime(slots[slots.length - 1], maxServiceDuration)}`);
        return slots;
      };
      
      // Helper function to add minutes to a time string
      const addMinutesToTime = (timeStr: string, minutes: number): string => {
        const [h, m] = timeStr.split(':').map(Number);
        const totalMinutes = h * 60 + m + minutes;
        const newHour = Math.floor(totalMinutes / 60);
        const newMinute = totalMinutes % 60;
        return `${newHour.toString().padStart(2, '0')}:${newMinute.toString().padStart(2, '0')}:00`;
      };

      const allTimeSlots = generateTimeSlots();
      const availableSlots: any[] = [];

      // Helper: Check if staff is available in a time range
      // Times are stored as local time in the database (no UTC conversion needed)
      const isStaffAvailable = (staffId: string, startTime: string, endTime: string): boolean => {
        const parseTime = (timeStr: string) => {
          const [h, m] = timeStr.split(':').map(Number);
          return h * 60 + m;
        };

        const slotStart = parseTime(startTime);
        const slotEnd = parseTime(endTime);

        // Get staff working hours for the specific day
        const staffData = filteredActiveStaff.find(s => s.id === staffId);
        if (!staffData) return false; // staff doesn't work this day
        
        // Helper to get shifts for current day from new weekly structure or fallback to legacy format
        const getShiftsForDay = (): Array<{ shiftStart: string; shiftEnd: string }> => {
          const staffShifts = (staffData as any).shifts;
          
          // If shifts is in new format (weekly structure)
          if (staffShifts && typeof staffShifts === 'object' && !Array.isArray(staffShifts)) {
            const dayKey = dayOfWeek.toLowerCase();
            const dayShifts = staffShifts[dayKey];
            return dayShifts || [];
          }
          
          // Fallback to legacy format (array of shifts for all days)
          if (staffShifts && Array.isArray(staffShifts)) {
            return staffShifts.filter(shift => 
              shift && 
              typeof shift === 'object' && 
              shift.shiftStart && 
              shift.shiftEnd
            );
          }
          
          return [];
        };

        const dayShifts = getShiftsForDay();
        
        if (dayShifts.length > 0) {
          const withinShift = dayShifts.some(shift => {
            const shiftStartMin = parseTime(shift.shiftStart);
            const shiftEndMin = parseTime(shift.shiftEnd);
            return slotStart >= shiftStartMin && slotEnd <= shiftEndMin;
          });
          if (!withinShift) return false;
        } else {
          // No shifts defined for this day
          return false;
        }

        this.logger.debug(`\n🔍 Checking availability for staff ${staffId} for slot ${startTime} - ${endTime}`);

        for (const booking of existingBookings) {
          if (booking.staffId !== staffId) continue;

          const bookingStart = parseTime(String(booking.startTime));
          const bookingEnd = parseTime(String(booking.endTime));

          this.logger.debug(`  📅 Existing booking: ${booking.startTime} - ${booking.endTime}`);

          // Check overlap
          if (slotStart < bookingEnd && slotEnd > bookingStart) {
            this.logger.debug(`  ❌ CONFLICT: Slot overlaps with existing booking`);
            return false;
          }
        }
        
        this.logger.debug(`  ✅ Staff ${staffId} is AVAILABLE for ${startTime} - ${endTime}`);
        return true;
      };

      // Helper: Add minutes to time string
      const addMinutes = (timeStr: string, minutes: number): string => {
        const [h, m] = timeStr.split(':').map(Number);
        const totalMinutes = h * 60 + m + minutes;
        const newHour = Math.floor(totalMinutes / 60);
        const newMinute = totalMinutes % 60;
        return `${newHour.toString().padStart(2, '0')}:${newMinute.toString().padStart(2, '0')}:00`;
      };

      // Process each time slot
      for (const startTime of allTimeSlots) {
        if (isVIPCombo) {
          // VIP COMBO: All services start at the same time with different staff
          const maxDuration = Math.max(...servicesWithTotalDuration.map(s => s.totalDuration));
          const endTime = addMinutes(startTime, maxDuration);

          const staffAssignments: any[] = [];
          const assignedStaffIds = new Set<string>(); // Track assigned staff to ensure different technicians
          let allServicesCanBeScheduled = true;

          for (const service of servicesWithTotalDuration) {
            const serviceEndTime = addMinutes(startTime, service.totalDuration);
            
            if (service.staffId && service.staffId !== 'any') {
              // Specific staff requested
              if (assignedStaffIds.has(service.staffId)) {
                // Staff already assigned to another service in this VIP combo
                this.logger.debug(`  ❌ Staff ${service.staffId} already assigned to another service in VIP combo`);
                allServicesCanBeScheduled = false;
                break;
              }
              
              if (isStaffAvailable(service.staffId, startTime, serviceEndTime)) {
                const staffInfo = filteredActiveStaff.find(s => s.id === service.staffId);
                staffAssignments.push({
                  serviceId: service.serviceId,
                  staffId: service.staffId,
                  staffName: staffInfo ? `${staffInfo.firstName} ${staffInfo.lastName}` : 'Unknown'
                });
                assignedStaffIds.add(service.staffId);
              } else {
                allServicesCanBeScheduled = false;
                break;
              }
            } else {
              // Any staff - find first available that hasn't been assigned yet
              const availableStaff = filteredActiveStaff.find(s => 
                !assignedStaffIds.has(s.id) && isStaffAvailable(s.id, startTime, serviceEndTime)
              );
              
              if (availableStaff) {
                staffAssignments.push({
                  serviceId: service.serviceId,
                  staffId: availableStaff.id,
                  staffName: `${availableStaff.firstName} ${availableStaff.lastName}`
                });
                assignedStaffIds.add(availableStaff.id);
              } else {
                this.logger.debug(`  ❌ No available staff found for service ${service.serviceId} at ${startTime}`);
                allServicesCanBeScheduled = false;
                break;
              }
            }
          }

          if (allServicesCanBeScheduled) {
            availableSlots.push({
              startTime,
              endTime,
              totalDuration: maxDuration,
              staffAssignments
            });
          }
        } else {
          // CONSECUTIVE: Services one after another
          let currentStartTime = startTime;
          const staffAssignments: any[] = [];
          let allServicesCanBeScheduled = true;

          for (const service of servicesWithTotalDuration) {
            const serviceEndTime = addMinutes(currentStartTime, service.totalDuration);

            if (service.staffId && service.staffId !== 'any') {
              // Specific staff requested
              if (isStaffAvailable(service.staffId, currentStartTime, serviceEndTime)) {
                const staffInfo = filteredActiveStaff.find(s => s.id === service.staffId);
                staffAssignments.push({
                  serviceId: service.serviceId,
                  staffId: service.staffId,
                  staffName: staffInfo ? `${staffInfo.firstName} ${staffInfo.lastName}` : 'Unknown',
                  startTime: currentStartTime,
                  endTime: serviceEndTime
                });
              } else {
                allServicesCanBeScheduled = false;
                break;
              }
            } else {
              // Any staff - find first available
              const availableStaff = filteredActiveStaff.find(s => 
                isStaffAvailable(s.id, currentStartTime, serviceEndTime)
              );
              
              if (availableStaff) {
                staffAssignments.push({
                  serviceId: service.serviceId,
                  staffId: availableStaff.id,
                  staffName: `${availableStaff.firstName} ${availableStaff.lastName}`,
                  startTime: currentStartTime,
                  endTime: serviceEndTime
                });
              } else {
                allServicesCanBeScheduled = false;
                break;
              }
            }

            currentStartTime = serviceEndTime;
          }

          if (allServicesCanBeScheduled) {
            const totalDuration = servicesWithTotalDuration.reduce((sum, s) => sum + s.totalDuration, 0);
            availableSlots.push({
              startTime,
              endTime: currentStartTime,
              totalDuration,
              staffAssignments
            });
          }
        }
      }

      this.logger.debug(`✅ Found ${availableSlots.length} available slots`);

      return {
        success: true,
        data: availableSlots,
        date,
        mode: isVIPCombo ? 'VIP_COMBO' : 'CONSECUTIVE',
        count: availableSlots.length
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      this.logger.error(`Error in getBackofficeAvailability: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * POST /bookings/frontendWeb-availability
   * Turnero-only availability endpoint. Mirrors backoffice-availability logic
   * but keeps a dedicated route for frontend-web traffic.
   */
  @Public()
  @Post('frontendWeb-availability')
  @ApiOperation({
    summary: 'Get available time slots for frontend web turnero',
    description: 'Same availability contract used by turnero, isolated from backoffice route usage.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        services: {
          type: 'array',
          description: 'Array of services with their configuration',
          items: {
            type: 'object',
            properties: {
              serviceId: { type: 'string' },
              duration: { type: 'number' },
              bufferTime: { type: 'number' },
              staffId: { type: 'string', description: 'Staff ID or "any" for any available staff' },
              addons: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    duration: { type: 'number' }
                  }
                }
              }
            }
          }
        },
        removals: {
          type: 'array',
          description: 'Array of removal addons (applied to first service)',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              duration: { type: 'number' }
            }
          }
        },
        date: { type: 'string', description: 'Date in YYYY-MM-DD format' },
        isVIPCombo: { type: 'boolean', description: 'True for simultaneous services, false for consecutive' }
      },
      required: ['services', 'date']
    }
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Available time slots retrieved successfully for frontend web',
  })
  @HttpCode(HttpStatus.OK)
  async getFrontendWebAvailability(
    @Body() body: {
      services: Array<{
        serviceId: string;
        duration: number;
        bufferTime: number;
        staffId?: string;
        addons?: Array<{ id: string; duration: number }>;
      }>;
      removals?: Array<{ id: string; duration: number }>;
      date: string;
      isVIPCombo?: boolean;
    },
  ) {
    return this.getBackofficeAvailability(body);
  }

  @Post('multi-service-slots')
  @Public() // Allow public access for booking flow (combo packages without VIP)
  @ApiOperation({
    summary: 'Get available time slots for multiple consecutive services',
    description: 'Retrieve available time slots where multiple services can be performed consecutively. Each service may be performed by a different technician, but all must be available in consecutive time slots. Supports addons per service.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        servicesWithAddons: {
          type: 'array',
          description: 'Array of services with their addons',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', description: 'Service ID' },
              duration: { type: 'number', description: 'Service duration in minutes' },
              addOns: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    additionalTime: { type: 'number', description: 'Additional time in minutes' },
                    price: { type: 'number', description: 'Price in cents' }
                  }
                }
              }
            }
          },
          example: [{ id: 'service-id-1', duration: 45, addOns: [{ id: 'addon-1', additionalTime: 10 }] }]
        },
        date: {
          type: 'string',
          description: 'Date in YYYY-MM-DD format',
          example: '2025-11-24'
        },
        selectedTechnicianId: {
          type: 'string',
          description: 'Optional: UUID of preferred technician for first service',
          example: 'tech-id-1'
        }
      },
      required: ['servicesWithAddons', 'date']
    }
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Available multi-service time slots retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @HttpCode(HttpStatus.OK)
  async getMultiServiceSlots(
    @Body() body: { servicesWithAddons: any[]; date: string; selectedTechnicianId?: string },
  ) {
    try {
      const { servicesWithAddons, date, selectedTechnicianId } = body;

      // Validation
      if (!servicesWithAddons || !Array.isArray(servicesWithAddons) || servicesWithAddons.length === 0) {
        throw new BadRequestException('servicesWithAddons must be a non-empty array');
      }

      if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        throw new BadRequestException('Date must be in YYYY-MM-DD format');
      }

      // Extract service IDs for backwards compatibility
      const serviceIds = servicesWithAddons.map(s => s.id);

      // Call the multi-service availability service
      const availableSlots = await this.multiServiceAvailabilityService.findMultiServiceSlots(
        serviceIds,
        date,
        selectedTechnicianId,
        servicesWithAddons
      );

      this.logger.debug(`\n🎯 CONTROLLER RESPONSE:`);
      this.logger.debug(`   Found ${availableSlots.length} slots`);
      if (availableSlots.length > 0) {
        this.logger.debug(`   Sample slot structure:`, JSON.stringify(availableSlots[0], null, 2));
      }

      return {
        success: true,
        data: availableSlots,
        date,
        serviceIds,
        servicesWithAddons,
        count: availableSlots.length
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      this.logger.error(`Error in getMultiServiceSlots: ${errorMessage}`);
      throw error;
    }
  }

  @Post('vip-combo-slots')
  @Public() // Allow public access for booking flow
  @ApiOperation({
    summary: 'Get available time slots for VIP Combo (simultaneous services)',
    description: 'Retrieve available time slots where two services can be performed SIMULTANEOUSLY by two different technicians. This is for VIP Combo bookings where Mani + Pedi are done at the same time.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        servicesWithAddons: {
          type: 'array',
          description: 'Array of exactly 2 services with their addons (must be combo-eligible)',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', description: 'Service ID' },
              duration: { type: 'number', description: 'Service duration in minutes' },
              addOns: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    additionalTime: { type: 'number' },
                    price: { type: 'number' }
                  }
                }
              }
            }
          }
        },
        date: {
          type: 'string',
          description: 'Date in YYYY-MM-DD format',
          example: '2025-12-20'
        }
      },
      required: ['servicesWithAddons', 'date']
    }
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Available VIP combo time slots retrieved successfully',
  })
  @HttpCode(HttpStatus.OK)
  async getVIPComboSlots(
    @Body() body: { servicesWithAddons: any[]; date: string; selectedTechnicianId?: string; selectedServiceId?: string },
  ) {
    try {
      const { servicesWithAddons, date, selectedTechnicianId, selectedServiceId } = body;

      // Validation
      if (!servicesWithAddons || !Array.isArray(servicesWithAddons) || servicesWithAddons.length !== 2) {
        throw new BadRequestException('VIP Combo requires exactly 2 services');
      }

      if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        throw new BadRequestException('Date must be in YYYY-MM-DD format');
      }

      const serviceIds = servicesWithAddons.map(s => s.id);

      this.logger.debug(`\n🌟 VIP COMBO REQUEST:`);
      this.logger.debug(`   Selected Technician: ${selectedTechnicianId || 'none'}`);
      this.logger.debug(`   Selected Service: ${selectedServiceId || 'none'}`);

      // Call the VIP combo availability service
      const availableSlots = await this.multiServiceAvailabilityService.findVIPComboSlots(
        serviceIds,
        date,
        servicesWithAddons,
        selectedTechnicianId,
        selectedServiceId
      );

      this.logger.debug(`\n🌟 VIP COMBO CONTROLLER RESPONSE:`);
      this.logger.debug(`   Found ${availableSlots.length} simultaneous slots`);

      return {
        success: true,
        data: availableSlots,
        date,
        serviceIds,
        isVIPCombo: true,
        count: availableSlots.length
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      this.logger.error(`Error in getVIPComboSlots: ${errorMessage}`);
      throw error;
    }
  }

  @RequireAuth()
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

      // Compute totalPrice server-side — never trust the client-supplied value
      let serverTotalPrice = 0;
      if (createBookingDto.serviceId) {
        const service = await this.serviceModel.findByPk(createBookingDto.serviceId, { attributes: ['price'] });
        if (service) {
          serverTotalPrice = Number((service as any).price) || 0;
          if (createBookingDto.addOnIds?.length) {
            const addOns = await this.addOnModel.findAll({
              where: { id: createBookingDto.addOnIds },
              attributes: ['price'],
            });
            serverTotalPrice += addOns.reduce((sum, a) => sum + (Number((a as any).price) || 0), 0);
          }
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

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const booking = await this.bookingModel.findByPk(id);

    if (!booking) {
      throw new NotFoundException(`Booking with ID ${id} not found`);
    }

    await booking.destroy();
    return { message: `Booking with ID ${id} has been deleted` };
  }

  @RequireAuth()
  @Get('config/buffer-time')
  @ApiOperation({ summary: 'Obtener configuración de buffer time global' })
  @ApiResponse({ 
    status: 200, 
    description: 'Buffer time actual en minutos',
    schema: {
      properties: {
        bufferTime: { type: 'number' },
        description: { type: 'string' }
      }
    }
  })
  getBufferTimeConfig() {
    return {
      bufferTime: BookingConfig.getDefaultBufferTime(),
      description: 'Tiempo de limpieza/preparación entre servicios (minutos)'
    };
  }

  @Put('config/buffer-time')
  @ApiOperation({ summary: 'Actualizar configuración de buffer time global' })
  @ApiBody({ 
    schema: { 
      properties: { 
        bufferTime: { type: 'number', minimum: 0, description: 'Buffer time en minutos' } 
      } 
    } 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Buffer time actualizado exitosamente',
    schema: {
      properties: {
        success: { type: 'boolean' },
        bufferTime: { type: 'number' },
        message: { type: 'string' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Buffer time inválido' })
  updateBufferTimeConfig(@Body('bufferTime') bufferTime: number) {
    try {
      BookingConfig.setDefaultBufferTime(bufferTime);
      return {
        success: true,
        bufferTime: BookingConfig.getDefaultBufferTime(),
        message: 'Buffer time actualizado exitosamente'
      };
    } catch (error) {
      throw new BadRequestException(error.message);
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
      return booking;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException('Error confirming booking: ' + errorMessage);
    }
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

    // Find staff members who are available at the requested time
    const availableStaff: AvailableStaffMember[] = [];

    for (const staff of allActiveStaff) {
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

  private generateTimeSlots(): Array<{ time: string; available: boolean }> {
    const slots: Array<{ time: string; available: boolean }> = [];
    const startHour = 7;
    const startMinute = 0;
    const endHour = 21;
    const endMinute = 30;
    const intervalMinutes = 30; // 30 minute intervals

    const currentTime = new Date();
    currentTime.setHours(startHour, startMinute, 0, 0);

    const endTime = new Date();
    endTime.setHours(endHour, endMinute, 0, 0);

    while (currentTime <= endTime) {
      const timeString = currentTime.toTimeString().substring(0, 5);
      slots.push({
        time: timeString,
        available: true // Default to available, will be filtered later
      });

      currentTime.setMinutes(currentTime.getMinutes() + intervalMinutes);
    }

    return slots;
  }

  // ============================================================================
  // MULTI-SERVICE BOOKING ENDPOINTS
  // ============================================================================

  /**
   * 🔒 VERIFICACIÓN GLOBAL DE DISPONIBILIDAD CON PERMUTACIONES
   * Este endpoint usa el algoritmo central de disponibilidad que prueba todas
   * las permutaciones posibles del orden de servicios.
   * 
   * Úsalo para:
   * - Verificar antes de confirmar un booking
   * - Re-verificar disponibilidad si pasó tiempo desde la selección del slot
   * - Obtener las asignaciones óptimas de staff para un slot específico
   * 
   * POST /bookings/verify-slot-with-permutations
   */
  @Post('verify-slot-with-permutations')
  @Public() // Allow public access for booking flow
  @ApiOperation({
    summary: 'Verify slot availability using all permutations',
    description: 'Central availability check that tries all service order permutations to find valid staff assignments'
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['serviceIds', 'date', 'startTime'],
      properties: {
        serviceIds: {
          type: 'array',
          items: { type: 'string', format: 'uuid' },
          description: 'Array of service IDs to book'
        },
        date: {
          type: 'string',
          format: 'date',
          example: '2025-12-16',
          description: 'Booking date in YYYY-MM-DD format'
        },
        startTime: {
          type: 'string',
          example: '11:30',
          description: 'Start time in HH:mm format'
        },
        selectedTechnicianId: {
          type: 'string',
          format: 'uuid',
          description: 'Optional: ID of the technician selected by the customer'
        },
        servicesWithAddons: {
          type: 'array',
          description: 'Optional: Services with their addon details for duration calculation',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              addOns: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', format: 'uuid' },
                    additionalTime: { type: 'number' },
                    price: { type: 'number' }
                  }
                }
              }
            }
          }
        }
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Slot verification result with optimal staff assignments',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        available: { type: 'boolean' },
        totalDuration: { type: 'number', description: 'Total duration in minutes' },
        totalPrice: { type: 'number', description: 'Total price in cents' },
        permutationUsed: {
          type: 'array',
          items: { type: 'string' },
          description: 'Order of services in the successful permutation'
        },
        assignments: {
          type: 'array',
          description: 'Staff assignments for each service in the optimal order',
          items: {
            type: 'object',
            properties: {
              serviceId: { type: 'string' },
              serviceName: { type: 'string' },
              staffId: { type: 'string' },
              staffName: { type: 'string' },
              startTime: { type: 'string' },
              endTime: { type: 'string' },
              duration: { type: 'number' }
            }
          }
        }
      }
    }
  })
  async verifySlotWithPermutations(
    @Body() body: {
      serviceIds: string[];
      date: string;
      startTime: string;
      selectedTechnicianId?: string;
      servicesWithAddons?: any[];
    }
  ) {
    const result = await this.multiServiceAvailabilityService.verifySlotAvailability(
      body.serviceIds,
      body.date,
      body.startTime,
      body.selectedTechnicianId,
      body.servicesWithAddons
    );

    return {
      success: true,
      ...result
    };
  }

  /**
   * Verifica disponibilidad de múltiples slots con sus técnicos asignados
   * POST /bookings/verify-multi-availability
   */
  @Post('verify-multi-availability')
  @ApiOperation({
    summary: 'Verify availability for multiple service slots',
    description: 'Check if all slots with their assigned technicians are still available before creating bookings'
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        date: { type: 'string', format: 'date', example: '2025-12-02' },
        slots: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              serviceId: { type: 'string', format: 'uuid' },
              staffId: { type: 'string', format: 'uuid' },
              startTime: { type: 'string', format: 'date-time' },
              endTime: { type: 'string', format: 'date-time' }
            }
          }
        }
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Availability check result',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        available: { type: 'boolean' },
        conflicts: { type: 'array', items: { type: 'object' } }
      }
    }
  })
  async verifyMultiAvailability(
    @Body() body: {
      date: string;
      slots: Array<{
        serviceId: string;
        staffId: string;
        startTime: string;
        endTime: string;
      }>;
    }
  ) {
    const conflicts: Array<{
      serviceId: string;
      staffId: string;
      requestedStart: string;
      requestedEnd: string;
      conflictingBookingId: string;
      conflictingStart: string;
      conflictingEnd: string;
    }> = [];

    for (const slot of body.slots) {
      // Verificar si el técnico tiene alguna reserva que se superponga con este slot
      const existingBookings = await this.bookingModel.findAll({
        where: {
          staffId: slot.staffId,
          appointmentDate: body.date,
          status: {
            [Op.in]: ['pending', 'in_progress']
          }
        }
      });

      // Revisar si hay solapamiento de horarios
      for (const booking of existingBookings) {
        const slotStart = new Date(slot.startTime);
        const slotEnd = new Date(slot.endTime);
        const bookingStart = new Date(booking.startTime);
        const bookingEnd = new Date(booking.endTime);

        // Hay conflicto si los rangos se superponen
        if (slotStart < bookingEnd && slotEnd > bookingStart) {
          conflicts.push({
            serviceId: slot.serviceId,
            staffId: slot.staffId,
            requestedStart: slot.startTime,
            requestedEnd: slot.endTime,
            conflictingBookingId: booking.id,
            conflictingStart: booking.startTime,
            conflictingEnd: booking.endTime
          });
        }
      }
    }

    return {
      success: true,
      available: conflicts.length === 0,
      conflicts
    };
  }

  /**
   * Crea múltiples bookings en una transacción atómica
   * POST /bookings/create-multiple
   */
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
}