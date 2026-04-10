import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Header,
  BadRequestException,
  HttpStatus,
  HttpCode,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { Op, QueryTypes } from 'sequelize';
import { InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { BookingEntity } from './persistence/entities/booking.entity';
import { BookingStatus } from '../domain/value-objects/booking-status.vo';
import { MultiServiceAvailabilityService } from '../application/services/multi-service-availability.service';
import { SkipCsrf } from '../../common/decorators/csrf.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { BookingConfig } from '../../common/config/booking.config';

@ApiTags('bookings')
@Controller('bookings')
export class AvailabilityController {
  private readonly logger = new Logger(AvailabilityController.name);

  constructor(
    @InjectModel(BookingEntity)
    private bookingModel: typeof BookingEntity,
    private sequelize: Sequelize,
    private multiServiceAvailabilityService: MultiServiceAvailabilityService,
  ) { }

  @Get('available-slots')
  @Header('Cache-Control', 'public, max-age=30, stale-while-revalidate=60')
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
          bookedSlotsByStaff.get(staff)?.add(slot.time);
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
      if (shifts.length === 0) return false; // no shifts defined = unavailable
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
        if (wd.includes(dayOfWeek) || wd.includes(dayAbbr)) return true;
        // Fallback: new-format staff may have empty workingDays[] but valid shifts object
        const sh = (staff as any).shifts;
        if (sh && typeof sh === 'object' && !Array.isArray(sh)) {
          const dayShifts = sh[dayOfWeek.toLowerCase()];
          return Array.isArray(dayShifts) && dayShifts.length > 0;
        }
        return false;
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

      // Generate time slots based on staff working hours (15-min intervals)
      const generateTimeSlots = () => {
        const slots: string[] = [];
        let currentHour = startHour;
        let currentMinute = startMinute;

        while (currentHour < latestStartHour || (currentHour === latestStartHour && currentMinute <= latestStartMin)) {
          slots.push(`${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}:00`);
          
          currentMinute += 15;
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

      // Filter out slots that have already passed when querying for today (Eastern / Miami time)
      const nowPartsEastern = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/New_York',
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', hour12: false,
      }).formatToParts(new Date());
      const nowPartsMap = Object.fromEntries(nowPartsEastern.map(p => [p.type, p.value]));
      const todayEastern = `${nowPartsMap.year}-${nowPartsMap.month}-${nowPartsMap.day}`;
      const nowMinutesEastern = parseInt(nowPartsMap.hour) * 60 + parseInt(nowPartsMap.minute);
      const timeSlots = date === todayEastern
        ? allTimeSlots.filter(slot => {
            const [h, m] = slot.split(':').map(Number);
            return h * 60 + m >= nowMinutesEastern;
          })
        : allTimeSlots;

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
      for (const startTime of timeSlots) {
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

  // ============================================================================
  // MULTI-SERVICE BOOKING ENDPOINTS
  // ============================================================================

  /**
   * 🔒 VERIFICACIÓN GLOBAL DE DISPONIBILIDAD CON PERMUTACIONES
   * Este endpoint usa el algoritmo central de disponibilidad que prueba todas
   * las permutaciones posibles del orden de servicios.
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

  private generateTimeSlots(): Array<{ time: string; available: boolean }> {
    const slots: Array<{ time: string; available: boolean }> = [];
    const startHour = 7;
    const startMinute = 0;
    const endHour = 21;
    const endMinute = 30;
    const intervalMinutes = 15; // 15 minute intervals

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
