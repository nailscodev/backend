/**
 * Booking Configuration
 * Centraliza configuraciones relacionadas con bookings y disponibilidad
 */

export class BookingConfig {
  /**
   * Buffer time por defecto entre servicios (en minutos)
   * Este tiempo es para limpieza y preparación entre clientes
   * Puede ser sobrescrito por el bufferTime específico de cada servicio
   */
  private static defaultBufferTime = 15;

  /**
   * Obtener el buffer time global
   */
  static getDefaultBufferTime(): number {
    return this.defaultBufferTime;
  }

  /**
   * Actualizar el buffer time global
   * @param minutes Nuevo buffer time en minutos (debe ser >= 0)
   */
  static setDefaultBufferTime(minutes: number): void {
    if (minutes < 0) {
      throw new Error('Buffer time must be greater than or equal to 0');
    }
    this.defaultBufferTime = minutes;
  }

  /**
   * Obtener el buffer time efectivo para un servicio
   * Si el servicio tiene bufferTime específico, lo usa
   * Caso contrario, usa el buffer time global
   */
  static getEffectiveBufferTime(serviceBufferTime?: number): number {
    return serviceBufferTime !== undefined && serviceBufferTime !== null 
      ? serviceBufferTime 
      : this.defaultBufferTime;
  }
}
