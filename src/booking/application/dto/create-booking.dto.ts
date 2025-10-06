import { IsNotEmpty, IsUUID, IsDateString, IsArray, IsEnum, IsOptional, IsString, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { BookingStatus } from '../../domain/value-objects/booking-status.vo';

export class CreateBookingDto {
  @ApiProperty({
    description: 'ID of the service to book',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsNotEmpty()
  @IsUUID()
  serviceId: string;

  @ApiProperty({
    description: 'ID of the customer making the booking',
    example: '123e4567-e89b-12d3-a456-426614174002',
  })
  @IsNotEmpty()
  @IsUUID()
  customerId: string;

  @ApiProperty({
    description: 'ID of the staff member (optional, can be auto-assigned)',
    example: '123e4567-e89b-12d3-a456-426614174003',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  staffId?: string;

  @ApiProperty({
    description: 'Start time of the booking',
    example: '2025-09-21T14:00:00Z',
  })
  @IsNotEmpty()
  @IsDateString()
  startTime: string;

  @ApiProperty({
    description: 'End time of the booking',
    example: '2025-09-21T15:00:00Z',
  })
  @IsNotEmpty()
  @IsDateString()
  endTime: string;

  @ApiProperty({
    description: 'Array of add-on service IDs',
    example: ['123e4567-e89b-12d3-a456-426614174004'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
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
    description: 'Total booking price in cents',
    example: 5000,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  totalPrice: number;

  @ApiProperty({
    description: 'Deposit amount in cents',
    example: 1000,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  depositAmount?: number;

  @ApiProperty({
    description: 'Special notes or requests for the booking',
    example: 'Cliente prefiere técnica específica',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;
}