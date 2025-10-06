/**
 * Booking status enumeration
 * 
 * Represents the different states a booking can have throughout its lifecycle.
 * These values match the database enum: booking_status
 */
export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed', 
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show'
}

/**
 * Type guard to check if a value is a valid BookingStatus
 */
export function isValidBookingStatus(value: string): value is BookingStatus {
  return Object.values(BookingStatus).includes(value as BookingStatus);
}

/**
 * Get display name for booking status
 */
export function getBookingStatusDisplayName(status: BookingStatus): string {
  const displayNames: Record<BookingStatus, string> = {
    [BookingStatus.PENDING]: 'Pendiente',
    [BookingStatus.CONFIRMED]: 'Confirmado', 
    [BookingStatus.COMPLETED]: 'Completado',
    [BookingStatus.CANCELLED]: 'Cancelado',
    [BookingStatus.NO_SHOW]: 'No se presentó'
  };
  
  return displayNames[status] || status;
}