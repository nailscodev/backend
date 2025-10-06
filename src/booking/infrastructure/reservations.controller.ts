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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { Op } from 'sequelize';
import { InjectModel } from '@nestjs/sequelize';
import { BookingEntity } from './persistence/entities/booking.entity';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { BookingStatus } from '../domain/value-objects/booking-status.vo';

@ApiTags('bookings')
@Controller('bookings')
export class ReservationsController {
  constructor(
    @InjectModel(BookingEntity)
    private bookingModel: typeof BookingEntity,
  ) {}

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
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      return await this.bookingModel.create(createBookingDto as any);
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
      throw new BadRequestException('Error confirming booking: ' + errorMessage);
    }
  }
}