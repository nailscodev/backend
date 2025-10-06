import { IsString, IsOptional, IsEnum, IsNumber, IsDateString, IsBoolean } from 'class-validator';

// Define types locally since entities are being converted to Sequelize
export enum ReservationStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  IN_PROGRESS = 'in-progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no-show',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  PARTIAL = 'partial',
}

export enum CancelledBy {
  CLIENT = 'client',
  STAFF = 'staff',
  ADMIN = 'admin',
  SYSTEM = 'system',
}

export class CreateReservationDto {
  @IsString()
  client_id: string;

  @IsString()
  service_id: string;

  @IsString()
  staff_id: string;

  @IsDateString()
  appointment_date: string;

  @IsString()
  start_time: string;

  @IsString()
  end_time: string;

  @IsOptional()
  @IsNumber()
  duration_minutes?: number;

  @IsOptional()
  @IsEnum(ReservationStatus)
  status?: ReservationStatus;

  @IsOptional()
  @IsNumber()
  total_amount?: number;

  @IsOptional()
  @IsNumber()
  discount_amount?: number;

  @IsOptional()
  @IsNumber()
  final_amount?: number;

  @IsOptional()
  @IsEnum(PaymentStatus)
  payment_status?: PaymentStatus;

  @IsOptional()
  @IsNumber()
  deposit_amount?: number;

  @IsOptional()
  @IsNumber()
  remaining_amount?: number;

  @IsOptional()
  @IsString()
  payment_method?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  internal_notes?: string;

  @IsOptional()
  @IsBoolean()
  reminder_sent?: boolean;

  @IsOptional()
  @IsDateString()
  reminder_sent_at?: string;

  @IsOptional()
  @IsString()
  cancellation_reason?: string;

  @IsOptional()
  @IsEnum(CancelledBy)
  cancelled_by?: CancelledBy;

  @IsOptional()
  @IsDateString()
  cancelled_at?: string;

  @IsOptional()
  @IsString()
  created_by?: string;

  @IsOptional()
  @IsString()
  updated_by?: string;
}

export class UpdateReservationDto {
  @IsOptional()
  @IsString()
  client_id?: string;

  @IsOptional()
  @IsString()
  service_id?: string;

  @IsOptional()
  @IsString()
  staff_id?: string;

  @IsOptional()
  @IsDateString()
  appointment_date?: string;

  @IsOptional()
  @IsString()
  start_time?: string;

  @IsOptional()
  @IsString()
  end_time?: string;

  @IsOptional()
  @IsNumber()
  duration_minutes?: number;

  @IsOptional()
  @IsEnum(ReservationStatus)
  status?: ReservationStatus;

  @IsOptional()
  @IsNumber()
  total_amount?: number;

  @IsOptional()
  @IsNumber()
  discount_amount?: number;

  @IsOptional()
  @IsNumber()
  final_amount?: number;

  @IsOptional()
  @IsEnum(PaymentStatus)
  payment_status?: PaymentStatus;

  @IsOptional()
  @IsNumber()
  deposit_amount?: number;

  @IsOptional()
  @IsNumber()
  remaining_amount?: number;

  @IsOptional()
  @IsString()
  payment_method?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  internal_notes?: string;

  @IsOptional()
  @IsBoolean()
  reminder_sent?: boolean;

  @IsOptional()
  @IsDateString()
  reminder_sent_at?: string;

  @IsOptional()
  @IsString()
  cancellation_reason?: string;

  @IsOptional()
  @IsEnum(CancelledBy)
  cancelled_by?: CancelledBy;

  @IsOptional()
  @IsDateString()
  cancelled_at?: string;

  @IsOptional()
  @IsString()
  updated_by?: string;
}