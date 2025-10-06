import { ApiProperty } from '@nestjs/swagger';

export class CustomerResponseDto {
  @ApiProperty({
    description: 'Customer ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Customer first name',
    example: 'María',
  })
  firstName: string;

  @ApiProperty({
    description: 'Customer last name',
    example: 'García',
  })
  lastName: string;

  @ApiProperty({
    description: 'Customer email address',
    example: 'maria.garcia@email.com',
  })
  email: string;

  @ApiProperty({
    description: 'Customer phone number',
    example: '+34123456789',
  })
  phone: string;

  @ApiProperty({
    description: 'Customer notes or preferences',
    example: 'Prefers afternoon appointments',
    required: false,
  })
  notes?: string;

  @ApiProperty({
    description: 'Customer birthdate',
    example: '1990-01-15',
    required: false,
  })
  birthDate?: Date;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2025-09-21T13:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2025-09-21T13:00:00Z',
  })
  updatedAt: Date;
}