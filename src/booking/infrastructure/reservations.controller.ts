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
  HttpStatus,
  ValidationPipe,
  ParseUUIDPipe,
  ParseIntPipe,
  HttpCode,
  ConflictException,
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
import { Sequelize } from 'sequelize-typescript';
import { BookingEntity } from './persistence/entities/booking.entity';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { BookingStatus } from '../domain/value-objects/booking-status.vo';
import { MultiServiceAvailabilityService } from '../application/services/multi-service-availability.service';
import { SkipCsrf } from '../../common/decorators/csrf.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { DashboardStatsDto } from './dto/dashboard-stats.dto';
import { BestSellingServiceDto } from './dto/best-selling-service.dto';
import { TopStaffDto } from './dto/top-staff.dto';
import { UpcomingBookingDto } from './dto/upcoming-booking.dto';
import { BookingsBySourceDto } from './dto/bookings-by-source.dto';
import { ManualAdjustment } from '../../common/entities/manual-adjustment.entity';

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

// Force recompilation

@ApiTags('bookings')
@Controller('bookings')
export class ReservationsController {
  constructor(
    @InjectModel(BookingEntity)
    private bookingModel: typeof BookingEntity,
    @InjectModel(ManualAdjustment)
    private manualAdjustmentModel: typeof ManualAdjustment,
    private sequelize: Sequelize,
    private multiServiceAvailabilityService: MultiServiceAvailabilityService,
  ) { }

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
  @ApiQuery({ name: 'search', required: false, type: 'string', description: 'Search in notes' })
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
      where.notes = {
        [Op.iLike]: `%${search}%`
      };
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

  @Get('dashboard/stats')
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

    // Get completed bookings with payment method
    const completedBookings = await this.bookingModel.findAll({
      where: {
        status: BookingStatus.COMPLETED,
        appointmentDate: {
          [Op.between]: [startDate, endDate],
        },
      },
      attributes: ['totalAmount', 'paymentMethod'],
    });

    // Get manual adjustments in the date range
    const manualAdjustments = await this.manualAdjustmentModel.findAll({
      where: {
        createdAt: {
          [Op.between]: [
            new Date(startDate + ' 00:00:00'),
            new Date(endDate + ' 23:59:59')
          ],
        },
      },
      attributes: ['amount', 'paymentMethod', 'type'],
    });

    // Calculate cash and bank totals based on payment method
    let cash = 0;
    let bank = 0;
    
    // Add bookings to totals
    for (const booking of completedBookings) {
      const amount = parseFloat(String(booking.totalAmount || 0));
      if (booking.paymentMethod === 'CASH') {
        cash += amount;
      } else if (booking.paymentMethod === 'CARD') {
        bank += amount;
      }
    }

    // Add manual adjustments to totals (expenses are negative)
    for (const adjustment of manualAdjustments) {
      const amount = parseFloat(String(adjustment.amount || 0));
      const adjustmentAmount = adjustment.type === 'expense' ? -amount : amount;
      
      if (adjustment.paymentMethod === 'CASH') {
        cash += adjustmentAmount;
      } else if (adjustment.paymentMethod === 'CARD') {
        bank += adjustmentAmount;
      }
    }

    // Count completed bookings
    const bookingsCount = await this.bookingModel.count({
      where: {
        status: BookingStatus.COMPLETED,
        appointmentDate: {
          [Op.between]: [startDate, endDate],
        },
      },
    });

    // Count distinct services
    const distinctServicesResult: any[] = await this.sequelize.query(
      `
      SELECT COUNT(DISTINCT "serviceId") as count
      FROM bookings
      WHERE status = 'completed'
        AND "appointmentDate" >= :startDate
        AND "appointmentDate" <= :endDate
      `,
      {
        replacements: { startDate, endDate },
        type: QueryTypes.SELECT,
      },
    );

    const distinctServices = parseInt(distinctServicesResult[0]?.count || '0');

    // Count new customers (created in the date range with completed bookings)
    const newCustomersResult: any[] = await this.sequelize.query(
      `
      SELECT COUNT(DISTINCT c.id) as count
      FROM customers c
      INNER JOIN bookings b ON b."customerId" = c.id
      WHERE b.status = 'completed'
        AND b."appointmentDate" >= :startDate
        AND b."appointmentDate" <= :endDate
        AND c."createdAt" >= :startDate
        AND c."createdAt" <= (:endDate || ' 23:59:59')::timestamp
      `,
      {
        replacements: { startDate, endDate },
        type: QueryTypes.SELECT,
      },
    );

    const newCustomers = parseInt(newCustomersResult[0]?.count || '0');

    return {
      success: true,
      data: {
        cash,
        bank,
        bookings: bookingsCount,
        distinctServices,
        newCustomers,
      },
    };
  }

  @Get('dashboard/revenue-by-service')
  @ApiOperation({
    summary: 'Get revenue by service',
    description: 'Retrieve revenue grouped by service for a given date range.',
  })
  @ApiQuery({ name: 'startDate', required: true, type: 'string', description: 'Start date in YYYY-MM-DD format' })
  @ApiQuery({ name: 'endDate', required: true, type: 'string', description: 'End date in YYYY-MM-DD format' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Revenue by service retrieved successfully',
  })
  async getRevenueByService(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ): Promise<{ success: boolean; data: Array<{ service: string; revenue: number }> }> {
    if (!startDate || !endDate) {
      throw new BadRequestException('startDate and endDate are required');
    }

    const result: any[] = await this.sequelize.query(
      `
      SELECT 
        s.name as "serviceName",
        SUM(b."totalAmount") as "totalRevenue"
      FROM bookings b
      INNER JOIN services s ON b."serviceId" = s.id
      WHERE b.status = 'completed'
        AND b."appointmentDate" >= :startDate::date
        AND b."appointmentDate" <= :endDate::date
      GROUP BY s.name
      ORDER BY SUM(b."totalAmount") DESC
      `,
      {
        replacements: { startDate, endDate },
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

  @Get('invoices')
  @ApiOperation({
    summary: 'Get all invoices',
    description: 'Retrieve all invoices including completed bookings and manual adjustments for a given date range with pagination.',
  })
  @ApiQuery({ name: 'startDate', required: true, type: 'string', description: 'Start date in YYYY-MM-DD format' })
  @ApiQuery({ name: 'endDate', required: true, type: 'string', description: 'End date in YYYY-MM-DD format' })
  @ApiQuery({ name: 'page', required: false, type: 'number', description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: 'number', description: 'Items per page (default: 10)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Invoices retrieved successfully',
  })
  async getInvoices(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 10,
  ): Promise<{ success: boolean; data: any[]; pagination: any }> {
    if (!startDate || !endDate) {
      throw new BadRequestException('startDate and endDate are required');
    }

    // Get completed bookings with customer and service info
    const bookingsResult: any[] = await this.sequelize.query(
      `
      SELECT 
        b.id,
        'booking' as "type",
        CONCAT(c."firstName", ' ', c."lastName") as "customerName",
        c.email as "customerEmail",
        s.name as "serviceName",
        b."appointmentDate",
        b."startTime",
        b."endTime",
        b."paymentMethod",
        b."totalAmount",
        b."createdAt"
      FROM bookings b
      INNER JOIN customers c ON b."customerId" = c.id
      INNER JOIN services s ON b."serviceId" = s.id
      WHERE b.status = 'completed'
        AND b."appointmentDate" >= :startDate
        AND b."appointmentDate" <= :endDate
      ORDER BY b."appointmentDate" DESC, b."startTime" DESC
      `,
      {
        replacements: { startDate, endDate },
        type: QueryTypes.SELECT,
      },
    );

    // Get manual adjustments
    const adjustmentsResult: any[] = await this.sequelize.query(
      `
      SELECT 
        ma.id,
        CASE 
          WHEN ma.type = 'income' THEN 'adjustment_income'
          ELSE 'adjustment_expense'
        END as "type",
        'Manual Adjustment' as "customerName",
        '' as "customerEmail",
        ma.description as "serviceName",
        DATE(ma."createdAt") as "appointmentDate",
        TO_CHAR(ma."createdAt", 'HH24:MI') as "startTime",
        TO_CHAR(ma."createdAt", 'HH24:MI') as "endTime",
        ma."paymentMethod",
        CASE 
          WHEN ma.type = 'expense' THEN -ma.amount
          ELSE ma.amount
        END as "totalAmount",
        ma."createdAt"
      FROM manual_adjustments ma
      WHERE DATE(ma."createdAt") >= :startDate
        AND DATE(ma."createdAt") <= :endDate
      ORDER BY ma."createdAt" DESC
      `,
      {
        replacements: { startDate, endDate },
        type: QueryTypes.SELECT,
      },
    );

    // Combine and sort by appointment date and time (most recent first)
    const allInvoices = [...bookingsResult, ...adjustmentsResult].sort((a, b) => {
      // Normalizar appointmentDate a string YYYY-MM-DD
      const dateStrA = a.appointmentDate instanceof Date 
        ? a.appointmentDate.toISOString().split('T')[0]
        : String(a.appointmentDate);
      const dateStrB = b.appointmentDate instanceof Date 
        ? b.appointmentDate.toISOString().split('T')[0]
        : String(b.appointmentDate);
      
      // Normalizar startTime a HH:MM
      let timeStrA: string;
      let timeStrB: string;
      
      // Si startTime es un objeto Date (bookings), extraer HH:MM
      if (a.startTime instanceof Date) {
        timeStrA = a.startTime.toTimeString().substring(0, 5);
      } else if (typeof a.startTime === 'string' && a.startTime.includes('T')) {
        // Si es un string con timestamp ISO, extraer la hora
        timeStrA = new Date(a.startTime).toTimeString().substring(0, 5);
      } else {
        // Si es un string simple como "01:06", usar como está
        timeStrA = String(a.startTime);
      }
      
      if (b.startTime instanceof Date) {
        timeStrB = b.startTime.toTimeString().substring(0, 5);
      } else if (typeof b.startTime === 'string' && b.startTime.includes('T')) {
        timeStrB = new Date(b.startTime).toTimeString().substring(0, 5);
      } else {
        timeStrB = String(b.startTime);
      }
      
      // Crear timestamps completos para comparación precisa
      const timestampA = new Date(`${dateStrA}T${timeStrA}:00`);
      const timestampB = new Date(`${dateStrB}T${timeStrB}:00`);
      
      // Ordenar de más reciente a más antiguo
      return timestampB.getTime() - timestampA.getTime();
    });

    // Apply pagination
    const total = allInvoices.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const paginatedInvoices = allInvoices.slice(offset, offset + limit);

    return {
      success: true,
      data: paginatedInvoices,
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
      createdBy?: string;
    },
  ): Promise<{ success: boolean; data: ManualAdjustment }> {
    if (!createDto.type || !createDto.description || !createDto.amount || !createDto.paymentMethod) {
      throw new BadRequestException('type, description, amount, and paymentMethod are required');
    }

    if (createDto.amount <= 0) {
      throw new BadRequestException('amount must be greater than 0');
    }

    const adjustment = await this.manualAdjustmentModel.create({
      type: createDto.type,
      description: createDto.description,
      amount: createDto.amount,
      paymentMethod: createDto.paymentMethod,
      createdBy: createDto.createdBy || null,
    });

    return {
      success: true,
      data: adjustment,
    };
  }

  @Get('dashboard/best-selling-services')
  @ApiOperation({
    summary: 'Get best selling services',
    description: 'Retrieve the top performing services by bookings count and revenue for a given date range.',
  })
  @ApiQuery({ name: 'startDate', required: true, type: 'string', description: 'Start date in YYYY-MM-DD format' })
  @ApiQuery({ name: 'endDate', required: true, type: 'string', description: 'End date in YYYY-MM-DD format' })
  @ApiQuery({ name: 'limit', required: false, type: 'number', description: 'Number of services to return (default: 5)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Best selling services retrieved successfully',
    type: [BestSellingServiceDto],
  })
  async getBestSellingServices(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 5,
  ): Promise<{ success: boolean; data: BestSellingServiceDto[] }> {
    if (!startDate || !endDate) {
      throw new BadRequestException('startDate and endDate are required');
    }

    const result: any[] = await this.sequelize.query(
      `
      SELECT 
        s.id as "serviceId",
        s.name as "serviceName",
        COUNT(b.id) as "bookingsCount",
        SUM(b."totalAmount") as "totalRevenue",
        AVG(b."totalAmount") as "averagePrice"
      FROM bookings b
      INNER JOIN services s ON b."serviceId" = s.id
      WHERE b.status = 'completed'
        AND b."appointmentDate" >= :startDate
        AND b."appointmentDate" <= :endDate
      GROUP BY s.id, s.name
      ORDER BY COUNT(b.id) DESC, SUM(b."totalAmount") DESC
      LIMIT :limit
      `,
      {
        replacements: { startDate, endDate, limit },
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

    const result: any[] = await this.sequelize.query(
      `
      SELECT 
        s.id as "staffId",
        CONCAT(s."firstName", ' ', s."lastName") as "staffName",
        COUNT(b.id) as "bookingsCount",
        SUM(b."totalAmount") as "totalRevenue",
        s.role as role
      FROM bookings b
      INNER JOIN staff s ON b."staffId" = s.id
      WHERE b.status = 'completed'
        AND b."appointmentDate" >= :startDate
        AND b."appointmentDate" <= :endDate
      GROUP BY s.id, s."firstName", s."lastName", s.role
      ORDER BY COUNT(b.id) DESC, SUM(b."totalAmount") DESC
      LIMIT :limit
      `,
      {
        replacements: { startDate, endDate, limit },
        type: QueryTypes.SELECT,
      },
    );

    console.log('Top Staff Query Result:', result);
    console.log('Query parameters:', { startDate, endDate, limit });

    const topStaff = result.map(row => ({
      staffId: row.staffId,
      staffName: row.staffName,
      bookingsCount: parseInt(row.bookingsCount || '0'),
      totalRevenue: parseFloat(row.totalRevenue || '0'),
      role: row.role || 'Technician',
    }));

    console.log('Top Staff Mapped:', topStaff);

    return {
      success: true,
      data: topStaff,
    };
  }

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

    console.log('Bookings by Source Query Result:', result);

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

  @Get('upcoming')
  @ApiOperation({
    summary: 'Get upcoming bookings',
    description: 'Retrieve upcoming confirmed bookings starting from now.',
  })
  @ApiQuery({ name: 'limit', required: false, type: 'number', description: 'Number of bookings to return (default: 10)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Upcoming bookings retrieved successfully',
    type: [UpcomingBookingDto],
  })
  async getUpcomingBookings(
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 10,
  ): Promise<{ success: boolean; data: UpcomingBookingDto[] }> {
    
    const result: any[] = await this.sequelize.query(
      `
      SELECT 
        b.id,
        CONCAT(c."firstName", ' ', c."lastName") as "customerName",
        s.name as "serviceName",
        CONCAT(st."firstName", ' ', st."lastName") as "staffName",
        b."appointmentDate",
        b.status,
        b."totalAmount"
      FROM bookings b
      INNER JOIN customers c ON b."customerId" = c.id
      INNER JOIN services s ON b."serviceId" = s.id
      INNER JOIN staff st ON b."staffId" = st.id
      WHERE b.status IN ('pending', 'confirmed')
      ORDER BY b."appointmentDate" DESC
      LIMIT :limit
      `,
      {
        replacements: { limit },
        type: QueryTypes.SELECT,
      },
    );

    const upcomingBookings = result.map(row => ({
      id: row.id,
      customerName: row.customerName,
      serviceName: row.serviceName,
      staffName: row.staffName,
      appointmentDate: row.appointmentDate,
      status: row.status,
      totalAmount: parseFloat(row.totalAmount || '0'),
    }));

    return {
      success: true,
      data: upcomingBookings,
    };
  }

  @Get('available-slots')
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
    const allActiveStaff: Array<{ id: string }> = await this.sequelize.query(
      `SELECT id FROM staff WHERE status = 'ACTIVE' AND "isBookable" = true`,
      {
        type: QueryTypes.SELECT,
        raw: true
      }
    );

    const allActiveStaffIds: string[] = allActiveStaff.map(staff => staff.id);

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

      // Extract time from booking - can be either a Date object or a time string (HH:MM:SS)
      // depending on how PostgreSQL returns it
      let startTime: string;
      let endTime: string;

      if (typeof booking.startTime === 'string') {
        // Already a time string like "21:30:00"
        startTime = booking.startTime.slice(0, 5);
        endTime = (booking.endTime as string).slice(0, 5);
      } else {
        // It's a Date object, extract time
        const startTimeObj = new Date(booking.startTime);
        const endTimeObj = new Date(booking.endTime);
        startTime = startTimeObj.toTimeString().slice(0, 5);
        endTime = endTimeObj.toTimeString().slice(0, 5);
      }

      console.log(`[AVAILABILITY] Booking found: staff=${staff}, startTime=${startTime}, endTime=${endTime}`);

      allTimeSlots.forEach(slot => {
        // Check if this slot would overlap with the existing booking
        // Assume each slot is 60 minutes duration (can be made configurable later)
        const slotDurationMinutes = 60;

        // Calculate slot end time properly
        const [slotHour, slotMinute] = slot.time.split(':').map(Number);
        const slotEndHour = slotHour + Math.floor((slotMinute + slotDurationMinutes) / 60);
        const slotEndMinute = (slotMinute + slotDurationMinutes) % 60;
        const slotEndTimeString = `${slotEndHour.toString().padStart(2, '0')}:${slotEndMinute.toString().padStart(2, '0')}`;

        // Convert times to minutes for proper comparison
        const parseTimeToMinutes = (timeStr: string) => {
          const [hours, minutes] = timeStr.split(':').map(Number);
          return hours * 60 + minutes;
        };

        const slotStartMinutes = parseTimeToMinutes(slot.time);
        const slotEndMinutes = parseTimeToMinutes(slotEndTimeString);
        const bookingStartMinutes = parseTimeToMinutes(startTime);
        const bookingEndMinutes = parseTimeToMinutes(endTime);

        // Check for overlap: slot overlaps with booking if:
        // slot start < booking end AND slot end > booking start
        const slotOverlaps = slotStartMinutes < bookingEndMinutes && slotEndMinutes > bookingStartMinutes;

        if (slotOverlaps) {
          bookedSlotsByStaff.get(staff)!.add(slot.time);
        }
      });
    });

    // Filter available slots
    const availableSlots = allTimeSlots.map(slot => {
      let isAvailable = true;

      if (staffId) {
        // If specific staff requested, check only their bookings
        const staffBookedSlots = bookedSlotsByStaff.get(staffId) || new Set();
        isAvailable = !staffBookedSlots.has(slot.time);
      } else {
        // If no staff filter ("Any artist"), slot is available if at least one staff member is free
        const freeStaffCount = Array.from(bookedSlotsByStaff.entries())
          .filter(([, staffSlots]) => !staffSlots.has(slot.time)).length;

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
      afternoon: availableSlots.filter(slot => slot.time >= '12:00' && slot.time < '18:00'),
      evening: availableSlots.filter(slot => slot.time >= '18:00' && slot.time <= '21:30')
    };

    return {
      success: true,
      data: groupedSlots,
      date,
      staffId: staffId || 'all'
    };
  }

  @Post('multi-service-slots')
  @Public() // Allow public access for booking flow (combo packages without VIP)
  @SkipCsrf() // Read operation, skip CSRF for performance
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

      console.log(`\n🎯 CONTROLLER RESPONSE:`);
      console.log(`   Found ${availableSlots.length} slots`);
      if (availableSlots.length > 0) {
        console.log(`   Sample slot structure:`, JSON.stringify(availableSlots[0], null, 2));
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
      console.error('Error in getMultiServiceSlots:', errorMessage, error);
      throw error;
    }
  }

  @Post('vip-combo-slots')
  @Public() // Allow public access for booking flow
  @SkipCsrf()
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

      console.log(`\n🌟 VIP COMBO REQUEST:`);
      console.log(`   Selected Technician: ${selectedTechnicianId || 'none'}`);
      console.log(`   Selected Service: ${selectedServiceId || 'none'}`);

      // Call the VIP combo availability service
      const availableSlots = await this.multiServiceAvailabilityService.findVIPComboSlots(
        serviceIds,
        date,
        servicesWithAddons,
        selectedTechnicianId,
        selectedServiceId
      );

      console.log(`\n🌟 VIP COMBO CONTROLLER RESPONSE:`);
      console.log(`   Found ${availableSlots.length} simultaneous slots`);

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
      console.error('Error in getVIPComboSlots:', errorMessage, error);
      throw error;
    }
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
  @SkipCsrf()
  @Post()
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
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body(new ValidationPipe({ transform: true })) createBookingDto: CreateBookingDto,
  ) {
    try {
      // Combine appointmentDate with startTime/endTime to create full datetime
      // Frontend sends startTime as "HH:mm:ss", we need to combine with date for DB
      const appointmentDate = createBookingDto.appointmentDate;
      const fullStartTime = `${appointmentDate}T${createBookingDto.startTime}`;
      const fullEndTime = `${appointmentDate}T${createBookingDto.endTime}`;

      // Set default status to 'pending' if not provided
      const bookingData = {
        ...createBookingDto,
        startTime: fullStartTime,
        endTime: fullEndTime,
        status: createBookingDto.status || 'pending',
      };

      // Check for conflicting bookings before creating
      const conflictingBookings = await this.bookingModel.findAll({
        where: {
          staffId: createBookingDto.staffId,
          appointmentDate: createBookingDto.appointmentDate,
          status: {
            [Op.notIn]: ['cancelled', 'completed']
          }
        }
      });

      // Check if there's any time overlap
      const requestStartTime = new Date(fullStartTime);
      const requestEndTime = new Date(fullEndTime);

      for (const booking of conflictingBookings) {
        const existingStartTime = new Date(booking.startTime);
        const existingEndTime = new Date(booking.endTime);

        // Check for overlap: new booking overlaps if:
        // new start < existing end AND new end > existing start
        const hasOverlap = requestStartTime < existingEndTime && requestEndTime > existingStartTime;

        if (hasOverlap) {
          throw new BadRequestException(
            `This time slot is no longer available. The staff member already has a booking from ${existingStartTime.toLocaleTimeString()} to ${existingEndTime.toLocaleTimeString()}.`
          );
        }
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const createdBooking = await this.bookingModel.create(bookingData as any);

      return createdBooking;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException('Error creating booking: ' + errorMessage);
    }
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateBookingDto: UpdateBookingDto) {
    const booking = await this.bookingModel.findByPk(id);

    if (!booking) {
      throw new NotFoundException(`Booking with ID ${id} not found`);
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      await booking.update(updateBookingDto as any);
      return booking;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
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

  @Put(':id/cancel')
  async cancel(@Param('id') id: string, @Body('reason') reason?: string) {
    const booking = await this.bookingModel.findByPk(id);

    if (!booking) {
      throw new NotFoundException(`Booking with ID ${id} not found`);
    }

    try {
      await booking.update({
        status: BookingStatus.CANCELLED,
        notes: reason ? `${booking.notes ? booking.notes + ' | ' : ''}Cancelled: ${reason}` : booking.notes,
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
        status: BookingStatus.CONFIRMED,
      });
      return booking;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    }
  }

  @Public()
  @Post('assign-optimal-staff')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Find optimal staff for "Any Artist" booking',
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

    // Calculate appointment end time
    const [requestHour, requestMinute] = time.split(':').map(Number);
    const appointmentStart = new Date(date);
    appointmentStart.setUTCHours(requestHour, requestMinute, 0, 0);

    const appointmentEnd = new Date(appointmentStart);
    appointmentEnd.setUTCMinutes(appointmentEnd.getUTCMinutes() + duration);

    // Find staff members who are available at the requested time
    const availableStaff: AvailableStaffMember[] = [];

    for (const staff of allActiveStaff) {
      // Check if this staff member has any conflicting bookings
      const conflictingBookings = await this.bookingModel.findAll({
        where: {
          staffId: staff.id,
          appointmentDate: date,
          status: { [Op.not]: BookingStatus.CANCELLED },
          [Op.or]: [
            // Existing booking starts before our appointment ends AND ends after our appointment starts
            {
              startTime: { [Op.lt]: appointmentEnd },
              endTime: { [Op.gt]: appointmentStart }
            }
          ]
        }
      });

      if (conflictingBookings.length === 0) {
        // This staff member is available, now calculate their weekly workload
        const weeklyBookings = await this.bookingModel.findAll({
          where: {
            staffId: staff.id,
            appointmentDate: {
              [Op.between]: [startOfWeek.toISOString().split('T')[0], endOfWeek.toISOString().split('T')[0]]
            },
            status: { [Op.not]: BookingStatus.CANCELLED }
          },
          attributes: ['startTime', 'endTime']
        });

        // Calculate total workload in minutes
        let totalWorkloadMinutes = 0;
        for (const booking of weeklyBookings) {
          const start = new Date(booking.startTime);
          const end = new Date(booking.endTime);
          const bookingDuration = (end.getTime() - start.getTime()) / (1000 * 60); // Convert to minutes
          totalWorkloadMinutes += bookingDuration;
        }

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
    const startMinute = 30;
    const endHour = 21;
    const endMinute = 30;
    const intervalMinutes = 60; // 1 hour intervals

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
  @SkipCsrf()
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
  @SkipCsrf()
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
            [Op.in]: ['pending', 'confirmed']
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
  @SkipCsrf()
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
              totalAmount: { type: 'number' },
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
        totalAmount: number;
        notes?: string;
      }>;
    }
  ) {
    // Usar transacción para asegurar atomicidad
    const transaction = await this.sequelize.transaction();

    try {
      // Verificar disponibilidad antes de crear
      const verificationResult = await this.verifyMultiAvailability({
        date: body.bookings[0].appointmentDate,
        slots: body.bookings.map(b => ({
          serviceId: b.serviceId,
          staffId: b.staffId,
          startTime: b.startTime,
          endTime: b.endTime
        }))
      });

      if (!verificationResult.available) {
        throw new ConflictException({
          message: 'One or more time slots are no longer available',
          conflicts: verificationResult.conflicts
        });
      }

      // Crear todos los bookings
      const createdBookings: BookingEntity[] = [];

      for (const bookingData of body.bookings) {
        const booking = await this.bookingModel.create(
          {
            customerId: body.customerId,
            serviceId: bookingData.serviceId,
            staffId: bookingData.staffId,
            appointmentDate: bookingData.appointmentDate,
            startTime: new Date(bookingData.startTime),
            endTime: new Date(bookingData.endTime),
            totalAmount: bookingData.totalAmount,
            status: BookingStatus.PENDING,
            notes: bookingData.notes || ''
          } as any,
          { transaction }
        );

        createdBookings.push(booking);
      }

      // Commit de la transacción
      await transaction.commit();

      return {
        success: true,
        bookings: createdBookings
      };

    } catch (error) {
      // Rollback en caso de error
      await transaction.rollback();
      throw error;
    }
  }
}