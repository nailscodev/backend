import { IsString, IsEmail, IsOptional, IsEnum, IsArray, IsNumber, IsBoolean, IsDateString, Min, Max, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { StaffRole, StaffStatus } from '../../domain/staff.types';

export class CreateStaffDto {
  @ApiProperty({
    description: 'Staff member first name',
    example: 'Ana',
    minLength: 1,
    maxLength: 100,
  })
  @IsString()
  @Length(1, 100, { message: 'First name must be between 1 and 100 characters' })
  @Transform(({ value }) => value?.trim())
  firstName: string;

  @ApiProperty({
    description: 'Staff member last name',
    example: 'Rodríguez',
    minLength: 1,
    maxLength: 100,
  })
  @IsString()
  @Length(1, 100, { message: 'Last name must be between 1 and 100 characters' })
  @Transform(({ value }) => value?.trim())
  lastName: string;

  @ApiProperty({
    description: 'Staff member email address',
    example: 'ana.rodriguez@nailsco.com',
  })
  @IsEmail({}, { message: 'Invalid email format' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string;

  @ApiProperty({
    description: 'Staff member phone number',
    example: '+34987654321',
  })
  @IsString()
  @Length(1, 20, { message: 'Phone must be between 1 and 20 characters' })
  @Transform(({ value }) => value?.trim())
  phone: string;

  @ApiProperty({
    description: 'Staff member role',
    enum: StaffRole,
    example: StaffRole.TECHNICIAN,
    required: false,
  })
  @IsOptional()
  @IsEnum(StaffRole, { message: 'Invalid staff role' })
  role?: StaffRole;

  @ApiProperty({
    description: 'Staff member status',
    enum: StaffStatus,
    example: StaffStatus.ACTIVE,
    required: false,
  })
  @IsOptional()
  @IsEnum(StaffStatus, { message: 'Invalid staff status' })
  status?: StaffStatus;

  @ApiProperty({
    description: 'Services this staff member can perform',
    example: ['123e4567-e89b-12d3-a456-426614174001'],
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  serviceIds?: string[];

  @ApiProperty({
    description: 'Staff member specialties',
    example: ['Manicure', 'Nail Art'],
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => value?.map((item: string) => item?.trim()).filter(Boolean))
  specialties?: string[];

  @ApiProperty({
    description: 'Commission percentage (0-100)',
    example: 30,
    minimum: 0,
    maximum: 100,
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Commission percentage must be a number' })
  @Min(0, { message: 'Commission percentage cannot be negative' })
  @Max(100, { message: 'Commission percentage cannot exceed 100' })
  commissionPercentage?: number;

  @ApiProperty({
    description: 'Hourly rate in cents',
    example: 2000,
    minimum: 0,
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Hourly rate must be a number' })
  @Min(0, { message: 'Hourly rate cannot be negative' })
  hourlyRate?: number;

  @ApiProperty({
    description: 'Date when staff member started working',
    example: '2025-01-15',
    format: 'date',
    required: false,
  })
  @IsOptional()
  @IsDateString({}, { message: 'Invalid start date format' })
  startDate?: string;

  @ApiProperty({
    description: 'Staff member bio or description',
    example: 'Especialista en nail art con 5 años de experiencia',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  bio?: string;

  @ApiProperty({
    description: 'Staff member profile picture URL',
    example: 'https://example.com/profile.jpg',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  profilePictureUrl?: string;

  @ApiProperty({
    description: 'Notes about the staff member',
    example: 'Prefiere trabajar en horarios de mañana',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  notes?: string;

  @ApiProperty({
    description: 'Whether staff member can be booked online',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isBookable?: boolean;
}