import { Table, Column, Model, DataType } from 'sequelize-typescript';
import { ApiProperty } from '@nestjs/swagger';

export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  RECEPTION = 'reception',
  STAFF = 'staff',
  OWNER = 'owner',
}

@Table({
  tableName: 'users',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class UserEntity extends Model<UserEntity> {
  @ApiProperty({
    description: 'The unique identifier for the user',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Column({
    primaryKey: true,
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
  })
  declare id: string;

  @ApiProperty({
    description: 'Unique username',
    example: 'admin123',
  })
  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    unique: true,
  })
  username: string;

  @ApiProperty({
    description: 'User email address',
    example: 'admin@nailsco.com',
  })
  @Column({
    type: DataType.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  })
  email: string;

  @ApiProperty({
    description: 'Hashed password',
    example: '$2b$10$...',
  })
  @Column({
    type: DataType.STRING(255),
    allowNull: false,
    field: 'password',
  })
  password: string;

  @ApiProperty({
    description: 'User role',
    enum: UserRole,
    example: UserRole.STAFF,
  })
  @Column({
    type: DataType.ENUM(...Object.values(UserRole)),
    allowNull: false,
    defaultValue: UserRole.STAFF,
  })
  role: UserRole;

  @ApiProperty({
    description: 'User first name',
    example: 'Juan',
  })
  @Column({
    type: DataType.STRING(100),
    allowNull: false,
  })
  name: string;

  @ApiProperty({
    description: 'User avatar URL',
    example: 'https://example.com/avatar.jpg',
  })
  @Column({
    type: DataType.STRING(255),
    allowNull: true,
  })
  avatar?: string;

  @ApiProperty({
    description: 'Whether user is active',
    example: true,
  })
  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  })
  is_active: boolean;

  @ApiProperty({
    description: 'Last login timestamp',
    example: '2025-09-21T13:00:00Z',
  })
  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  last_login?: Date;

  @ApiProperty({
    description: 'When the user was created',
    example: '2025-09-21T13:00:00Z',
  })
  declare created_at: Date;

  @ApiProperty({
    description: 'When the user was last updated',
    example: '2025-09-21T13:00:00Z',
  })
  declare updated_at: Date;
}

export default UserEntity;