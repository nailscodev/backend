import { IsOptional, IsUUID, IsDateString, IsArray, IsEnum, IsString, IsNumber, Min, IsBoolean, Matches } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { BookingStatus } from '../../domain/value-objects/booking-status.vo';

export class UpdateBookingDto {
  @ApiPropertyOptional({
    description: 'ID of the service (can be changed to modify the booking service)',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsOptional()
  @IsString()
  @Matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, {
    message: 'serviceId must be a valid UUID',
  })
  serviceId?: string;

  @ApiPropertyOptional({
    description: 'ID of the staff member (can be changed for reassignment)',
    example: '123e4567-e89b-12d3-a456-426614174003',
  })
  @IsOptional()
  @IsUUID()
  staffId?: string;

  @ApiPropertyOptional({
    description: 'Updated appointment date',
    example: '2025-09-21',
  })
  @IsOptional()
  @IsDateString()
  appointmentDate?: string;

  @ApiPropertyOptional({
    description: 'Updated start time of the booking',
    example: '15:00:00',
  })
  @IsOptional()
  @IsString()
  startTime?: string;

  @ApiPropertyOptional({
    description: 'Updated end time of the booking',
    example: '16:00:00',
  })
  @IsOptional()
  @IsString()
  endTime?: string;

  @ApiPropertyOptional({
    description: 'Updated array of add-on service IDs (includes both normal and removal addons)',
    example: ['123e4567-e89b-12d3-a456-426614174004'],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  addOnIds?: string[];

  @ApiPropertyOptional({
    description: 'Updated total price',
    example: 60.00,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  totalPrice?: number;

  @ApiPropertyOptional({
    description: 'Updated special notes or requests',
    example: 'Cambio de horario solicitado por cliente',
  })
  @IsOptional()
  @IsString()
  notes?: string;
  @ApiPropertyOptional({
    description: 'Updated booking status',
    enum: BookingStatus,
    example: BookingStatus.IN_PROGRESS,
  })
  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;

  @ApiPropertyOptional({
    description: 'Updated payment method',
    enum: ['CASH', 'CARD'],
    example: 'CARD',
  })
  @IsOptional()
  @IsEnum(['CASH', 'CARD'], { message: 'paymentMethod must be CASH or CARD' })
  paymentMethod?: 'CASH' | 'CARD';

  @ApiPropertyOptional({
    description: 'Reason for cancellation',
    example: 'Cliente no se presentó',
  })
  @IsOptional()
  @IsString()
  cancellationReason?: string;
}