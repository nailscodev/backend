import { Injectable, Logger } from '@nestjs/common';
import { Sequelize } from 'sequelize-typescript';
import { QueryTypes } from 'sequelize';

// Interfaces
interface Service {
  id: string;
  name: string;
  duration: number;
  bufferTime: number;
  categoryId: string;
  parentCategoryId?: string | null; // For removal services: the category they prepare for
}

interface Staff {
  id: string;
  name: string;
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
  ) { }

  /**
   * Encuentra slots disponibles para múltiples servicios consecutivos
   * Cada servicio puede ser realizado por un técnico diferente
   */
  async findMultiServiceSlots(
    serviceIds: string[],
    date: string,
    selectedTechnicianId?: string
  ): Promise<MultiServiceSlot[]> {

    try {
      this.logger.log(`\n🔍 === FINDING MULTI-SERVICE SLOTS ===`);
      this.logger.log(`📅 Date: ${date}`);
      this.logger.log(`🎯 Service IDs: ${JSON.stringify(serviceIds)}`);
      this.logger.log(`👤 Selected Technician: ${selectedTechnicianId || 'None (any available)'}`);

      // 1. Obtener información de servicios
      const services = await this.getServices(serviceIds);
      this.logger.log(`\n📦 Services Found: ${services.length}`);
      services.forEach(s => {
        this.logger.log(`   - ${s.name} (${s.duration}min + ${s.bufferTime}min buffer)`);
      });

      if (services.length === 0) {
        this.logger.warn('❌ No services found for provided IDs');
        return [];
      }

      // 2. Calcular duración total necesaria
      const totalMinutes = services.reduce((sum, s) => sum + s.duration + s.bufferTime, 0);
      this.logger.log(`\n⏱️ Total Duration Needed: ${totalMinutes} minutes`);

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

      return availableSlots;

    } catch (error) {
      this.logger.error(`Error finding multi-service slots: ${error instanceof Error ? error.message : 'Unknown'}`, error instanceof Error ? error.stack : '');
      return [];
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
    }>(
      `SELECT s.id, s.name, s.duration, s."bufferTime", s.category_id, s.parent_category_id
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
    }>(
      `SELECT a.id, a.name, a."additionalTime"
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

    for (const serviceId of serviceIds) {
      // Buscar primero en staff_services
      const serviceStaff = await this.sequelize.query<{
        id: string;
        firstName: string;
        lastName: string;
      }>(
        `SELECT s.id, s."firstName", s."lastName"
         FROM staff s
         INNER JOIN staff_services ss ON s.id = ss.staff_id
         WHERE ss.service_id = $1
           AND s.status = 'ACTIVE'
           AND s."isBookable" = true`,
        {
          bind: [serviceId],
          type: QueryTypes.SELECT,
        }
      );

      // Si no encontramos en services, buscar staff para addons
      if (serviceStaff.length === 0) {
        // Para addons (removal, nail art, etc.), buscar staff por categoría
        // basado en el sufijo del nombre del addon (ej: "- Mani", "- Pedi")
        const addonInfo = await this.sequelize.query<{
          name: string;
        }>(
          `SELECT name FROM addons WHERE id = $1`,
          {
            bind: [serviceId],
            type: QueryTypes.SELECT,
          }
        );

        if (addonInfo.length > 0) {
          const addonName = addonInfo[0].name.toLowerCase();
          let categoryToFind = '';

          // Determinar qué categoría buscar basado en el sufijo del addon
          // Ejemplos: "Gel Removal - Mani", "Nail Art (10 M) - Mani", "Nail Art (15 M) - Pedi"
          if (addonName.includes('- mani') || addonName.includes('mani')) {
            categoryToFind = 'Manicure';
          } else if (addonName.includes('- pedi') || addonName.includes('pedi')) {
            categoryToFind = 'Pedicure';
          }

          if (categoryToFind) {
            const addonStaff = await this.sequelize.query<{
              id: string;
              firstName: string;
              lastName: string;
            }>(
              `SELECT DISTINCT s.id, s."firstName", s."lastName"
               FROM staff s
               INNER JOIN staff_services ss ON s.id = ss.staff_id
               INNER JOIN services srv ON ss.service_id = srv.id
               INNER JOIN categories c ON srv.category_id = c.id
               WHERE c.name = $1
                 AND s.status = 'ACTIVE'
                 AND s."isBookable" = true`,
              {
                bind: [categoryToFind],
                type: QueryTypes.SELECT,
              }
            );

            const staffList = addonStaff.map(s => ({ id: s.id, name: `${s.firstName} ${s.lastName}` }));
            map.set(serviceId, staffList);
          } else {
            map.set(serviceId, []);
          }
        } else {
          map.set(serviceId, []);
        }
      } else {
        const staffList = serviceStaff.map(s => ({ id: s.id, name: `${s.firstName} ${s.lastName}` }));
        map.set(serviceId, staffList);
      }
    }

    return map;
  }

  /**
   * Obtiene todos los bookings del día
   */
  private async getBookingsForDate(date: string): Promise<Booking[]> {
    const result = await this.sequelize.query<{
      staffId: string;
      startTime: string;
      endTime: string;
    }>(
      `SELECT "staffId", "startTime", "endTime"
       FROM bookings
       WHERE "appointmentDate" = $1
         AND status IN ('pending', 'confirmed')`,
      {
        bind: [date],
        type: QueryTypes.SELECT,
      }
    );

    const bookings = result.map(b => ({
      staffId: b.staffId,
      startTime: new Date(b.startTime),
      endTime: new Date(b.endTime),
    }));

    // Log para debug
    if (bookings.length > 0 && bookings.length < 15) {
      this.logger.log(`\n📋 Bookings parseados para ${date}:`);
      bookings.forEach(b => {
        const startStr = `${String(b.startTime.getHours()).padStart(2, '0')}:${String(b.startTime.getMinutes()).padStart(2, '0')}`;
        const endStr = `${String(b.endTime.getHours()).padStart(2, '0')}:${String(b.endTime.getMinutes()).padStart(2, '0')}`;
        this.logger.log(`   ${startStr}-${endStr} (Staff: ${b.staffId.substring(0, 8)}...)`);
      });
    }

    return bookings;
  }  // ============================================================================
  // MÉTODOS PRIVADOS - LÓGICA DE NEGOCIO
  // ============================================================================

  /**
   * Genera slots de tiempo base (business hours: 07:30 - 21:30)
   */
  private generateTimeSlots(): Array<{ time: string }> {
    const slots: Array<{ time: string }> = [];
    const startHour = 7;
    const startMinute = 30;
    const endHour = 21;
    const endMinute = 30;
    const intervalMinutes = 60; // Slots cada 1 hora

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
      const assignments = this.tryAssignStaffForSlot(
        services,
        staffByService,
        bookings,
        slotStart,
        selectedTechnicianId
      );

      if (!assignments) {
        slotsNoStaff++;
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

        slots.push({
          startTime: formatLocalTime(slotStart),
          endTime: formatLocalTime(slotEnd),
          totalDuration: totalMinutes,
          totalPrice: 0,
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
   * Maneja removals: el técnico que hace el servicio principal también hace su removal
   * IMPORTANTE: Para multi-servicio, prueba diferentes órdenes de ejecución
   */
  private tryAssignStaffForSlot(
    services: Service[],
    staffByService: Map<string, Staff[]>,
    bookings: Booking[],
    startTime: Date,
    selectedTechnicianId?: string
  ): StaffAssignment[] | null {

    const slotTimeStr = `${String(startTime.getHours()).padStart(2, '0')}:${String(startTime.getMinutes()).padStart(2, '0')}`;
    const isDebugSlot = ['10:30', '11:30', '12:30', '13:30', '14:30', '15:30'].includes(slotTimeStr);

    if (isDebugSlot) {
      this.logger.log(`\n🔍 [DEBUG ${slotTimeStr}] Evaluando slot...`);
    }

    // Para multi-servicio con diferentes técnicos, probar todas las permutaciones de orden
    // Esto permite que Sofia haga pedicure primero O al final
    const servicePermutations = this.generateServicePermutations(services);

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
   * Genera permutaciones de servicios manteniendo removals con sus servicios principales
   */
  private generateServicePermutations(services: Service[]): Service[][] {
    // Si hay removal + servicio principal de una categoría + servicio de otra categoría,
    // podemos intercambiar el orden entre las categorías

    const removals: Service[] = [];
    const maniServices: Service[] = [];
    const pediServices: Service[] = [];

    for (const service of services) {
      const name = service.name.toLowerCase();
      if (name.includes('removal')) {
        removals.push(service);
      } else if (name.includes('mani')) {
        maniServices.push(service);
      } else if (name.includes('pedi')) {
        pediServices.push(service);
      }
    }

    // Agrupar removal de mani con manicure
    const maniBlock: Service[] = [];
    removals.forEach(r => {
      if (r.name.toLowerCase().includes('mani')) {
        maniBlock.push(r);
      }
    });
    maniBlock.push(...maniServices);

    // Agrupar removal de pedi con pedicure
    const pediBlock: Service[] = [];
    removals.forEach(r => {
      if (r.name.toLowerCase().includes('pedi')) {
        pediBlock.push(r);
      }
    });
    pediBlock.push(...pediServices);

    // Generar permutaciones: mani antes de pedi, o pedi antes de mani
    const permutations: Service[][] = [];

    if (maniBlock.length > 0 && pediBlock.length > 0) {
      // Opción 1: Mani primero, luego Pedi
      permutations.push([...maniBlock, ...pediBlock]);
      // Opción 2: Pedi primero, luego Mani
      permutations.push([...pediBlock, ...maniBlock]);
    } else if (maniBlock.length > 0) {
      permutations.push(maniBlock);
    } else if (pediBlock.length > 0) {
      permutations.push(pediBlock);
    } else {
      // Servicios sin categoría clara, usar orden original
      permutations.push(services);
    }

    return permutations;
  }

  /**
   * Intenta asignar staff para los servicios en un orden específico
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
      const duration = service.duration + service.bufferTime;
      const currentEnd = new Date(currentStart.getTime() + duration * 60000);

      if (debugSlot) {
        const startStr = `${String(currentStart.getHours()).padStart(2, '0')}:${String(currentStart.getMinutes()).padStart(2, '0')}`;
        const endStr = `${String(currentEnd.getHours()).padStart(2, '0')}:${String(currentEnd.getMinutes()).padStart(2, '0')}`;
        this.logger.log(`  Servicio ${i + 1}: ${service.name} (${startStr}-${endStr}, ${duration}min)`);
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

          assigned = this.findAvailableStaffWithMinWorkload(
            staffToConsider,
            bookings,
            currentStart,
            currentEnd,
            debugSlot
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
          assigned = this.findAvailableStaffWithMinWorkload(
            candidateStaff,
            bookings,
            currentStart,
            currentEnd,
            debugSlot
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
        let staffToConsider = candidateStaff;

        // CAMBIO IMPORTANTE: Para cualquier servicio, intentar usar técnico seleccionado si puede hacerlo
        // Esto permite multi-servicio con diferentes técnicos por servicio
        if (selectedTechnicianId) {
          const selectedStaff = candidateStaff.find(s => s.id === selectedTechnicianId);
          if (selectedStaff) {
            // El técnico seleccionado PUEDE hacer este servicio, úsalo
            staffToConsider = [selectedStaff];
            this.logger.debug(`   Service ${i + 1}: Using selected technician ${selectedStaff.name}`);
          } else {
            // El técnico seleccionado NO puede hacer este servicio
            // Para multi-servicio, permitir cualquier técnico disponible
            this.logger.debug(`   Service ${i + 1}: Selected technician cannot do this service, finding alternative`);
            // staffToConsider ya es candidateStaff (todos los que pueden hacer el servicio)
          }
        }

        assigned = this.findAvailableStaffWithMinWorkload(
          staffToConsider,
          bookings,
          currentStart,
          currentEnd,
          debugSlot
        );

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
   */
  private findAvailableStaffWithMinWorkload(
    candidates: Staff[],
    bookings: Booking[],
    start: Date,
    end: Date,
    debugSlot?: string
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

      // Calcular carga de trabajo total del día
      const workload = bookings
        .filter(b => b.staffId === staff.id)
        .reduce((total, b) => {
          const minutes = (b.endTime.getTime() - b.startTime.getTime()) / 60000;
          return total + minutes;
        }, 0);

      // Seleccionar técnico con menor carga
      if (workload < minWorkload) {
        minWorkload = workload;
        bestStaff = staff;
      }
    }

    return bestStaff;
  }

}
