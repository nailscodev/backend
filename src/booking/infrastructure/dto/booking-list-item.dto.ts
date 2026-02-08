import { ApiProperty } from '@nestjs/swagger';

export class BookingListItemDto {
  @ApiProperty({
    description: 'Booking ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Customer full name',
    example: 'Maria Rodriguez',
  })
  customerName: string;

  @ApiProperty({
    description: 'Customer email',
    example: 'maria@example.com',
  })
  customerEmail: string;

  @ApiProperty({
    description: 'Customer phone',
    example: '+1234567890',
  })
  customerPhone: string;

  @ApiProperty({
    description: 'Service name',
    example: 'Gel Manicure',
  })
  serviceName: string;

  @ApiProperty({
    description: 'Category ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  categoryId: string;

  @ApiProperty({
    description: 'Category name',
    example: 'Manicure',
  })
  categoryName: string;

  @ApiProperty({
    description: 'Staff member name',
    example: 'Ana Gomez',
  })
  staffName: string;

  @ApiProperty({
    description: 'Appointment date',
    example: '2025-12-23',
  })
  appointmentDate: string;

  @ApiProperty({
    description: 'Start time',
    example: '2025-12-23T10:00:00Z',
  })
  startTime: string;

  @ApiProperty({
    description: 'End time',
    example: '2025-12-23T11:00:00Z',
  })
  endTime: string;

  @ApiProperty({
    description: 'Booking status',
    example: 'pending',
  })
  status: string;

  @ApiProperty({
    description: 'Payment method',
    example: 'CASH',
    required: false,
  })
  paymentMethod?: string;

  @ApiProperty({
    description: 'Total price',
    example: 40.0,
  })
  totalPrice: number;

  @ApiProperty({
    description: 'Indicates if booking was made via web',
    example: true,
  })
  web: boolean;

  @ApiProperty({
    description: 'Notes',
    example: 'Customer prefers specific color',
    required: false,
  })
  notes?: string;

  @ApiProperty({
    description: 'Cancellation reason',
    example: 'Customer requested cancellation',
    required: false,
  })
  cancellationReason?: string;

  @ApiProperty({
    description: 'Created at',
    example: '2025-12-20T10:00:00Z',
  })
  createdAt: Date;
}
