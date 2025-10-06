import { IsString, IsOptional, IsNumber, IsBoolean, IsArray } from 'class-validator';

export class CreateServiceDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  category: string;

  @IsNumber()
  duration_minutes: number;

  @IsNumber()
  price: number;

  @IsOptional()
  @IsNumber()
  cost?: number;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsNumber()
  commission_rate?: number;

  @IsOptional()
  @IsBoolean()
  requires_materials?: boolean;

  @IsOptional()
  @IsArray()
  materials_list?: string[];

  @IsOptional()
  @IsNumber()
  preparation_time_minutes?: number;

  @IsOptional()
  @IsNumber()
  cleanup_time_minutes?: number;

  @IsOptional()
  @IsNumber()
  max_advance_booking_days?: number;

  @IsOptional()
  @IsNumber()
  min_advance_booking_hours?: number;

  @IsOptional()
  @IsNumber()
  cancellation_policy_hours?: number;

  @IsOptional()
  @IsArray()
  tags?: string[];

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @IsNumber()
  sort_order?: number;
}

export class UpdateServiceDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsNumber()
  duration_minutes?: number;

  @IsOptional()
  @IsNumber()
  price?: number;

  @IsOptional()
  @IsNumber()
  cost?: number;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsNumber()
  commission_rate?: number;

  @IsOptional()
  @IsBoolean()
  requires_materials?: boolean;

  @IsOptional()
  @IsArray()
  materials_list?: string[];

  @IsOptional()
  @IsNumber()
  preparation_time_minutes?: number;

  @IsOptional()
  @IsNumber()
  cleanup_time_minutes?: number;

  @IsOptional()
  @IsNumber()
  max_advance_booking_days?: number;

  @IsOptional()
  @IsNumber()
  min_advance_booking_hours?: number;

  @IsOptional()
  @IsNumber()
  cancellation_policy_hours?: number;

  @IsOptional()
  @IsArray()
  tags?: string[];

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @IsNumber()
  sort_order?: number;
}