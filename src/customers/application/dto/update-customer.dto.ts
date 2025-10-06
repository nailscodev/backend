import { IsOptional, IsString, IsEmail, IsDateString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateCustomerDto {
  @ApiProperty({
    description: 'Customer first name',
    example: 'María',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  firstName?: string;

  @ApiProperty({
    description: 'Customer last name',
    example: 'García',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastName?: string;

  @ApiProperty({
    description: 'Customer email address',
    example: 'maria.garcia@email.com',
    required: false,
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({
    description: 'Customer phone number',
    example: '+34123456789',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiProperty({
    description: 'Customer notes or preferences',
    example: 'Prefers afternoon appointments',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({
    description: 'Customer birthdate',
    example: '1990-01-15',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  birthDate?: string;
}

export class SearchCustomersDto {
  @ApiProperty({
    description: 'Search query (name, email, or phone)',
    example: 'María',
  })
  @IsString()
  query: string;
}