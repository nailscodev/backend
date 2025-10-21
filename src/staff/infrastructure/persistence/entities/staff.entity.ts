import { Table, Column, Model, DataType, Index } from 'sequelize-typescript';
import { ApiProperty } from '@nestjs/swagger';

import { ServiceEntity } from '../../../../services/infrastructure/persistence/entities/service.entity';

export enum StaffRole {
  OWNER = 'OWNER',
  MANAGER = 'MANAGER',
  TECHNICIAN = 'TECHNICIAN',
  RECEPTIONIST = 'RECEPTIONIST'
}

export enum StaffStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ON_VACATION = 'ON_VACATION',
  SICK_LEAVE = 'SICK_LEAVE'
}

@Table({
  tableName: 'staff',
  paranoid: true,
  timestamps: true,
  indexes: [
    { fields: ['email'], unique: true },
    { fields: ['status'] },
    { fields: ['role'] },
  ],
})
export class StaffEntity extends Model<StaffEntity> {
  @ApiProperty({
    description: 'Unique identifier for the staff member',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Column({
    primaryKey: true,
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
  })
  declare id: string;

  @ApiProperty({
    description: 'Staff member first name',
    example: 'Ana',
  })
  @Column({
    type: DataType.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 100],
    },
  })
  firstName: string;

  @ApiProperty({
    description: 'Staff member last name',
    example: 'Rodríguez',
  })
  @Column({
    type: DataType.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 100],
    },
  })
  lastName: string;

  @ApiProperty({
    description: 'Staff member email address',
    example: 'ana.rodriguez@nailsco.com',
  })
  @Index({ unique: true })
  @Column({
    type: DataType.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
      notEmpty: true,
    },
  })
  email: string;

  @ApiProperty({
    description: 'Staff member phone number',
    example: '+34987654321',
  })
  @Column({
    type: DataType.STRING(20),
    allowNull: true,
    validate: {
      notEmpty: true,
    },
  })
  phone?: string;

  @ApiProperty({
    description: 'Staff member role',
    enum: StaffRole,
    example: StaffRole.TECHNICIAN,
  })
  @Index
  @Column({
    type: DataType.ENUM(...Object.values(StaffRole)),
    allowNull: false,
    defaultValue: StaffRole.TECHNICIAN,
  })
  role: StaffRole;

  @ApiProperty({
    description: 'Staff member current status',
    enum: StaffStatus,
    example: StaffStatus.ACTIVE,
  })
  @Index
  @Column({
    type: DataType.ENUM(...Object.values(StaffStatus)),
    allowNull: false,
    defaultValue: StaffStatus.ACTIVE,
  })
  status: StaffStatus;



  @ApiProperty({
    description: 'Staff member specialties',
    example: ['Manicure', 'Nail Art'],
    required: false,
  })
  @Column({
    type: DataType.ARRAY(DataType.STRING),
    allowNull: true,
    defaultValue: [],
  })
  specialties?: string[];

  @ApiProperty({
    description: 'Commission percentage (0-100)',
    example: 30,
    required: false,
  })
  @Column({
    type: DataType.DECIMAL(5, 2),
    allowNull: true,
    validate: {
      min: 0,
      max: 100,
    },
  })
  commissionPercentage?: number;

  @ApiProperty({
    description: 'Hourly rate in cents',
    example: 2000,
    required: false,
  })
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    validate: {
      min: 0,
    },
  })
  hourlyRate?: number;

  @ApiProperty({
    description: 'Date when staff member started working',
    example: '2025-01-15',
    required: false,
  })
  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  startDate?: Date;

  @ApiProperty({
    description: 'Date when staff member stopped working',
    example: null,
    required: false,
  })
  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  endDate?: Date;

  @ApiProperty({
    description: 'Staff member bio or description',
    example: 'Especialista en nail art con 5 años de experiencia',
    required: false,
  })
  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  bio?: string;

  @ApiProperty({
    description: 'Staff member profile picture URL',
    example: 'https://example.com/profile.jpg',
    required: false,
  })
  @Column({
    type: DataType.STRING(500),
    allowNull: true,
    validate: {
      isUrl: true,
    },
  })
  profilePictureUrl?: string;

  @ApiProperty({
    description: 'Notes about the staff member',
    example: 'Prefiere trabajar en horarios de mañana',
    required: false,
  })
  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  notes?: string;

  @ApiProperty({
    description: 'Whether staff member can be booked online',
    example: true,
  })
  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  })
  isBookable: boolean;

  @ApiProperty({
    description: 'When the staff member was created',
    example: '2025-09-21T13:00:00Z',
  })
  declare createdAt: Date;

  @ApiProperty({
    description: 'When the staff member was last updated',
    example: '2025-09-21T13:00:00Z',
  })
  declare updatedAt: Date;

  @ApiProperty({
    description: 'When the staff member was deleted (null if not deleted)',
    example: null,
    required: false,
  })
  declare deletedAt?: Date;

  // Virtual getters for computed properties
  @ApiProperty({
    description: 'Full name of the staff member',
    example: 'Ana Rodríguez',
  })
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  @ApiProperty({
    description: 'Whether the staff member is currently active',
    example: true,
  })
  get isActive(): boolean {
    return this.status === StaffStatus.ACTIVE;
  }

  @ApiProperty({
    description: 'Whether the staff member is available for new bookings',
    example: true,
  })
  get isAvailable(): boolean {
    return this.isActive && this.isBookable;
  }

  // Associations (defined in associations.ts)
  services: ServiceEntity[];
}

export default StaffEntity;