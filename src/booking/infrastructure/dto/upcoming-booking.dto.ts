import { ApiProperty } from '@nestjs/swagger';

export class UpcomingBookingDto {
  @ApiProperty({
    description: 'Booking ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Customer name',
    example: 'Maria Rodriguez',
  })
  customerName: string;

  @ApiProperty({
    description: 'Service name',
    example: 'Gel Manicure',
  })
  serviceName: string;

  @ApiProperty({
    description: 'Staff member name',
    example: 'Ana Gomez',
  })
  staffName: string;

  @ApiProperty({
    description: 'Appointment date and time',
    example: '2025-12-23T10:00:00Z',
  })
  appointmentDate: string;

  @ApiProperty({
    description: 'Start time (HH:mm:ss)',
    example: '10:00:00',
  })
  startTime: string;

  @ApiProperty({
    description: 'Booking status',
    example: 'confirmed',
  })
  status: string;

  @ApiProperty({
    description: 'Total price',
    example: 40.00,
  })
  totalPrice: number;
}
