import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../domain/user.types';

export class UserResponseDto {
  @ApiProperty({
    description: 'User unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Username for login',
    example: 'john_doe',
  })
  username: string;

  @ApiProperty({
    description: 'User email address',
    example: 'john.doe@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'User role in the system',
    enum: UserRole,
    example: UserRole.STAFF,
  })
  role: UserRole;

  @ApiProperty({
    description: 'Display name of the user',
    example: 'John Doe',
  })
  name: string;

  @ApiProperty({
    description: 'User profile avatar URL',
    example: 'https://example.com/avatar.jpg',
    required: false,
  })
  avatar?: string;

  @ApiProperty({
    description: 'Whether the user account is active',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Whether the user is currently active',
    example: true,
  })
  isActiveUser: boolean;

  @ApiProperty({
    description: 'User initials from name',
    example: 'JD',
  })
  initials: string;

  @ApiProperty({
    description: 'Whether user has admin privileges',
    example: false,
  })
  isAdmin: boolean;

  @ApiProperty({
    description: 'Whether user has manager privileges',
    example: false,
  })
  isManager: boolean;

  @ApiProperty({
    description: 'Whether user has staff privileges',
    example: true,
  })
  isStaff: boolean;

  @ApiProperty({
    description: 'Timestamp of last login',
    example: '2025-09-21T13:00:00Z',
    required: false,
  })
  lastLogin?: Date;

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
}