import { ApiProperty } from '@nestjs/swagger';
import { StaffRole, StaffStatus } from '../../domain/staff.types';

export class StaffResponseDto {
  @ApiProperty({
    description: 'Staff member unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Staff member first name',
    example: 'Ana',
  })
  firstName: string;

  @ApiProperty({
    description: 'Staff member last name',
    example: 'Rodríguez',
  })
  lastName: string;

  @ApiProperty({
    description: 'Staff member full name',
    example: 'Ana Rodríguez',
  })
  fullName: string;

  @ApiProperty({
    description: 'Staff member email address',
    example: 'ana.rodriguez@nailsco.com',
  })
  email: string;

  @ApiProperty({
    description: 'Staff member phone number',
    example: '+34987654321',
    required: false,
  })
  phone?: string;

  @ApiProperty({
    description: 'Staff member role',
    enum: StaffRole,
    example: StaffRole.TECHNICIAN,
  })
  role: StaffRole;

  @ApiProperty({
    description: 'Staff member status',
    enum: StaffStatus,
    example: StaffStatus.ACTIVE,
  })
  status: StaffStatus;

  @ApiProperty({
    description: 'Whether the staff member is currently active',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Whether the staff member is available for bookings',
    example: true,
  })
  isAvailable: boolean;



  @ApiProperty({
    description: 'Staff member specialties',
    example: ['Manicure', 'Nail Art'],
    required: false,
    type: [String],
  })
  specialties?: string[];

  @ApiProperty({
    description: 'Commission percentage',
    example: 30,
    required: false,
  })
  commissionPercentage?: number;

  @ApiProperty({
    description: 'Hourly rate in cents',
    example: 2000,
    required: false,
  })
  hourlyRate?: number;

  @ApiProperty({
    description: 'Date when staff member started working',
    example: '2025-01-15T00:00:00.000Z',
    required: false,
  })
  startDate?: Date;

  @ApiProperty({
    description: 'Date when staff member stopped working',
    example: null,
    required: false,
  })
  endDate?: Date;

  @ApiProperty({
    description: 'Staff member bio or description',
    example: 'Especialista en nail art con 5 años de experiencia',
    required: false,
  })
  bio?: string;

  @ApiProperty({
    description: 'Staff member profile picture URL',
    example: 'https://example.com/profile.jpg',
    required: false,
  })
  profilePictureUrl?: string;

  @ApiProperty({
    description: 'Notes about the staff member',
    example: 'Prefiere trabajar en horarios de mañana',
    required: false,
  })
  notes?: string;

  @ApiProperty({
    description: 'Whether staff member can be booked online',
    example: true,
  })
  isBookable: boolean;

  @ApiProperty({
    description: 'Date when record was created',
    example: '2025-01-15T10:30:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Date when record was last updated',
    example: '2025-01-15T15:45:00.000Z',
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'Date when record was deleted (null if not deleted)',
    example: null,
    required: false,
  })
  deletedAt?: Date;
}