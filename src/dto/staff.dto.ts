import { IsString, IsOptional, IsEmail, IsArray, IsBoolean, IsNumber } from 'class-validator';

export class CreateStaffDto {
  @IsString()
  user_id: string;

  @IsOptional()
  @IsString()
  employee_code?: string;

  @IsString()
  first_name: string;

  @IsString()
  last_name: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  emergency_contact_name?: string;

  @IsOptional()
  @IsString()
  emergency_contact_phone?: string;

  @IsString()
  position: string;

  @IsString()
  department: string;

  @IsOptional()
  @IsString()
  hire_date?: string;

  @IsOptional()
  @IsNumber()
  salary?: number;

  @IsOptional()
  @IsNumber()
  hourly_rate?: number;

  @IsOptional()
  @IsNumber()
  commission_rate?: number;

  @IsOptional()
  @IsArray()
  specializations?: string[];

  @IsOptional()
  @IsArray()
  certifications?: string[];

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsString()
  profile_image_url?: string;

  @IsOptional()
  @IsString()
  preferred_language?: string;

  @IsOptional()
  @IsArray()
  working_hours?: Record<string, any>;

  @IsOptional()
  @IsArray()
  availability_exceptions?: Record<string, any>[];

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsBoolean()
  can_book_appointments?: boolean;

  @IsOptional()
  @IsBoolean()
  can_modify_services?: boolean;

  @IsOptional()
  @IsBoolean()
  can_view_reports?: boolean;

  @IsOptional()
  @IsBoolean()
  can_manage_inventory?: boolean;

  @IsOptional()
  @IsBoolean()
  receive_notifications?: boolean;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

export class UpdateStaffDto {
  @IsOptional()
  @IsString()
  employee_code?: string;

  @IsOptional()
  @IsString()
  first_name?: string;

  @IsOptional()
  @IsString()
  last_name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  emergency_contact_name?: string;

  @IsOptional()
  @IsString()
  emergency_contact_phone?: string;

  @IsOptional()
  @IsString()
  position?: string;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsString()
  hire_date?: string;

  @IsOptional()
  @IsNumber()
  salary?: number;

  @IsOptional()
  @IsNumber()
  hourly_rate?: number;

  @IsOptional()
  @IsNumber()
  commission_rate?: number;

  @IsOptional()
  @IsArray()
  specializations?: string[];

  @IsOptional()
  @IsArray()
  certifications?: string[];

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsString()
  profile_image_url?: string;

  @IsOptional()
  @IsString()
  preferred_language?: string;

  @IsOptional()
  @IsArray()
  working_hours?: Record<string, any>;

  @IsOptional()
  @IsArray()
  availability_exceptions?: Record<string, any>[];

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsBoolean()
  can_book_appointments?: boolean;

  @IsOptional()
  @IsBoolean()
  can_modify_services?: boolean;

  @IsOptional()
  @IsBoolean()
  can_view_reports?: boolean;

  @IsOptional()
  @IsBoolean()
  can_manage_inventory?: boolean;

  @IsOptional()
  @IsBoolean()
  receive_notifications?: boolean;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}