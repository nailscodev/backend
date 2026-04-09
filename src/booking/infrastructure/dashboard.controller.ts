import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Query,
  Header,
  BadRequestException,
  HttpStatus,
  ParseIntPipe,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { QueryTypes } from 'sequelize';
import { InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { ManualAdjustment } from '../../common/entities/manual-adjustment.entity';
import { BookingConfig } from '../../common/config/booking.config';
import { RequireAuth } from '../../common/decorators/require-auth.decorator';
import { DashboardStatsDto } from './dto/dashboard-stats.dto';
import { BestSellingServiceDto } from './dto/best-selling-service.dto';
import { TopStaffDto } from './dto/top-staff.dto';
import { BookingsBySourceDto } from './dto/bookings-by-source.dto';

interface CountRow {
  count: string | number;
}

@ApiTags('bookings')
@Controller('bookings')
export class DashboardController {
  private readonly logger = new Logger(DashboardController.name);

  constructor(
    @InjectModel(ManualAdjustment)
    private manualAdjustmentModel: typeof ManualAdjustment,
    private sequelize: Sequelize,
  ) { }

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
        TO_CHAR(b."startTime", 'HH24:MI')                    AS "startTime",
        TO_CHAR(b."endTime", 'HH24:MI')                      AS "endTime",
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
      const message = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new BadRequestException(message);
    }
  }
}
