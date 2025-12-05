import { Table, Column, Model, DataType } from 'sequelize-typescript';
import { ApiProperty } from '@nestjs/swagger';
import { ServiceEntity } from '../../../../services/infrastructure/persistence/entities/service.entity';

@Table({
  tableName: 'addons',
  paranoid: true,
  timestamps: true,
})
export class AddOnEntity extends Model<AddOnEntity> {
  @ApiProperty({
    description: 'The unique identifier for the add-on',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Column({
    primaryKey: true,
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
  })
  declare id: string;

  @ApiProperty({
    description: 'Add-on name',
    example: 'Nail Art Design',
  })
  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  declare name: string;

  @ApiProperty({
    description: 'Add-on description',
    example: 'Beautiful custom nail art designs',
  })
  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare description?: string;

  @ApiProperty({
    description: 'Add-on price in cents',
    example: 1500,
  })
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    validate: {
      min: 0,
    },
  })
  declare price: number;

  @ApiProperty({
    description: 'Additional time in minutes for this add-on',
    example: 15,
  })
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0,
    },
  })
  declare additionalTime: number;

  @ApiProperty({
    description: 'Whether the add-on is currently active',
    example: true,
  })
  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  })
  declare isActive: boolean;

  @ApiProperty({
    description: 'Display order for sorting',
    example: 1,
  })
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
  })
  declare displayOrder: number;

  @ApiProperty({
    description: 'Whether this add-on is a removal service',
    example: false,
  })
  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  declare removal: boolean;

  @ApiProperty({
    description: 'Array of service IDs this add-on is compatible with',
    example: ['123e4567-e89b-12d3-a456-426614174001', '123e4567-e89b-12d3-a456-426614174002'],
  })
  @Column({
    type: DataType.ARRAY(DataType.UUID),
    allowNull: true,
  })
  declare compatibleServiceIds?: string[];

  @ApiProperty({
    description: 'Image URL for the add-on',
    example: 'https://example.com/nail-art.jpg',
  })
  @Column({
    type: DataType.STRING(500),
    allowNull: true,
  })
  declare imageUrl?: string;

  @ApiProperty({
    description: 'When the add-on was created',
    example: '2025-09-21T13:00:00Z',
  })
  declare createdAt: Date;

  @ApiProperty({
    description: 'When the add-on was last updated',
    example: '2025-09-21T13:00:00Z',
  })
  declare updatedAt: Date;

  @ApiProperty({
    description: 'When the add-on was deleted (null if not deleted)',
    example: null,
  })
  declare deletedAt: Date;

  // Associations (defined in associations.ts)
  services?: ServiceEntity[];
}

export default AddOnEntity;