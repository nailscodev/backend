import { IsOptional, IsUUID, IsDateString, IsArray, IsEnum, IsString, IsNumber, Min, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { BookingStatus } from '../../domain/value-objects/booking-status.vo';

export class UpdateBookingDto {
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
    description: 'Updated array of add-on service IDs',
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
}