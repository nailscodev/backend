import { Table, Column, Model, DataType, Index } from 'sequelize-typescript';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../../domain/user.types';

// Re-export for convenience
export { UserRole };@Table({
  tableName: 'users',
  paranoid: false,
  timestamps: true,
  indexes: [
    { fields: ['email'], unique: true },
    { fields: ['username'], unique: true },
    { fields: ['is_active'] },
    { fields: ['role'] },
    { fields: ['last_login'] },
  ],
})
export class UserEntity extends Model<UserEntity> {
  @ApiProperty({
    description: 'Unique identifier for the user',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Column({
    primaryKey: true,
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
  })
  declare id: string;

  @ApiProperty({
    description: 'Username for login',
    example: 'john_doe',
  })
  @Index({ unique: true })
  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true,
      len: [3, 50],
    },
  })
  declare username: string;

  @ApiProperty({
    description: 'User email address',
    example: 'john.doe@example.com',
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
  declare email: string;

  @ApiProperty({
    description: 'Hashed password',
    example: '$2b$10$...',
    writeOnly: true,
  })
  @Column({
    type: DataType.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true,
    },
  })
  declare password: string;

  @ApiProperty({
    description: 'User role in the system',
    enum: UserRole,
    example: UserRole.STAFF,
  })
  @Index
  @Column({
    type: DataType.ENUM(...Object.values(UserRole)),
    allowNull: false,
    defaultValue: UserRole.STAFF,
  })
  declare role: UserRole;

  @ApiProperty({
    description: 'Display name of the user',
    example: 'John Doe',
  })
  @Column({
    type: DataType.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 100],
    },
  })
  declare name: string;

  @ApiProperty({
    description: 'User profile avatar URL',
    example: 'https://example.com/avatar.jpg',
    required: false,
  })
  @Column({
    type: DataType.STRING(255),
    allowNull: true,
    validate: {
      isUrl: true,
    },
  })
  declare avatar?: string;

  @ApiProperty({
    description: 'Whether the user account is active',
    example: true,
  })
  @Index
  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    field: 'is_active', // Map to database column name
  })
  declare isActive: boolean;

  @ApiProperty({
    description: 'Timestamp of last login',
    example: '2025-09-21T13:00:00Z',
    required: false,
  })
  @Index
  @Column({
    type: DataType.DATE,
    allowNull: true,
    field: 'last_login', // Map to database column name
  })
  declare lastLogin?: Date;

  @ApiProperty({
    description: 'When the user was created',
    example: '2025-09-21T13:00:00Z',
  })
  @Column({
    type: DataType.DATE,
    allowNull: false,
    field: 'created_at', // Map to database column name
  })
  declare createdAt: Date;

  @ApiProperty({
    description: 'When the user was last updated',
    example: '2025-09-21T13:00:00Z',
  })
  @Column({
    type: DataType.DATE,
    allowNull: false,
    field: 'updated_at', // Map to database column name
  })
  declare updatedAt: Date;

  // Virtual getters for computed properties
  @ApiProperty({
    description: 'Whether the user is currently active',
    example: true,
  })
  get isActiveUser(): boolean {
    return this.isActive === true;
  }

  @ApiProperty({
    description: 'User initials from name',
    example: 'JD',
  })
  get initials(): string {
    return this.name
      .split(' ')
      .map(name => name.charAt(0).toUpperCase())
      .join('');
  }

  @ApiProperty({
    description: 'Whether user has admin privileges',
    example: false,
  })
  get isAdmin(): boolean {
    return this.role === UserRole.ADMIN;
  }

  @ApiProperty({
    description: 'Whether user has manager privileges',
    example: false,
  })
  get isManager(): boolean {
    return this.role === UserRole.MANAGER || this.role === UserRole.ADMIN;
  }

  @ApiProperty({
    description: 'Whether user has staff privileges',
    example: true,
  })
  get isStaff(): boolean {
    return this.role === UserRole.STAFF || this.role === UserRole.MANAGER || this.role === UserRole.ADMIN;
  }
}