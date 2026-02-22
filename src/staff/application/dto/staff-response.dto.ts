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
    description: 'Days of the week the staff member works',
    example: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    required: false,
    type: [String],
  })
  workingDays?: string[];

  @ApiProperty({
    description: 'Shift schedules for the staff member',
    example: [{ shiftStart: '09:00', shiftEnd: '12:00' }, { shiftStart: '13:00', shiftEnd: '19:00' }],
    required: false,
  })
  shifts?: Array<{ shiftStart: string; shiftEnd: string }>;

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

  @ApiProperty({
    description: 'List of services this staff member provides',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        duration: { type: 'number' },
        price: { type: 'number' }
      }
    },
    required: false,
  })
  services?: Array<{
    id: string;
    name: string;
    duration: number;
    price: number;
  }>;

  @ApiProperty({
    description: 'Total number of services this staff member can provide',
    example: 5,
    required: false,
  })
  servicesCount?: number;

  @ApiProperty({
    description: 'Number of pending bookings for this staff member',
    example: 3,
    required: false,
  })
  pendingBookingsCount?: number;

  @ApiProperty({
    description: 'Number of completed bookings for this staff member',
    example: 15,
    required: false,
  })
  completedBookingsCount?: number;
}