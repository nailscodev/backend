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
import { Op, QueryTypes } from 'sequelize';
import { InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { BookingEntity } from './persistence/entities/booking.entity';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { BookingStatus } from '../domain/value-objects/booking-status.vo';

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
    private sequelize: Sequelize,
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

      // Extract time from timestamp - startTime and endTime are Date objects from Sequelize
      // Convert to local time since our database stores times in local timezone (-03)
      const startTimeObj = new Date(booking.startTime);
      const endTimeObj = new Date(booking.endTime);

      // Format as HH:MM using local time (not UTC)
      const startTime = startTimeObj.toTimeString().slice(0, 5);
      const endTime = endTimeObj.toTimeString().slice(0, 5);

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
      // Set default status to 'pending' if not provided
      const bookingData = {
        ...createBookingDto,
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
      const requestStartTime = new Date(createBookingDto.startTime);
      const requestEndTime = new Date(createBookingDto.endTime);

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
      throw new BadRequestException('Error confirming booking: ' + errorMessage);
    }
  }

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
}