import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsOptional,
  Length,
  IsEnum,
  IsNumber,
  Min,
  Max,
  IsDateString,
  IsArray,
  IsBoolean,
  ValidateNested,
  Matches,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  Validate,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { StaffRole, StaffStatus } from '../../domain/staff.types';

// Validador personalizado para verificar que shiftEnd sea posterior a shiftStart
@ValidatorConstraint({ name: 'isTimeAfter', async: false })
class IsTimeAfterConstraint implements ValidatorConstraintInterface {
  validate(shiftEnd: string, args: ValidationArguments): boolean {
    const obj = args.object as { shiftStart: string; shiftEnd: string };
    if (!obj.shiftStart || !shiftEnd) return true;
    
    const startTime = new Date(`1970-01-01 ${obj.shiftStart}`);
    const endTime = new Date(`1970-01-01 ${shiftEnd}`);
    return endTime > startTime;
  }

  defaultMessage(): string {
    return 'shiftEnd must be after shiftStart';
  }
}

// DTO para validar cada shift individual
export class ShiftDto {
  @ApiProperty({
    description: 'Shift start time in HH:MM format (24-hour)',
    example: '09:00',
    pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$',
  })
  @IsString()
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'shiftStart must be in HH:MM format (e.g., 09:00)',
  })
  shiftStart: string;

  @ApiProperty({
    description: 'Shift end time in HH:MM format (24-hour)',
    example: '17:00',
    pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$',
  })
  @IsString()
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'shiftEnd must be in HH:MM format (e.g., 17:00)',
  })
  @Validate(IsTimeAfterConstraint)
  shiftEnd: string;
}

export class CreateStaffDto {
  @ApiProperty({
    description: 'Staff member first name',
    example: 'Ana',
    minLength: 1,
    maxLength: 100,
  })
  @IsString()
  @Length(1, 100, { message: 'First name must be between 1 and 100 characters' })
  @Transform(({ value }: { value: any }): string => typeof value === 'string' ? value.trim() : value)
  firstName: string;

  @ApiProperty({
    description: 'Staff member last name',
    example: 'Rodríguez',
    minLength: 1,
    maxLength: 100,
  })
  @IsString()
  @Length(1, 100, { message: 'Last name must be between 1 and 100 characters' })
  @Transform(({ value }: { value: any }): string => typeof value === 'string' ? value.trim() : value)
  lastName: string;

  @ApiProperty({
    description: 'Staff member email address',
    example: 'ana.rodriguez@nailsco.com',
  })
  @IsEmail({}, { message: 'Invalid email format' })
  @Transform(({ value }: { value: any }): string => typeof value === 'string' ? value.toLowerCase().trim() : value)
  email: string;

  @ApiProperty({
    description: 'Staff member phone number',
    example: '+34987654321',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: any }): string => typeof value === 'string' ? value.trim() : value)
  phone?: string;

  @ApiProperty({
    description: 'Staff member role',
    enum: StaffRole,
    example: StaffRole.TECHNICIAN,
  })
  @IsEnum(StaffRole, { message: 'Invalid staff role' })
  role: StaffRole;

  @ApiProperty({
    description: 'Staff member status',
    enum: StaffStatus,
    example: StaffStatus.ACTIVE,
    required: false,
  })
  @IsOptional()
  @IsEnum(StaffStatus, { message: 'Invalid staff status' })
  status?: StaffStatus = StaffStatus.ACTIVE;

  @ApiProperty({
    description: 'Array of service IDs that the staff member can perform',
    example: ['uuid-1', 'uuid-2'],
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
  specialties?: string[];

  @ApiProperty({
    description: 'Days of the week the staff member works (Mon, Tue, Wed, Thu, Fri, Sat, Sun)',
    example: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  workingDays?: string[];

  @ApiProperty({
    description: 'Shift schedules. Each shift has shiftStart and shiftEnd in HH:MM format.',
    example: [{ shiftStart: '09:00', shiftEnd: '12:00' }, { shiftStart: '13:00', shiftEnd: '19:00' }],
    required: false,
    type: [ShiftDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ShiftDto)
  shifts?: ShiftDto[];

  @ApiProperty({
    description: 'Commission percentage (0-100)',
    example: 30,
    minimum: 0,
    maximum: 100,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'Commission percentage must be at least 0' })
  @Max(100, { message: 'Commission percentage must be at most 100' })
  commissionPercentage?: number;

  @ApiProperty({
    description: 'Hourly rate in cents',
    example: 2000,
    minimum: 0,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'Hourly rate must be at least 0' })
  hourlyRate?: number;

  @ApiProperty({
    description: 'Date when staff member started working',
    example: '2025-01-15',
    required: false,
  })
  @IsOptional()
  @IsDateString({}, { message: 'Invalid start date format. Use YYYY-MM-DD' })
  startDate?: string;

  @ApiProperty({
    description: 'Staff member bio or description',
    example: 'Especialista en nail art con 5 años de experiencia',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(0, 500, { message: 'Bio must be at most 500 characters' })
  @Transform(({ value }: { value: any }): string => typeof value === 'string' ? value.trim() : value)
  bio?: string;

  @ApiProperty({
    description: 'Staff member profile picture URL',
    example: 'https://example.com/profile.jpg',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: any }): string => typeof value === 'string' ? value.trim() : value)
  profilePictureUrl?: string;

  @ApiProperty({
    description: 'Notes about the staff member',
    example: 'Prefiere trabajar en horarios de mañana',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(0, 1000, { message: 'Notes must be at most 1000 characters' })
  @Transform(({ value }: { value: any }): string => typeof value === 'string' ? value.trim() : value)
  notes?: string;

  @ApiProperty({
    description: 'Whether staff member can be booked online',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isBookable?: boolean = true;
}