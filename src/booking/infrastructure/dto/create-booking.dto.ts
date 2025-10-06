import { IsNotEmpty, IsDateString, IsArray, IsEnum, IsOptional, IsString, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { BookingStatus } from '../../domain/value-objects/booking-status.vo';

export class CreateBookingDto {
  @ApiProperty({
    description: 'ID of the service to book',
    example: '11111111-1111-1111-1111-111111111111',
  })
  @IsNotEmpty()
  @IsString()
  serviceId: string;

  @ApiProperty({
    description: 'ID of the customer making the booking',
    example: 'f0000000-0000-0000-0000-000000000001',
  })
  @IsNotEmpty()
  @IsString()
  customerId: string;

  @ApiProperty({
    description: 'ID of the staff member (optional, can be auto-assigned)',
    example: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    required: false,
  })
  @IsOptional()
  @IsString()
  staffId?: string;

  @ApiProperty({
    description: 'Appointment date',
    example: '2025-09-21',
  })
  @IsNotEmpty()
  @IsDateString()
  appointmentDate: string;

  @ApiProperty({
    description: 'Start time of the booking',
    example: '14:00:00',
  })
  @IsNotEmpty()
  @IsString()
  startTime: string;

  @ApiProperty({
    description: 'End time of the booking',
    example: '15:00:00',
  })
  @IsNotEmpty()
  @IsString()
  endTime: string;

  @ApiProperty({
    description: 'Array of add-on service IDs',
    example: ['123e4567-e89b-12d3-a456-426614174004'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  addOnIds?: string[];

  @ApiProperty({
    description: 'Initial status of the booking',
    enum: BookingStatus,
    example: BookingStatus.PENDING,
    required: false,
  })
  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;

  @ApiProperty({
    description: 'Total booking amount',
    example: 50.00,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  totalAmount?: number;

  @ApiProperty({
    description: 'Special notes or requests for the booking',
    example: 'Cliente prefiere técnica específica',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;
}