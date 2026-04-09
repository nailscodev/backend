import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { Sequelize } from 'sequelize-typescript';
import { QueryTypes } from 'sequelize';
import { AppCacheService } from '../../../shared/cache/cache.service';

// Interfaces
interface Addon {
  id: string;
  additionalTime: number;
  price?: number;
}

interface Service {
  id: string;
  name: string;
  duration: number;
  bufferTime: number;
  categoryId: string;
  parentCategoryId?: string | null; // For removal services: the category they prepare for
  price: number; // Price in cents
  addOns?: Addon[]; // Optional addons for this service
}

interface Staff {
  id: string;
  name: string;
  workingDays?: string[];
  shifts?: Array<{ shiftStart: string; shiftEnd: string }>;
}

interface Booking {
  staffId: string;
  startTime: Date;
  endTime: Date;
}

export interface StaffAssignment {
  serviceId: string;
  serviceName: string;
  staffId: string;
  staffName: string;
  startTime: string;
  endTime: string;
  duration: number;
}

export interface MultiServiceSlot {
  startTime: string;
  endTime: string;
  totalDuration: number;
  totalPrice: number;
  available: boolean; // Indicates if this slot has valid staff assignments
  services: StaffAssignment[];  // Renamed from assignments for clarity
  assignments: StaffAssignment[]; // Keep for backwards compatibility
}

@Injectable()
export class MultiServiceAvailabilityService {
  private readonly logger = new Logger(MultiServiceAvailabilityService.name);

  constructor(
    private sequelize: Sequelize,
    private cache: AppCacheService,
  ) { }

  /**
   * Encuentra slots disponibles para múltiples servicios consecutivos
   * Cada servicio puede ser realizado por un técnico diferente
   * Ahora soporta addons por servicio para cálculo correcto de duración
   */
  async findMultiServiceSlots(
    serviceIds: string[],
    date: string,
    selectedTechnicianId?: string,
    servicesWithAddons?: any[]
  ): Promise<MultiServiceSlot[]> {

    if (serviceIds.length > 4) {
      throw new BadRequestException('Maximum 4 services per slot request');
    }

    // Build a deterministic cache key covering all inputs that affect output
    const addonSig = (servicesWithAddons ?? [])
      .flatMap(s => (s.addOns ?? []).map((a: any) => a.id as string))
      .sort()
      .join(',');
    const cacheKey = `avail:multi:${date}:${[...serviceIds].sort().join(',')}:${selectedTechnicianId ?? 'any'}:${addonSig}`;
    const cached = this.cache.get<MultiServiceSlot[]>(cacheKey);
    if (cached) {
      this.logger.log(`🗃️ Cache HIT for multi-service slots (${cacheKey})`);
      return cached;
    }

    try {
      this.logger.log(`\n🔍 === FINDING MULTI-SERVICE SLOTS ===`);
      this.logger.log(`📅 Date: ${date}`);
      this.logger.log(`🎯 Service IDs: ${JSON.stringify(serviceIds)}`);
      this.logger.log(`👤 Selected Technician: ${selectedTechnicianId || 'None (any available)'}`);

      // 1. Obtener información de servicios
      const services = await this.getServices(serviceIds);
      
      // 1.1. Agregar información de addons a los servicios
      if (servicesWithAddons && servicesWithAddons.length > 0) {
        services.forEach(service => {
          const serviceWithAddon = servicesWithAddons.find(s => s.id === service.id);
          if (serviceWithAddon && serviceWithAddon.addOns) {
            // Map addon IDs to get price information from database
            service.addOns = serviceWithAddon.addOns.map((addon: any) => ({
              id: addon.id,
              additionalTime: addon.additionalTime,
              price: addon.price || 0
            }));
          }
        });
      }
      
      this.logger.log(`\n📦 Services Found: ${services.length}`);
      services.forEach(s => {
        const addonTime = (s.addOns || []).reduce((sum, addon) => sum + addon.additionalTime, 0);
        const baseTime = s.duration + s.bufferTime;
        this.logger.log(`   - ${s.name} (${s.duration}min + ${s.bufferTime}min buffer + ${addonTime}min addons = ${baseTime + addonTime}min total)`);
      });

      if (services.length === 0) {
        this.logger.warn('❌ No services found for provided IDs');
        return [];
      }

      // 2. Calcular duración total necesaria (incluyendo addons)
      const totalMinutes = services.reduce((sum, s) => {
        const addonTime = (s.addOns || []).reduce((addonSum, addon) => addonSum + addon.additionalTime, 0);
        return sum + s.duration + s.bufferTime + addonTime;
      }, 0);
      this.logger.log(`\n⏱️ Total Duration Needed: ${totalMinutes} minutes (including addons)`);

      // 3. Obtener staff disponible para cada servicio
      const staffByService = await this.getStaffForServices(serviceIds);

      this.logger.log(`\n👥 Staff Available by Service:`);
      staffByService.forEach((staff, serviceId) => {
        const serviceName = services.find(s => s.id === serviceId)?.name || serviceId;
        this.logger.log(`   - ${serviceName}: ${staff.length} staff members`);
        staff.forEach(s => this.logger.log(`     * ${s.name} (${s.id})`));
      });

      // Verificar que haya al menos un técnico por servicio
      for (const serviceId of serviceIds) {
        if (!staffByService.has(serviceId) || staffByService.get(serviceId)!.length === 0) {
          this.logger.warn(`❌ No staff available for service ${serviceId}`);
          return [];
        }
      }

      // 4. Obtener bookings existentes del día
      const existingBookings = await this.getBookingsForDate(date);
      this.logger.log(`\n📅 Existing Bookings: ${existingBookings.length}`);

      // 5. Generar y evaluar slots candidatos
      this.logger.log(`\n🔄 Generating and evaluating time slots...`);
      const availableSlots = this.findAvailableSlots(
        services,
        staffByService,
        existingBookings,
        date,
        totalMinutes,
        selectedTechnicianId
      );

      this.logger.log(`\n✅ RESULT: Found ${availableSlots.length} available multi-service slots`);
      if (availableSlots.length > 0) {
        this.logger.log(`   First slot: ${availableSlots[0].startTime}`);
      }

      // Cache for 60 s — short TTL so new bookings reflect quickly
      this.cache.set(cacheKey, availableSlots, 60);

      return availableSlots;

    } catch (error) {
      this.logger.error(`Error finding multi-service slots: ${error instanceof Error ? error.message : 'Unknown'}`, error instanceof Error ? error.stack : '');
      return [];
    }
  }

  // ============================================================================
  // MÉTODO PÚBLICO - VERIFICACIÓN DE DISPONIBILIDAD (REUTILIZABLE)
  // ============================================================================

  /**
   * 🔒 FUNCIÓN GLOBAL DE VERIFICACIÓN DE DISPONIBILIDAD
   * Usada por: slots generation, confirmación, y cualquier verificación de disponibilidad
   * 
   * Verifica si un slot específico está disponible para los servicios dados,
   * probando todas las permutaciones posibles del orden de servicios.
   * 
   * @returns Las asignaciones de staff si hay disponibilidad, null si no
   */
  async verifySlotAvailability(
    serviceIds: string[],
    date: string,
    startTime: string, // Format: "HH:mm" or "HH:mm:ss"
    selectedTechnicianId?: string,
    servicesWithAddons?: any[]
  ): Promise<{
    available: boolean;
    assignments: StaffAssignment[] | null;
    totalDuration: number;
    totalPrice: number;
    permutationUsed?: string[];
  }> {
    try {
      this.logger.log(`\n🔍 === VERIFY SLOT AVAILABILITY ===`);
      this.logger.log(`📅 Date: ${date}, Time: ${startTime}`);
      this.logger.log(`🎯 Services: ${serviceIds.length}`);
      this.logger.log(`👤 Selected Technician: ${selectedTechnicianId || 'Any'}`);

      // 1. Obtener información de servicios
      const services = await this.getServices(serviceIds);

      // 1.1. Agregar información de addons
      if (servicesWithAddons && servicesWithAddons.length > 0) {
        services.forEach(service => {
          const serviceWithAddon = servicesWithAddons.find(s => s.id === service.id);
          if (serviceWithAddon && serviceWithAddon.addOns) {
            service.addOns = serviceWithAddon.addOns.map((addon: any) => ({
              id: addon.id,
              additionalTime: addon.additionalTime,
              price: addon.price || 0
            }));
          }
        });
      }

      if (services.length === 0) {
        return { available: false, assignments: null, totalDuration: 0, totalPrice: 0 };
      }

      // 2. Calcular duración total
      const totalDuration = services.reduce((sum, s) => sum + this.getServiceTotalDuration(s), 0);

      // 3. Calcular precio total
      const totalPrice = services.reduce((sum, service) => {
        const servicePrice = service.price || 0;
        const addonsPrice = (service.addOns || []).reduce((addonSum, addon) => addonSum + (addon.price || 0), 0);
        return sum + servicePrice + addonsPrice;
      }, 0);

      // 4. Obtener staff por servicio
      const staffByService = await this.getStaffForServices(serviceIds);

      // Verificar que hay staff para todos los servicios
      for (const serviceId of serviceIds) {
        if (!staffByService.has(serviceId) || staffByService.get(serviceId)!.length === 0) {
          this.logger.warn(`❌ No staff for service ${serviceId}`);
          return { available: false, assignments: null, totalDuration, totalPrice };
        }
      }

      // 5. Obtener bookings existentes
      const existingBookings = await this.getBookingsForDate(date);

      // 6. Construir la hora de inicio
      const [hour, minute] = startTime.split(':').map(Number);
      const slotStart = new Date(`${date}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`);

      // 7. Intentar asignar staff con permutaciones
      const assignments = this.tryAssignStaffForSlot(
        services,
        staffByService,
        existingBookings,
        slotStart,
        selectedTechnicianId
      );

      if (assignments) {
        // Extraer el orden de servicios usado
        const permutationUsed = assignments.map(a => a.serviceName);
        
        this.logger.log(`✅ Slot available with permutation: ${permutationUsed.join(' → ')}`);
        return {
          available: true,
          assignments,
          totalDuration,
          totalPrice,
          permutationUsed
        };
      }

      this.logger.log(`❌ Slot NOT available for any permutation`);
      return { available: false, assignments: null, totalDuration, totalPrice };

    } catch (error) {
      this.logger.error(`Error verifying slot: ${error instanceof Error ? error.message : 'Unknown'}`);
      return { available: false, assignments: null, totalDuration: 0, totalPrice: 0 };
    }
  }

  // ============================================================================
  // MÉTODOS PRIVADOS - QUERIES A BASE DE DATOS
  // ============================================================================

  /**
   * Obtiene información completa de servicios y addons incluyendo parent_category_id
   * Los addons (como removals) usan additionalTime sin buffer
   */
  private async getServices(serviceIds: string[]): Promise<Service[]> {
    // Buscar primero en services
    const servicesResult = await this.sequelize.query<{
      id: string;
      name: string;
      duration: number;
      bufferTime: number;
      category_id: string;
      parent_category_id: string | null;
      price: number;
    }>(
      `SELECT s.id, s.name, s.duration, s."bufferTime", s.category_id, s.parent_category_id, s.price
       FROM services s
       WHERE s.id = ANY($1::uuid[]) AND s."isActive" = true`,
      {
        bind: [serviceIds],
        type: QueryTypes.SELECT,
      }
    );

    // Buscar addons (removals, nail art, etc.) que usan additionalTime sin buffer
    const addonsResult = await this.sequelize.query<{
      id: string;
      name: string;
      additionalTime: number;
      price: number;
    }>(
      `SELECT a.id, a.name, a."additionalTime", a.price
       FROM addons a
       WHERE a.id = ANY($1::uuid[]) AND a."isActive" = true`,
      {
        bind: [serviceIds],
        type: QueryTypes.SELECT,
      }
    );

    // Mapear servicios normales
    const services = servicesResult.map(s => ({
      id: s.id,
      name: s.name,
      duration: s.duration,
      bufferTime: s.bufferTime || 0,
      categoryId: s.category_id,
      parentCategoryId: s.parent_category_id,
      price: s.price || 0,
    }));

    // Mapear addons como servicios (sin buffer, duration = additionalTime)
    // Los addons incluyen: removals, nail art, fix nail, etc.
    const addonsAsServices = addonsResult.map(a => ({
      id: a.id,
      name: a.name,
      duration: a.additionalTime,
      bufferTime: 0, // Los addons no tienen buffer, solo additionalTime
      categoryId: '', // Los addons se asignan por sufijo en el nombre (- Mani, - Pedi)
      parentCategoryId: null, // Los addons no usan parent_category_id
      price: a.price || 0,
    }));

    // Combinar ambos y ordenar: removals primero, luego por duración
    const combined = [...addonsAsServices, ...services];

    return combined.sort((a, b) => {
      // Poner removals (por nombre) primero
      const aIsRemoval = a.name.toLowerCase().includes('removal');
      const bIsRemoval = b.name.toLowerCase().includes('removal');
      if (aIsRemoval && !bIsRemoval) return -1;
      if (!aIsRemoval && bIsRemoval) return 1;
      return a.duration - b.duration;
    });
  }

  /**
   * Obtiene staff disponible para cada servicio o addon
   */
  private async getStaffForServices(serviceIds: string[]): Promise<Map<string, Staff[]>> {
    const map = new Map<string, Staff[]>();
    if (serviceIds.length === 0) return map;

    // ── Pass 1: batch-fetch staff for all IDs via staff_services ─────────────
    const serviceStaffRows = await this.sequelize.query<{
      service_id: string;
      id: string;
      firstName: string;
      lastName: string;
      workingDays: string[];
      shifts: Array<{ shiftStart: string; shiftEnd: string }>;
    }>(
      `SELECT ss.service_id, s.id, s."firstName", s."lastName", s."workingDays", s.shifts
       FROM staff s
       INNER JOIN staff_services ss ON s.id = ss.staff_id
       WHERE ss.service_id = ANY($1::uuid[])
         AND s.status = 'ACTIVE'
         AND s."isBookable" = true`,
      { bind: [serviceIds], type: QueryTypes.SELECT },
    );

    for (const row of serviceStaffRows) {
      const existing = map.get(row.service_id) ?? [];
      existing.push({
        id: row.id,
        name: `${row.firstName} ${row.lastName}`,
        workingDays: row.workingDays,
        shifts: row.shifts,
      });
      map.set(row.service_id, existing);
    }

    // ── Pass 2: resolve IDs with no staff — they may be addon IDs ────────────
    const missingIds = serviceIds.filter(id => !map.has(id));
    if (missingIds.length === 0) return map;

    const addonRows = await this.sequelize.query<{ id: string; name: string }>(
      `SELECT id, name FROM addons WHERE id = ANY($1::uuid[])`,
      { bind: [missingIds], type: QueryTypes.SELECT },
    );

    const maniAddonIds: string[] = [];
    const pediAddonIds: string[] = [];
    const addonIdSet = new Set<string>();

    for (const addon of addonRows) {
      addonIdSet.add(addon.id);
      const lower = addon.name.toLowerCase();
      if (lower.includes('- mani') || lower.includes('mani')) {
        maniAddonIds.push(addon.id);
      } else if (lower.includes('- pedi') || lower.includes('pedi')) {
        pediAddonIds.push(addon.id);
      } else {
        map.set(addon.id, []);
      }
    }
    // IDs not found in addons table either
    for (const id of missingIds) {
      if (!addonIdSet.has(id)) map.set(id, []);
    }

    // ── Pass 3: batch-fetch staff by category (mani / pedi) in parallel ──────
    const fetchByCategory = async (category: string, addonIds: string[]): Promise<void> => {
      if (addonIds.length === 0) return;
      const rows = await this.sequelize.query<{
        id: string;
        firstName: string;
        lastName: string;
        workingDays: string[];
        shifts: Array<{ shiftStart: string; shiftEnd: string }>;
      }>(
        `SELECT DISTINCT s.id, s."firstName", s."lastName", s."workingDays", s.shifts
         FROM staff s
         INNER JOIN staff_services ss ON s.id = ss.staff_id
         INNER JOIN services srv ON ss.service_id = srv.id
         INNER JOIN categories c ON srv.category_id = c.id
         WHERE c.name = $1
           AND s.status = 'ACTIVE'
           AND s."isBookable" = true`,
        { bind: [category], type: QueryTypes.SELECT },
      );
      const staffList = rows.map(s => ({
        id: s.id,
        name: `${s.firstName} ${s.lastName}`,
        workingDays: s.workingDays,
        shifts: s.shifts,
      }));
      for (const id of addonIds) map.set(id, staffList);
    };

    await Promise.all([
      fetchByCategory('Manicure', maniAddonIds),
      fetchByCategory('Pedicure', pediAddonIds),
    ]);

    return map;
  }

  /**
   * Obtiene todos los bookings del día
   * Los tiempos se almacenan como TIME en PostgreSQL (formato "HH:MM:SS")
   * y se procesan directamente sin conversiones de timezone
   */
  private async getBookingsForDate(date: string): Promise<Booking[]> {
    const result = await this.sequelize.query<{
      staffId: string;
      startTime: string;
      endTime: string;
    }>(
      `SELECT "staffId", "startTime"::text, "endTime"::text
       FROM bookings
       WHERE "appointmentDate" = $1
         AND status IN ('pending', 'in_progress')`,
      {
        bind: [date],
        type: QueryTypes.SELECT,
      }
    );

    this.logger.log(`\n📋 Raw bookings from DB for ${date}: ${result.length}`);
    result.forEach(r => {
      this.logger.log(`   RAW: "${r.startTime}" - "${r.endTime}" (Staff: ${r.staffId.substring(0, 8)}...)`);
    });

    // Parse times - formato simple "HH:MM:SS" o "HH:MM" de PostgreSQL TIME
    const bookings = result.map(b => {
      const parseTimeToDate = (timeStr: string): Date => {
        // Formato esperado: "HH:MM:SS" o "HH:MM"
        const parts = timeStr.split(':');
        const hours = parseInt(parts[0], 10);
        const minutes = parseInt(parts[1], 10);
        
        // Crear fecha con la hora local (sin conversión UTC)
        const dateObj = new Date(`${date}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`);
        return dateObj;
      };
      
      return {
        staffId: b.staffId,
        startTime: parseTimeToDate(b.startTime),
        endTime: parseTimeToDate(b.endTime),
      };
    });

    // Log parsed bookings
    if (bookings.length > 0) {
      this.logger.log(`\n📋 Parsed bookings for ${date}:`);
      bookings.forEach(b => {
        const startStr = `${String(b.startTime.getHours()).padStart(2, '0')}:${String(b.startTime.getMinutes()).padStart(2, '0')}`;
        const endStr = `${String(b.endTime.getHours()).padStart(2, '0')}:${String(b.endTime.getMinutes()).padStart(2, '0')}`;
        this.logger.log(`   ⏰ Staff ${b.staffId.substring(0, 8)}...: ${startStr}-${endStr}`);
      });
    } else {
      this.logger.log(`\n📋 No existing bookings for ${date}`);
    }

    return bookings;
  }  // ============================================================================
  // MÉTODOS PRIVADOS - LÓGICA DE NEGOCIO
  // ============================================================================

  /**
   * Gets the day abbreviation (Mon, Tue, ...) from a date string (YYYY-MM-DD)
   */
  private getDayAbbreviation(date: string): string {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dateObj = new Date(date + 'T12:00:00'); // noon to avoid timezone issues
    return dayNames[dateObj.getDay()];
  }

  /**
   * Checks if a staff member works on a given day
   */
  private isStaffWorkingOnDay(staff: Staff, date: string): boolean {
    if (!staff.workingDays || staff.workingDays.length === 0) return true; // no restriction
    const dayAbbr = this.getDayAbbreviation(date);
    return staff.workingDays.includes(dayAbbr);
  }

  /**
   * Normalizes raw staff shifts (weekly JSONB object OR legacy flat array) to a flat array
   * of shifts for the specific day of the given Date.
   *
   * Weekly format (DB default): { monday: [{shiftStart, shiftEnd}], tuesday: [], ... }
   * Legacy flat format:          [{shiftStart, shiftEnd}, ...]
   */
  private normalizeShiftsForDay(
    rawShifts: any,
    date: Date,
  ): Array<{ shiftStart: string; shiftEnd: string }> {
    if (!rawShifts) return [];

    // Weekly JSONB object format (current DB format)
    if (typeof rawShifts === 'object' && !Array.isArray(rawShifts)) {
      const dayName = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      const dayShifts = rawShifts[dayName];
      return Array.isArray(dayShifts) ? dayShifts : [];
    }

    // Legacy flat array format
    if (Array.isArray(rawShifts)) {
      return rawShifts.filter(
        (s: any) => s && typeof s === 'object' && s.shiftStart && s.shiftEnd,
      );
    }

    return [];
  }

  /**
   * Checks if a time range (in minutes of day) falls entirely within a staff member's shifts.
   * Returns true if the ENTIRE range [startMin, endMin] is covered by at least one shift.
   *
   * Accepts either the weekly JSONB object or the legacy flat array; pass `date` so the
   * correct day's shifts can be extracted from a weekly object.
   */
  private isWithinShifts(
    shifts: any,
    startMin: number,
    endMin: number,
    date?: Date,
  ): boolean {
    const shiftsArray: Array<{ shiftStart: string; shiftEnd: string }> = date
      ? this.normalizeShiftsForDay(shifts, date)
      : Array.isArray(shifts)
        ? shifts
        : [];

    if (!shiftsArray || shiftsArray.length === 0) {
      this.logger.warn('Staff has no shifts defined for this day — treating as unavailable');
      return false;
    }

    const parseTime = (t: string): number => {
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m;
    };

    // The entire slot must fit within a single shift
    return shiftsArray.some(shift => {
      const shiftStartMin = parseTime(shift.shiftStart);
      const shiftEndMin = parseTime(shift.shiftEnd);
      return startMin >= shiftStartMin && endMin <= shiftEndMin;
    });
  }

  /**
   * Filters a staff-by-service map to only include staff working on the given date
   */
  private filterStaffByWorkingDay(staffByService: Map<string, Staff[]>, date: string): Map<string, Staff[]> {
    const filtered = new Map<string, Staff[]>();
    staffByService.forEach((staffList, serviceId) => {
      filtered.set(serviceId, staffList.filter(s => this.isStaffWorkingOnDay(s, date)));
    });
    return filtered;
  }

  /**
   * Genera slots de tiempo base (business hours: 07:00 - 21:30, intervalos 15 min)
   */
  private generateTimeSlots(): Array<{ time: string }> {
    const slots: Array<{ time: string }> = [];
    const startHour = 7;
    const startMinute = 0;
    const endHour = 21;
    const endMinute = 30;
    const intervalMinutes = 15; // Slots cada 15 minutos

    const currentTime = new Date();
    currentTime.setHours(startHour, startMinute, 0, 0);

    const endTime = new Date();
    endTime.setHours(endHour, endMinute, 0, 0);

    while (currentTime <= endTime) {
      const timeString = currentTime.toTimeString().substring(0, 5);
      slots.push({ time: timeString });
      currentTime.setMinutes(currentTime.getMinutes() + intervalMinutes);
    }

    return slots;
  }

  /**
   * Encuentra slots disponibles para múltiples servicios consecutivos
   * Usa un enfoque similar a getAvailableTimeSlots pero para múltiples servicios
   */
  private findAvailableSlots(
    services: Service[],
    staffByService: Map<string, Staff[]>,
    bookings: Booking[],
    date: string,
    totalMinutes: number,
    selectedTechnicianId?: string
  ): MultiServiceSlot[] {

    const slots: MultiServiceSlot[] = [];
    const allTimeSlots = this.generateTimeSlots();

    // Filter staff by working day
    const filteredStaffByService = this.filterStaffByWorkingDay(staffByService, date);

    this.logger.log(`   Checking ${allTimeSlots.length} possible time slots...`);
    let slotsChecked = 0;
    let slotsTooLate = 0;
    let slotsNoStaff = 0;

    // Para cada slot, intentar construir la secuencia completa de servicios
    for (const slot of allTimeSlots) {
      slotsChecked++;
      const [hour, minute] = slot.time.split(':').map(Number);
      const slotStart = new Date(`${date}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`);
      const slotEnd = new Date(slotStart.getTime() + totalMinutes * 60000);

      // Verificar que termine antes del cierre (21:30)
      const endHour = slotEnd.getHours();
      const endMinute = slotEnd.getMinutes();
      const endTimeInMinutes = endHour * 60 + endMinute;
      const businessEndMinutes = 21 * 60 + 30; // 21:30

      if (endTimeInMinutes > businessEndMinutes) {
        slotsTooLate++;
        continue; // Este slot terminaría después del horario de cierre
      }

      // Intentar asignar staff para este slot
      let assignments = this.tryAssignStaffForSlot(
        services,
        filteredStaffByService,
        bookings,
        slotStart,
        selectedTechnicianId
      );

      if (!assignments) {
        slotsNoStaff++;
      }

      // 🔒 IMPORTANT: If a specific technician was selected, they MUST be assigned to at least one service
      // If the selected technician is not in any assignment, reject this slot
      if (assignments && selectedTechnicianId) {
        const selectedTechnicianAssigned = assignments.some(a => a.staffId === selectedTechnicianId);
        if (!selectedTechnicianAssigned) {
          const slotTimeStr = `${String(slotStart.getHours()).padStart(2, '0')}:${String(slotStart.getMinutes()).padStart(2, '0')}`;
          this.logger.log(`   ❌ [${slotTimeStr}] Rejected: Selected technician not available for any service they can do`);
          slotsNoStaff++;
          assignments = null; // Mark as invalid
        }
      }

      if (assignments) {
        // Formatear en hora local para consistencia
        const formatLocalTime = (date: Date): string => {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          const hours = String(date.getHours()).padStart(2, '0');
          const minutes = String(date.getMinutes()).padStart(2, '0');
          const seconds = String(date.getSeconds()).padStart(2, '0');
          return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
        };

        // Calculate total price: sum of all service prices + their addon prices
        const totalPrice = services.reduce((sum, service) => {
          const servicePrice = service.price || 0;
          const addonsPrice = (service.addOns || []).reduce((addonSum, addon) => addonSum + (addon.price || 0), 0);
          return sum + servicePrice + addonsPrice;
        }, 0);

        slots.push({
          startTime: formatLocalTime(slotStart),
          endTime: formatLocalTime(slotEnd),
          totalDuration: totalMinutes,
          totalPrice: totalPrice,
          available: true, // Slot is available since it has valid staff assignments
          services: assignments,
          assignments,
        });
      }
    }

    this.logger.log(`\n📊 Slot Analysis:`);
    this.logger.log(`   Total checked: ${slotsChecked}`);
    this.logger.log(`   Too late (past business hours): ${slotsTooLate}`);
    this.logger.log(`   No staff available: ${slotsNoStaff}`);
    this.logger.log(`   Available slots found: ${slots.length}`);

    return slots;
  }

  /**
   * Intenta asignar técnicos para un slot específico
   * ALGORITMO DE PERMUTACIONES: Prueba todas las combinaciones de orden de servicios
   * para encontrar una configuración válida donde el técnico seleccionado participe
   */
  private tryAssignStaffForSlot(
    services: Service[],
    staffByService: Map<string, Staff[]>,
    bookings: Booking[],
    startTime: Date,
    selectedTechnicianId?: string
  ): StaffAssignment[] | null {

    const slotTimeStr = `${String(startTime.getHours()).padStart(2, '0')}:${String(startTime.getMinutes()).padStart(2, '0')}`;
    const isDebugSlot = ['10:30', '11:30', '12:30', '13:30', '14:30', '15:30', '16:30', '17:30', '18:30'].includes(slotTimeStr);

    if (isDebugSlot) {
      this.logger.log(`\n🔍 [DEBUG ${slotTimeStr}] Evaluando slot con permutaciones...`);
    }

    // Generar TODAS las permutaciones válidas de servicios (respetando grupos removal+servicio)
    const servicePermutations = this.generateAllValidPermutations(services);

    if (isDebugSlot) {
      this.logger.log(`   📋 Permutaciones a probar: ${servicePermutations.length}`);
      servicePermutations.forEach((perm, idx) => {
        this.logger.log(`      ${idx + 1}. ${perm.map(s => s.name.substring(0, 20)).join(' → ')}`);
      });
    }

    // Si hay un técnico seleccionado, primero probar permutaciones donde pueda participar
    if (selectedTechnicianId) {
      // Identificar servicios que el técnico seleccionado puede hacer
      const servicesSelectedCanDo = services.filter(s => {
        const staff = staffByService.get(s.id) || [];
        return staff.some(st => st.id === selectedTechnicianId);
      });

      if (isDebugSlot && servicesSelectedCanDo.length > 0) {
        this.logger.log(`   👤 Técnico seleccionado puede hacer: ${servicesSelectedCanDo.map(s => s.name).join(', ')}`);
      }

      // Ordenar permutaciones: priorizar las que ponen servicios del técnico seleccionado
      // en momentos donde podría estar disponible
      const prioritizedPermutations = this.prioritizePermutationsForTechnician(
        servicePermutations,
        servicesSelectedCanDo,
        bookings,
        startTime,
        selectedTechnicianId,
        isDebugSlot ? slotTimeStr : undefined
      );

      for (const orderedServices of prioritizedPermutations) {
        const result = this.tryAssignStaffInOrder(
          orderedServices,
          staffByService,
          bookings,
          startTime,
          selectedTechnicianId,
          isDebugSlot ? slotTimeStr : undefined
        );

        if (result) {
          // Verificar que el técnico seleccionado esté asignado a al menos un servicio
          const selectedIsAssigned = result.some(a => a.staffId === selectedTechnicianId);
          if (selectedIsAssigned) {
            if (isDebugSlot) {
              this.logger.log(`   ✅ Permutación exitosa CON técnico seleccionado`);
            }
            return result;
          } else if (isDebugSlot) {
            this.logger.log(`   ⚠️ Permutación válida pero SIN técnico seleccionado, intentando otra...`);
          }
        }
      }

      // Si ninguna permutación incluye al técnico seleccionado, retornar null
      if (isDebugSlot) {
        this.logger.log(`   ❌ Ninguna permutación permite al técnico seleccionado participar`);
      }
      return null;
    }

    // Sin técnico seleccionado: probar todas las permutaciones y retornar la primera válida
    for (const orderedServices of servicePermutations) {
      const result = this.tryAssignStaffInOrder(
        orderedServices,
        staffByService,
        bookings,
        startTime,
        selectedTechnicianId,
        isDebugSlot ? slotTimeStr : undefined
      );

      if (result) {
        return result;
      }
    }

    return null;
  }

  /**
   * Genera TODAS las permutaciones válidas de servicios
   * Regla: Los removals deben ir ANTES del servicio principal de su categoría
   */
  private generateAllValidPermutations(services: Service[]): Service[][] {
    // Agrupar servicios por categoría (mani/pedi) incluyendo sus removals
    interface ServiceBlock {
      category: 'mani' | 'pedi' | 'other';
      removal?: Service;
      mainService: Service;
    }

    const blocks: ServiceBlock[] = [];
    const processedIds = new Set<string>();

    // Identificar removals y sus servicios principales
    const removals = services.filter(s => s.name.toLowerCase().includes('removal'));
    const mainServices = services.filter(s => !s.name.toLowerCase().includes('removal'));

    for (const mainService of mainServices) {
      const name = mainService.name.toLowerCase();
      let category: 'mani' | 'pedi' | 'other' = 'other';
      
      if (name.includes('mani')) category = 'mani';
      else if (name.includes('pedi')) category = 'pedi';

      // Buscar removal correspondiente
      const correspondingRemoval = removals.find(r => {
        const rName = r.name.toLowerCase();
        if (category === 'mani' && rName.includes('mani')) return true;
        if (category === 'pedi' && rName.includes('pedi')) return true;
        return false;
      });

      if (correspondingRemoval && !processedIds.has(correspondingRemoval.id)) {
        processedIds.add(correspondingRemoval.id);
      }

      blocks.push({
        category,
        removal: correspondingRemoval,
        mainService,
      });
    }

    // Generar permutaciones de los bloques
    const blockPermutations = this.generatePermutations(blocks);

    // Convertir bloques a secuencias de servicios
    const result: Service[][] = [];
    for (const blockOrder of blockPermutations) {
      const sequence: Service[] = [];
      for (const block of blockOrder) {
        if (block.removal) {
          sequence.push(block.removal);
        }
        sequence.push(block.mainService);
      }
      result.push(sequence);
    }

    return result.length > 0 ? result : [services];
  }

  /**
   * Genera todas las permutaciones de un array
   */
  private generatePermutations<T>(arr: T[]): T[][] {
    if (arr.length <= 1) return [arr];
    
    const result: T[][] = [];
    
    for (let i = 0; i < arr.length; i++) {
      const current = arr[i];
      const remaining = [...arr.slice(0, i), ...arr.slice(i + 1)];
      const remainingPerms = this.generatePermutations(remaining);
      
      for (const perm of remainingPerms) {
        result.push([current, ...perm]);
      }
    }
    
    return result;
  }

  /**
   * Prioriza permutaciones basándose en la disponibilidad del técnico seleccionado
   * Pone primero las permutaciones donde los servicios del técnico están en momentos donde está libre
   */
  private prioritizePermutationsForTechnician(
    permutations: Service[][],
    servicesSelectedCanDo: Service[],
    bookings: Booking[],
    startTime: Date,
    selectedTechnicianId: string,
    debugSlot?: string
  ): Service[][] {
    if (servicesSelectedCanDo.length === 0) {
      return permutations;
    }

    // Obtener horarios ocupados del técnico seleccionado
    const selectedTechBookings = bookings.filter(b => b.staffId === selectedTechnicianId);

    // Calcular para cada permutación: ¿el técnico seleccionado estará libre cuando toque su servicio?
    const scored = permutations.map(perm => {
      let currentStart = new Date(startTime);
      let score = 0;

      for (const service of perm) {
        const duration = this.getServiceTotalDuration(service);
        const currentEnd = new Date(currentStart.getTime() + duration * 60000);

        // Si este servicio es uno que el técnico puede hacer, verificar disponibilidad
        if (servicesSelectedCanDo.some(s => s.id === service.id)) {
          const isFree = !this.hasConflict(selectedTechBookings, currentStart, currentEnd);
          if (isFree) {
            score += 100; // Alta prioridad si puede hacerlo
          }
        }

        currentStart = currentEnd;
      }

      return { perm, score };
    });

    // Ordenar por score descendente
    scored.sort((a, b) => b.score - a.score);

    if (debugSlot) {
      this.logger.log(`   🎯 Permutaciones priorizadas:`);
      scored.slice(0, 3).forEach((s, idx) => {
        this.logger.log(`      ${idx + 1}. Score ${s.score}: ${s.perm.map(sv => sv.name.substring(0, 15)).join(' → ')}`);
      });
    }

    return scored.map(s => s.perm);
  }

  /**
   * Calcula la duración total de un servicio incluyendo addons
   */
  private getServiceTotalDuration(service: Service): number {
    const addonTime = (service.addOns || []).reduce((sum, addon) => {
      const time = addon.additionalTime || 0;
      return sum + time;
    }, 0);
    const total = service.duration + (service.bufferTime || 0) + addonTime;
    this.logger.debug(`   📊 ${service.name}: base=${service.duration} + buffer=${service.bufferTime || 0} + addons=${addonTime} = ${total}min`);
    return total;
  }

  /**
   * Verifica si hay conflicto con bookings existentes
   */
  private hasConflict(bookings: Booking[], start: Date, end: Date): boolean {
    const getMinutesOfDay = (date: Date): number => date.getHours() * 60 + date.getMinutes();
    const startMin = getMinutesOfDay(start);
    const endMin = getMinutesOfDay(end);

    return bookings.some(booking => {
      const bookingStartMin = getMinutesOfDay(booking.startTime);
      const bookingEndMin = getMinutesOfDay(booking.endTime);
      return startMin < bookingEndMin && endMin > bookingStartMin;
    });
  }

  /**
   * Intenta asignar staff para los servicios en un orden específico
   * INCLUYE addons en la duración de cada servicio
   */
  private tryAssignStaffInOrder(
    services: Service[],
    staffByService: Map<string, Staff[]>,
    bookings: Booking[],
    startTime: Date,
    selectedTechnicianId?: string,
    debugSlot?: string
  ): StaffAssignment[] | null {

    const assignments: StaffAssignment[] = [];
    let currentStart = startTime;

    // Map para rastrear qué técnico hace cada categoría (para reutilizar en removals)
    const technicianByCategory = new Map<string, Staff>();

    for (let i = 0; i < services.length; i++) {
      const service = services[i];
      // IMPORTANTE: Incluir tiempo de addons en la duración
      const duration = this.getServiceTotalDuration(service);
      const currentEnd = new Date(currentStart.getTime() + duration * 60000);

      if (debugSlot) {
        const startStr = `${String(currentStart.getHours()).padStart(2, '0')}:${String(currentStart.getMinutes()).padStart(2, '0')}`;
        const endStr = `${String(currentEnd.getHours()).padStart(2, '0')}:${String(currentEnd.getMinutes()).padStart(2, '0')}`;
        const addonTime = (service.addOns || []).reduce((sum, a) => sum + a.additionalTime, 0);
        this.logger.log(`  Servicio ${i + 1}: ${service.name} (${startStr}-${endStr}, ${duration}min = ${service.duration}+${service.bufferTime}buf+${addonTime}addons)`);
      }

      // Obtener lista de técnicos que pueden hacer este servicio
      const candidateStaff = staffByService.get(service.id) || [];

      if (candidateStaff.length === 0) {
        if (debugSlot) this.logger.log(`  ❌ No hay técnicos candidatos`);
        return null;
      }

      if (debugSlot) {
        this.logger.log(`  Candidatos: ${candidateStaff.map(s => s.name).join(', ')}`);
      }

      let assigned: Staff | null = null;

      // Verificar si es un removal por nombre (addons o servicios)
      const isRemoval = service.name.toLowerCase().includes('removal');

      // Si este servicio es un REMOVAL
      if (isRemoval) {
        // Determinar el tipo (mani o pedi) para encontrar el servicio principal
        const isMani = service.name.toLowerCase().includes('mani');
        const isPedi = service.name.toLowerCase().includes('pedi');

        // Buscar el servicio principal correspondiente
        const mainService = services.find(s => {
          const sName = s.name.toLowerCase();
          if (!sName.includes('removal')) {
            if (isMani && sName.includes('mani')) return true;
            if (isPedi && sName.includes('pedi')) return true;
          }
          return false;
        });

        if (mainService) {
          const mainServiceStaff = staffByService.get(mainService.id) || [];

          // Intersección: técnicos que pueden hacer tanto removal como servicio principal
          const sharedStaff = candidateStaff.filter(cs =>
            mainServiceStaff.some(ms => ms.id === cs.id)
          );

          if (sharedStaff.length === 0) {
            if (debugSlot) this.logger.log(`  ❌ No hay técnicos que puedan hacer removal + servicio principal`);
            return null;
          }

          // Para cualquier removal, considerar técnico seleccionado si puede hacerlo
          let staffToConsider = sharedStaff;
          if (selectedTechnicianId) {
            const selectedStaff = sharedStaff.find(s => s.id === selectedTechnicianId);
            if (selectedStaff) {
              staffToConsider = [selectedStaff];
            }
          }

          const alreadyAssignedIds = assignments.map(a => a.staffId);
          assigned = this.findAvailableStaffWithMinWorkload(
            staffToConsider,
            bookings,
            currentStart,
            currentEnd,
            debugSlot,
            alreadyAssignedIds,
            selectedTechnicianId
          );

          if (!assigned) {
            if (debugSlot) this.logger.log(`  ❌ No se encontró técnico disponible para removal`);
            return null;
          }

          if (debugSlot) this.logger.log(`  ✅ Asignado removal: ${assigned.name}`);

          // Guardar este técnico para reutilizar en el servicio principal
          const mainServiceKey = `${isMani ? 'mani' : 'pedi'}`;
          technicianByCategory.set(mainServiceKey, assigned);
        } else {
          // No hay servicio principal, asignar normalmente
          const alreadyAssignedIds = assignments.map(a => a.staffId);
          assigned = this.findAvailableStaffWithMinWorkload(
            candidateStaff,
            bookings,
            currentStart,
            currentEnd,
            debugSlot,
            alreadyAssignedIds,
            selectedTechnicianId
          );
        }
      }
      // Si el servicio tiene un removal previo asignado, usar el mismo técnico
      else if (technicianByCategory.has('mani') && service.name.toLowerCase().includes('mani')) {
        assigned = technicianByCategory.get('mani')!;

        // Verificar disponibilidad
        const isAvailable = !bookings.some(booking => {
          if (booking.staffId !== assigned!.id) return false;
          const getMinutesOfDay = (date: Date): number => date.getHours() * 60 + date.getMinutes();
          const slotStartMin = getMinutesOfDay(currentStart);
          const slotEndMin = getMinutesOfDay(currentEnd);
          const bookingStartMin = getMinutesOfDay(booking.startTime);
          const bookingEndMin = getMinutesOfDay(booking.endTime);
          return slotStartMin < bookingEndMin && slotEndMin > bookingStartMin;
        });

        if (!isAvailable) {
          if (debugSlot) this.logger.log(`  ❌ Técnico del removal no disponible para manicure`);
          return null;
        }

        if (debugSlot) this.logger.log(`  ✅ Reutilizando técnico del removal: ${assigned.name}`);
      }
      else if (technicianByCategory.has('pedi') && service.name.toLowerCase().includes('pedi')) {
        assigned = technicianByCategory.get('pedi')!;

        // Verificar disponibilidad
        const isAvailable = !bookings.some(booking => {
          if (booking.staffId !== assigned!.id) return false;
          const getMinutesOfDay = (date: Date): number => date.getHours() * 60 + date.getMinutes();
          const slotStartMin = getMinutesOfDay(currentStart);
          const slotEndMin = getMinutesOfDay(currentEnd);
          const bookingStartMin = getMinutesOfDay(booking.startTime);
          const bookingEndMin = getMinutesOfDay(booking.endTime);
          return slotStartMin < bookingEndMin && slotEndMin > bookingStartMin;
        });

        if (!isAvailable) {
          if (debugSlot) this.logger.log(`  ❌ Técnico del removal no disponible para pedicure`);
          return null;
        }

        if (debugSlot) this.logger.log(`  ✅ Reutilizando técnico del removal: ${assigned.name}`);
      }
      // Servicio normal (no es removal y no tiene removal previo)
      else {
        // Get already assigned staff IDs to prefer different technicians
        const alreadyAssignedIds = assignments.map(a => a.staffId);

        let staffToConsider = candidateStaff;
        const isSingleService = services.length === 1;

        if (isSingleService && selectedTechnicianId) {
          // Single service: Force use of selected technician if they can do it
          const selectedStaff = candidateStaff.find(s => s.id === selectedTechnicianId);
          if (selectedStaff) {
            staffToConsider = [selectedStaff];
            if (debugSlot) this.logger.log(`   Single service: Using selected technician ${selectedStaff.name}`);
          }
        } else if (!isSingleService && selectedTechnicianId) {
          // Multi-service: Try to use selected technician for services they CAN do
          const selectedStaff = candidateStaff.find(s => s.id === selectedTechnicianId);

          if (selectedStaff) {
            // Selected technician CAN do this service
            // First check if they are available at this time
            const isSelectedAvailable = !bookings.some(booking => {
              if (booking.staffId !== selectedStaff.id) return false;
              const getMinutesOfDay = (date: Date): number => date.getHours() * 60 + date.getMinutes();
              const slotStartMin = getMinutesOfDay(currentStart);
              const slotEndMin = getMinutesOfDay(currentEnd);
              const bookingStartMin = getMinutesOfDay(booking.startTime);
              const bookingEndMin = getMinutesOfDay(booking.endTime);
              return slotStartMin < bookingEndMin && slotEndMin > bookingStartMin;
            });

            if (isSelectedAvailable) {
              // Also verify the selected technician's shift covers this sub-slot
              const smStart = currentStart.getHours() * 60 + currentStart.getMinutes();
              const smEnd   = currentEnd.getHours()   * 60 + currentEnd.getMinutes();
              if (this.isWithinShifts(selectedStaff.shifts, smStart, smEnd, currentStart)) {
                // Selected technician IS available AND within shift → Use them directly
                assigned = selectedStaff;
                if (debugSlot) this.logger.log(`   Multi-service: ✅ Using selected technician ${selectedStaff.name} (available & within shift)`);
              } else {
                // Available but outside shift → fall back to workload-based selection
                if (debugSlot) this.logger.log(`   Multi-service: ⚠️ Selected technician ${selectedStaff.name} is outside shift hours, using alternative`);
                staffToConsider = candidateStaff.filter(s => s.id !== selectedStaff.id);
              }
            } else {
              // Selected technician is BUSY → Use workload-based selection
              if (debugSlot) this.logger.log(`   Multi-service: ⚠️ Selected technician ${selectedStaff.name} is busy, using alternative`);
              staffToConsider = candidateStaff.filter(s => s.id !== selectedStaff.id);
            }
          } else {
            // Selected technician CANNOT do this service → Use workload-based selection
            if (debugSlot) {
              this.logger.log(`   Multi-service: Selected technician cannot do this service, using best available`);
            }
          }
        }
        // For multi-service without selectedTechnicianId, staffToConsider = candidateStaff (all available)

        // Only call findAvailableStaffWithMinWorkload if not already assigned
        if (!assigned) {
          assigned = this.findAvailableStaffWithMinWorkload(
            staffToConsider,
            bookings,
            currentStart,
            currentEnd,
            debugSlot,
            alreadyAssignedIds,
            selectedTechnicianId
          );
        }

        if (!assigned) {
          if (debugSlot) this.logger.log(`  ❌ No se encontró técnico disponible`);
          return null;
        }

        if (debugSlot) this.logger.log(`  ✅ Asignado: ${assigned.name}`);

        // Guardar este técnico por su categoría (para posibles removals)
        technicianByCategory.set(service.categoryId, assigned);
      }

      if (!assigned) {
        if (debugSlot) this.logger.log(`  ❌ No hay técnico asignado final`);
        return null;
      }

      // Formatear en hora local (no UTC) para evitar problemas de zona horaria
      const formatLocalTime = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
      };

      assignments.push({
        serviceId: service.id,
        serviceName: service.name,
        staffId: assigned.id,
        staffName: assigned.name,
        startTime: formatLocalTime(currentStart),
        endTime: formatLocalTime(currentEnd),
        duration,
      });

      currentStart = currentEnd;
    }

    return assignments;
  }

  /**
   * NUEVO: Encuentra técnico disponible con menor carga de trabajo
   * Prefiere técnicos que NO estén ya asignados en este slot multi-servicio
   * EXCEPCIÓN: Si el técnico es el seleccionado por el cliente, NO se penaliza
   */
  private findAvailableStaffWithMinWorkload(
    candidates: Staff[],
    bookings: Booking[],
    start: Date,
    end: Date,
    debugSlot?: string,
    alreadyAssignedIds: string[] = [],
    selectedTechnicianId?: string
  ): Staff | null {

    if (candidates.length === 0) {
      return null;
    }

    let bestStaff: Staff | null = null;
    let minWorkload = Infinity;

    for (const staff of candidates) {
      const conflicts: string[] = [];

      const hasConflict = bookings.some(booking => {
        if (booking.staffId !== staff.id) return false;

        // Convertir a minutos del día para comparación precisa (ignora zona horaria)
        const getMinutesOfDay = (date: Date): number => {
          return date.getHours() * 60 + date.getMinutes();
        };

        const slotStartMin = getMinutesOfDay(start);
        const slotEndMin = getMinutesOfDay(end);
        const bookingStartMin = getMinutesOfDay(booking.startTime);
        const bookingEndMin = getMinutesOfDay(booking.endTime);

        // Hay conflicto si los rangos se superponen
        const isConflict = slotStartMin < bookingEndMin && slotEndMin > bookingStartMin;

        if (isConflict && debugSlot) {
          const bookStartStr = `${String(booking.startTime.getHours()).padStart(2, '0')}:${String(booking.startTime.getMinutes()).padStart(2, '0')}`;
          const bookEndStr = `${String(booking.endTime.getHours()).padStart(2, '0')}:${String(booking.endTime.getMinutes()).padStart(2, '0')}`;
          conflicts.push(`${bookStartStr}-${bookEndStr}`);
        }

        return isConflict;
      });

      if (debugSlot && conflicts.length > 0) {
        this.logger.log(`    ${staff.name}: ❌ Ocupado (${conflicts.join(', ')})`);
      } else if (debugSlot && !hasConflict) {
        this.logger.log(`    ${staff.name}: ✅ Disponible`);
      }

      if (hasConflict) {
        continue; // Este técnico está ocupado en este horario
      }

      // Check shift schedule: the entire slot must fit within one of the staff's shifts
      const slotStartMin = start.getHours() * 60 + start.getMinutes();
      const slotEndMin = end.getHours() * 60 + end.getMinutes();
      if (!this.isWithinShifts(staff.shifts, slotStartMin, slotEndMin, start)) {
        if (debugSlot) {
          this.logger.log(`    ${staff.name}: ❌ Outside shift hours`);
        }
        continue;
      }

      // Calcular carga de trabajo total del día
      let workload = bookings
        .filter(b => b.staffId === staff.id)
        .reduce((total, b) => {
          const minutes = (b.endTime.getTime() - b.startTime.getTime()) / 60000;
          return total + minutes;
        }, 0);

      // IMPORTANTE: Penalizar técnicos ya asignados en este slot multi-servicio
      // EXCEPCIÓN: NO penalizar al técnico seleccionado por el cliente
      // Esto permite que el técnico principal haga múltiples servicios si puede
      const isAlreadyAssigned = alreadyAssignedIds.includes(staff.id);
      const isSelectedTechnician = selectedTechnicianId && staff.id === selectedTechnicianId;

      if (isAlreadyAssigned && !isSelectedTechnician) {
        // Ya asignado Y NO es el técnico elegido → Penalizar para distribuir
        workload += 10000;
        if (debugSlot) {
          this.logger.log(`    ${staff.name}: ⚠️ Ya asignado en este slot (penalizado)`);
        }
      } else if (isAlreadyAssigned && isSelectedTechnician) {
        // Ya asignado PERO es el técnico elegido → NO penalizar
        if (debugSlot) {
          this.logger.log(`    ${staff.name}: ✅ Ya asignado pero es técnico seleccionado (sin penalización)`);
        }
      }

      // Seleccionar técnico con menor carga
      if (workload < minWorkload) {
        minWorkload = workload;
        bestStaff = staff;
      }
    }

    return bestStaff;
  }

  // ============================================================================
  // VIP COMBO: SERVICIOS SIMULTÁNEOS (2 técnicos al mismo tiempo)
  // ============================================================================

  /**
   * 🌟 VIP COMBO: Encuentra slots donde 2 técnicos diferentes puedan realizar
   * ambos servicios SIMULTÁNEAMENTE (al mismo tiempo, no consecutivamente)
   * 
   * Requisitos:
   * - Exactamente 2 servicios con combo=true (Manicure + Pedicure)
   * - 2 técnicos DIFERENTES disponibles al mismo tiempo
   * - La duración del slot = MAX(servicio1, servicio2) + buffer
   */
  async findVIPComboSlots(
    serviceIds: string[],
    date: string,
    servicesWithAddons?: any[],
    selectedTechnicianId?: string,
    selectedServiceId?: string
  ): Promise<MultiServiceSlot[]> {
    try {
      this.logger.log(`\n🌟 === FINDING VIP COMBO SLOTS (SIMULTANEOUS) ===`);
      this.logger.log(`📅 Date: ${date}`);
      this.logger.log(`🎯 Service IDs: ${JSON.stringify(serviceIds)}`);
      this.logger.log(`👤 Selected Technician: ${selectedTechnicianId || 'none'}`);
      this.logger.log(`🔧 Selected Service: ${selectedServiceId || 'none'}`);

      if (serviceIds.length !== 2) {
        this.logger.warn('❌ VIP Combo requires exactly 2 services');
        return [];
      }

      // 1. Obtener información de servicios
      const services = await this.getServices(serviceIds);
      
      if (services.length !== 2) {
        this.logger.warn('❌ Could not find both services');
        return [];
      }

      // 1.1. Agregar información de addons a los servicios
      if (servicesWithAddons && servicesWithAddons.length > 0) {
        this.logger.log(`\n📦 Processing servicesWithAddons from frontend:`);
        servicesWithAddons.forEach((swa, idx) => {
          this.logger.log(`   Service ${idx + 1} (${swa.id}): ${swa.addOns?.length || 0} addons`);
          if (swa.addOns && swa.addOns.length > 0) {
            swa.addOns.forEach((addon: any) => {
              this.logger.log(`      - Addon: ${addon.id}, additionalTime: ${addon.additionalTime}`);
            });
          }
        });

        services.forEach(service => {
          const serviceWithAddon = servicesWithAddons.find(s => s.id === service.id);
          if (serviceWithAddon && serviceWithAddon.addOns) {
            service.addOns = serviceWithAddon.addOns.map((addon: any) => ({
              id: addon.id,
              additionalTime: addon.additionalTime || 0,
              price: addon.price || 0
            }));
            this.logger.log(`   ✅ Assigned ${service.addOns?.length || 0} addons to ${service.name}`);
          }
        });
      }

      // 2. Calcular duración total = MAX de ambos servicios (se hacen al mismo tiempo)
      const service1Duration = this.getServiceTotalDuration(services[0]);
      const service2Duration = this.getServiceTotalDuration(services[1]);
      const simultaneousDuration = Math.max(service1Duration, service2Duration);
      
      this.logger.log(`\n📦 Services for VIP Combo:`);
      this.logger.log(`   - ${services[0].name}: ${service1Duration}min`);
      this.logger.log(`   - ${services[1].name}: ${service2Duration}min`);
      this.logger.log(`   ⏱️ Simultaneous Duration: ${simultaneousDuration}min (max of both)`);

      // 3. Obtener staff disponible para cada servicio
      const staffByService = await this.getStaffForServices(serviceIds);

      this.logger.log(`\n👥 Staff Available by Service:`);
      staffByService.forEach((staff, serviceId) => {
        const serviceName = services.find(s => s.id === serviceId)?.name || serviceId;
        this.logger.log(`   - ${serviceName}: ${staff.length} staff members`);
      });

      // Verificar que haya al menos un técnico por servicio
      for (const serviceId of serviceIds) {
        if (!staffByService.has(serviceId) || staffByService.get(serviceId)!.length === 0) {
          this.logger.warn(`❌ No staff available for service ${serviceId}`);
          return [];
        }
      }

      // 4. Obtener bookings existentes del día
      const existingBookings = await this.getBookingsForDate(date);
      
      this.logger.log(`\n📋 VIP COMBO: Found ${existingBookings.length} existing bookings for ${date}`);
      if (existingBookings.length > 0) {
        this.logger.log(`   Bookings loaded:`);
        existingBookings.forEach(b => {
          const startMin = b.startTime.getHours() * 60 + b.startTime.getMinutes();
          const endMin = b.endTime.getHours() * 60 + b.endTime.getMinutes();
          this.logger.log(`     - Staff ${b.staffId.substring(0,8)}...: ${startMin}-${endMin}min`);
        });
      }

      // 5. Generar slots donde 2 técnicos puedan trabajar simultáneamente
      // Si hay técnico seleccionado, DEBE estar en todos los slots
      const availableSlots = this.findVIPComboAvailableSlots(
        services,
        staffByService,
        existingBookings,
        date,
        simultaneousDuration,
        selectedTechnicianId,
        selectedServiceId
      );

      this.logger.log(`\n✅ VIP COMBO RESULT: Found ${availableSlots.length} simultaneous slots`);
      
      return availableSlots;

    } catch (error) {
      this.logger.error(`Error finding VIP combo slots: ${error instanceof Error ? error.message : 'Unknown'}`, error instanceof Error ? error.stack : '');
      return [];
    }
  }

  /**
   * Genera slots VIP Combo donde 2 técnicos diferentes están disponibles simultáneamente
   */
  private findVIPComboAvailableSlots(
    services: Service[],
    staffByService: Map<string, Staff[]>,
    bookings: Booking[],
    date: string,
    simultaneousDuration: number,
    selectedTechnicianId?: string,
    selectedServiceId?: string
  ): MultiServiceSlot[] {
    const slots: MultiServiceSlot[] = [];
    const allTimeSlots = this.generateTimeSlots();

    // Filter staff by working day
    const filteredStaffByService = this.filterStaffByWorkingDay(staffByService, date);

    this.logger.log(`   Checking ${allTimeSlots.length} possible time slots for VIP Combo...`);
    this.logger.log(`   Selected technician: ${selectedTechnicianId || 'none'} for service ${selectedServiceId || 'none'}`);
    this.logger.log(`   Existing bookings: ${bookings.length}`);
    if (bookings.length > 0) {
      this.logger.log(`   Bookings detail:`);
      bookings.forEach(b => {
        const startStr = `${String(b.startTime.getHours()).padStart(2, '0')}:${String(b.startTime.getMinutes()).padStart(2, '0')}`;
        const endStr = `${String(b.endTime.getHours()).padStart(2, '0')}:${String(b.endTime.getMinutes()).padStart(2, '0')}`;
        this.logger.log(`      Staff ${b.staffId.substring(0, 8)}...: ${startStr}-${endStr}`);
      });
    }

    let checkedSlots = 0;
    let rejectedByBusinessHours = 0;
    let rejectedByNoStaff = 0;
    let rejectedBySelectedStaffBusy = 0;

    for (const slot of allTimeSlots) {
      const [hour, minute] = slot.time.split(':').map(Number);
      const slotStart = new Date(`${date}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`);
      const slotEnd = new Date(slotStart.getTime() + simultaneousDuration * 60000);

      checkedSlots++;

      // Verificar que termine antes del cierre (21:30)
      const endTimeInMinutes = slotEnd.getHours() * 60 + slotEnd.getMinutes();
      const businessEndMinutes = 21 * 60 + 30;

      if (endTimeInMinutes > businessEndMinutes) {
        rejectedByBusinessHours++;
        continue;
      }

      // Intentar asignar 2 técnicos DIFERENTES para el mismo slot
      // Si hay técnico seleccionado, debe estar en todos los slots
      const assignments = this.tryAssignTwoStaffSimultaneously(
        services,
        filteredStaffByService,
        bookings,
        slotStart,
        slotEnd,
        selectedTechnicianId,
        selectedServiceId
      );

      if (!assignments) {
        // Check if it failed because the selected technician is busy
        if (selectedTechnicianId && !this.isStaffAvailable(selectedTechnicianId, bookings, slotStart, slotEnd)) {
          rejectedBySelectedStaffBusy++;
        } else {
          rejectedByNoStaff++;
        }
      }

      if (assignments) {
        const formatLocalTime = (date: Date): string => {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          const hours = String(date.getHours()).padStart(2, '0');
          const minutes = String(date.getMinutes()).padStart(2, '0');
          const seconds = String(date.getSeconds()).padStart(2, '0');
          return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
        };

        // Calcular precio total (servicios + addons)
        const totalPrice = services.reduce((sum, service) => {
          const servicePrice = service.price || 0;
          const addonsPrice = (service.addOns || []).reduce((addonSum, addon) => addonSum + (addon.price || 0), 0);
          return sum + servicePrice + addonsPrice;
        }, 0);

        slots.push({
          startTime: formatLocalTime(slotStart),
          endTime: formatLocalTime(slotEnd),
          totalDuration: simultaneousDuration,
          totalPrice: totalPrice,
          available: true,
          services: assignments,
          assignments,
        });
      }
    }

    this.logger.log(`\n📊 SLOT CHECK SUMMARY:`);
    this.logger.log(`   Total slots checked: ${checkedSlots}`);
    this.logger.log(`   Rejected by business hours: ${rejectedByBusinessHours}`);
    this.logger.log(`   Rejected by no staff available: ${rejectedByNoStaff}`);
    this.logger.log(`   ✅ Available slots: ${slots.length}`);

    return slots;
  }

  /**
   * Intenta asignar 2 técnicos DIFERENTES para trabajar simultáneamente
   * Ambos deben estar libres durante todo el slot
   * 
   * Si hay técnico seleccionado (selectedTechnicianId):
   * - El técnico seleccionado DEBE estar en el slot
   * - Si está ocupado, el slot no está disponible
   * - Solo se busca alternativa para el OTRO servicio
   * - Si no se especifica selectedServiceId, se auto-detecta basado en qué servicios puede hacer el técnico
   */
  private tryAssignTwoStaffSimultaneously(
    services: Service[],
    staffByService: Map<string, Staff[]>,
    bookings: Booking[],
    slotStart: Date,
    slotEnd: Date,
    selectedTechnicianId?: string,
    selectedServiceId?: string
  ): StaffAssignment[] | null {
    const [service1, service2] = services;
    const staff1Candidates = staffByService.get(service1.id) || [];
    const staff2Candidates = staffByService.get(service2.id) || [];
    
    const slotTimeStr = `${String(slotStart.getHours()).padStart(2, '0')}:${String(slotStart.getMinutes()).padStart(2, '0')}`;
    const formatTime = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    
    // Si hay técnico seleccionado, usar lógica especial
    if (selectedTechnicianId) {
      // Find selected technician's shifts from candidates
      const allCandidates = [...staff1Candidates, ...staff2Candidates];
      const selectedTechData = allCandidates.find(s => s.id === selectedTechnicianId);
      const selectedShifts = selectedTechData?.shifts;

      // Verificar que el técnico seleccionado esté disponible
      const selectedIsAvailable = this.isStaffAvailable(selectedTechnicianId, bookings, slotStart, slotEnd, selectedShifts);
      
      if (!selectedIsAvailable) {
        // El técnico seleccionado está ocupado - slot NO disponible
        return null;
      }
      
      // Auto-detectar qué servicio puede hacer el técnico seleccionado
      const canDoService1 = staff1Candidates.some(s => s.id === selectedTechnicianId);
      const canDoService2 = staff2Candidates.some(s => s.id === selectedTechnicianId);
      
      // Si se especificó selectedServiceId, verificar que sea válido
      let selectedForService1 = false;
      let selectedForService2 = false;
      
      if (selectedServiceId) {
        selectedForService1 = selectedServiceId === service1.id && canDoService1;
        selectedForService2 = selectedServiceId === service2.id && canDoService2;
      } else {
        // Auto-detectar: preferir el servicio que SOLO puede hacer el técnico seleccionado
        if (canDoService1 && !canDoService2) {
          selectedForService1 = true;
        } else if (canDoService2 && !canDoService1) {
          selectedForService2 = true;
        } else if (canDoService1 && canDoService2) {
          // El técnico puede hacer ambos servicios - elegir el primero
          // (o podríamos elegir el que tiene menos opciones de staff alternativo)
          selectedForService1 = true;
        }
      }
      
      if (!selectedForService1 && !selectedForService2) {
        // El técnico seleccionado no puede hacer ninguno de los servicios
        return null;
      }
      
      // Encontrar el técnico seleccionado en los candidatos
      let selectedStaff: Staff | undefined;
      if (selectedForService1) {
        selectedStaff = staff1Candidates.find(s => s.id === selectedTechnicianId);
      } else if (selectedForService2) {
        selectedStaff = staff2Candidates.find(s => s.id === selectedTechnicianId);
      }
      
      if (!selectedStaff) {
        // El técnico seleccionado no puede hacer este servicio
        return null;
      }
      
      // Buscar técnico para el OTRO servicio (que no sea el seleccionado)
      let otherService: Service;
      let otherCandidates: Staff[];
      
      if (selectedForService1) {
        otherService = service2;
        otherCandidates = staff2Candidates;
      } else {
        otherService = service1;
        otherCandidates = staff1Candidates;
      }
      
      // Buscar técnico disponible para el otro servicio (que sea DIFERENTE)
      const otherAvailable = otherCandidates.filter(staff => 
        staff.id !== selectedTechnicianId && 
        this.isStaffAvailable(staff.id, bookings, slotStart, slotEnd, staff.shifts)
      );
      
      if (otherAvailable.length === 0) {
        // No hay otro técnico disponible para el otro servicio
        return null;
      }
      
      // Usar el primer técnico disponible para el otro servicio
      const otherStaff = otherAvailable[0];
      
      // Construir las asignaciones en el orden correcto
      if (selectedForService1) {
        return [
          {
            serviceId: service1.id,
            serviceName: service1.name,
            staffId: selectedStaff.id,
            staffName: selectedStaff.name,
            startTime: formatTime(slotStart),
            endTime: formatTime(slotEnd),
            duration: this.getServiceTotalDuration(service1),
          },
          {
            serviceId: service2.id,
            serviceName: service2.name,
            staffId: otherStaff.id,
            staffName: otherStaff.name,
            startTime: formatTime(slotStart),
            endTime: formatTime(slotEnd),
            duration: this.getServiceTotalDuration(service2),
          }
        ];
      } else {
        return [
          {
            serviceId: service1.id,
            serviceName: service1.name,
            staffId: otherStaff.id,
            staffName: otherStaff.name,
            startTime: formatTime(slotStart),
            endTime: formatTime(slotEnd),
            duration: this.getServiceTotalDuration(service1),
          },
          {
            serviceId: service2.id,
            serviceName: service2.name,
            staffId: selectedStaff.id,
            staffName: selectedStaff.name,
            startTime: formatTime(slotStart),
            endTime: formatTime(slotEnd),
            duration: this.getServiceTotalDuration(service2),
          }
        ];
      }
    }
    
    // Sin técnico seleccionado: lógica original (buscar cualquier combinación válida)
    
    // Log candidates for first few slots only
    if (slotStart.getHours() <= 8) {
      this.logger.log(`   🔍 Slot ${slotTimeStr}: Checking staff availability`);
      this.logger.log(`      Service1 (${service1.name}) candidates: ${staff1Candidates.map(s => s.name).join(', ')}`);
      this.logger.log(`      Service2 (${service2.name}) candidates: ${staff2Candidates.map(s => s.name).join(', ')}`);
    }

    // Encontrar todos los técnicos disponibles para servicio 1
    const availableStaff1 = staff1Candidates.filter(staff => 
      this.isStaffAvailable(staff.id, bookings, slotStart, slotEnd, staff.shifts)
    );

    // Encontrar todos los técnicos disponibles para servicio 2
    const availableStaff2 = staff2Candidates.filter(staff => 
      this.isStaffAvailable(staff.id, bookings, slotStart, slotEnd, staff.shifts)
    );

    if (slotStart.getHours() <= 8) {
      this.logger.log(`      Available for Service1: ${availableStaff1.map(s => s.name).join(', ') || 'NONE'}`);
      this.logger.log(`      Available for Service2: ${availableStaff2.map(s => s.name).join(', ') || 'NONE'}`);
    }

    if (availableStaff1.length === 0 || availableStaff2.length === 0) {
      return null;
    }

    // Buscar una combinación donde sean 2 técnicos DIFERENTES
    for (const tech1 of availableStaff1) {
      for (const tech2 of availableStaff2) {
        if (tech1.id !== tech2.id) {
          // ¡Encontramos 2 técnicos diferentes disponibles!
          return [
            {
              serviceId: service1.id,
              serviceName: service1.name,
              staffId: tech1.id,
              staffName: tech1.name,
              startTime: formatTime(slotStart),
              endTime: formatTime(slotEnd),
              duration: this.getServiceTotalDuration(service1),
            },
            {
              serviceId: service2.id,
              serviceName: service2.name,
              staffId: tech2.id,
              staffName: tech2.name,
              startTime: formatTime(slotStart), // MISMO horario de inicio
              endTime: formatTime(slotEnd),     // MISMO horario de fin
              duration: this.getServiceTotalDuration(service2),
            }
          ];
        }
      }
    }

    // No encontramos 2 técnicos diferentes disponibles
    return null;
  }

  /**
   * Verifica si un técnico está disponible durante un rango de tiempo
   * NOTA: Usa hora local para comparación consistente
   */
  private isStaffAvailable(
    staffId: string,
    bookings: Booking[],
    start: Date,
    end: Date,
    shifts?: Array<{ shiftStart: string; shiftEnd: string }>
  ): boolean {
    // Usar hora local para consistencia con slots generados en hora local
    const getMinutesOfDay = (date: Date): number => {
      return date.getHours() * 60 + date.getMinutes();
    };

    const slotStartMin = getMinutesOfDay(start);
    const slotEndMin = getMinutesOfDay(end);

    // Check shifts if provided
    if (shifts && shifts.length > 0) {
      if (!this.isWithinShifts(shifts, slotStartMin, slotEndMin)) {
        return false;
      }
    }

    // Debug para el primer booking
    if (bookings.length > 0) {
      const debugBooking = bookings.find(b => b.staffId === staffId);
      if (debugBooking) {
        this.logger.debug(`   🔍 Checking staff ${staffId.substring(0,8)}:`);
        this.logger.debug(`      Slot: ${slotStartMin}-${slotEndMin}min`);
        this.logger.debug(`      Booking raw: ${debugBooking.startTime} - ${debugBooking.endTime}`);
        this.logger.debug(`      Booking hours: ${debugBooking.startTime.getHours()}:${debugBooking.startTime.getMinutes()} - ${debugBooking.endTime.getHours()}:${debugBooking.endTime.getMinutes()}`);
      }
    }

    for (const booking of bookings) {
      if (booking.staffId !== staffId) continue;

      const bookingStartMin = getMinutesOfDay(booking.startTime);
      const bookingEndMin = getMinutesOfDay(booking.endTime);

      // Hay conflicto si los rangos se superponen
      if (slotStartMin < bookingEndMin && slotEndMin > bookingStartMin) {
        this.logger.debug(`      ❌ CONFLICT: slot ${slotStartMin}-${slotEndMin} vs booking ${bookingStartMin}-${bookingEndMin}`);
        return false;
      }
    }

    return true;
  }

}
