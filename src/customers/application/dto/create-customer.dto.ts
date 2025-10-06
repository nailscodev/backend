import { IsNotEmpty, IsEmail, IsString, IsOptional, IsDateString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCustomerDto {
  @ApiProperty({
    description: 'Customer first name',
    example: 'María',
    maxLength: 100,
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  firstName: string;

  @ApiProperty({
    description: 'Customer last name',
    example: 'García',
    maxLength: 100,
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  lastName: string;

  @ApiProperty({
    description: 'Customer email address',
    example: 'maria.garcia@email.com',
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Customer phone number',
    example: '+34123456789',
    maxLength: 20,
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(20)
  phone: string;

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