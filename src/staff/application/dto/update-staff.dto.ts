import { PartialType } from '@nestjs/swagger';
import { CreateStaffDto } from './create-staff.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsDateString, IsNumber, IsString } from 'class-validator';

export class UpdateStaffDto extends PartialType(CreateStaffDto) {
  @ApiProperty({
    description: 'Date when staff member stopped working',
    example: '2025-12-31',
    format: 'date',
    required: false,
  })
  @IsOptional()
  @IsDateString({}, { message: 'Invalid end date format' })
  endDate?: string;

  // Explicitly redeclared to work around TypeScript's inability to resolve
  // PartialType-inherited properties in strict tsconfig environments.
  @IsOptional() @IsNumber() hourlyRate?: number;
  @IsOptional() @IsString() bio?: string;
  @IsOptional() @IsString() profilePictureUrl?: string;
  @IsOptional() @IsString() notes?: string;
}