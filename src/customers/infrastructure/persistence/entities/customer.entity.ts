import { Table, Column, Model, DataType } from 'sequelize-typescript';
import { ApiProperty } from '@nestjs/swagger';

@Table({
  tableName: 'customers',
  paranoid: true,
  timestamps: true,
})
export class CustomerEntity extends Model<CustomerEntity> {
  @ApiProperty({
    description: 'The unique identifier for the customer',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Column({
    primaryKey: true,
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
  })
  declare id: string;

  @ApiProperty({
    description: 'Tenant ID for multi-tenancy support',
    example: 'nailsandco',
  })
  @Column({
    type: DataType.STRING(255),
    allowNull: false,
    defaultValue: 'nailsandco',
    field: 'tenant_id',
  })
  declare tenantId: string;

  @ApiProperty({
    description: 'Customer first name',
    example: 'María',
  })
  @Column({
    type: DataType.STRING(100),
    allowNull: false,
  })
  declare firstName: string;

  @ApiProperty({
    description: 'Customer last name',
    example: 'García',
  })
  @Column({
    type: DataType.STRING(100),
    allowNull: false,
  })
  declare lastName: string;

  @ApiProperty({
    description: 'Customer email address',
    example: 'maria.garcia@email.com',
  })
  @Column({
    type: DataType.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  })
  declare email: string;

  @ApiProperty({
    description: 'Customer phone number',
    example: '+34123456789',
  })
  @Column({
    type: DataType.STRING(20),
    allowNull: false,
  })
  declare phone: string;

  @ApiProperty({
    description: 'Customer notes or preferences',
    example: 'Prefers afternoon appointments',
    required: false,
  })
  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare notes?: string;

  @ApiProperty({
    description: 'Customer birthdate',
    example: '1990-01-15',
    required: false,
  })
  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  declare birthDate?: Date;

  @ApiProperty({
    description: 'When the customer was created',
    example: '2025-09-21T13:00:00Z',
  })
  declare createdAt: Date;

  @ApiProperty({
    description: 'When the customer was last updated',
    example: '2025-09-21T13:00:00Z',
  })
  declare updatedAt: Date;

  @ApiProperty({
    description: 'When the customer was deleted (null if not deleted)',
    example: null,
  })
  declare deletedAt: Date;
}

export default CustomerEntity;