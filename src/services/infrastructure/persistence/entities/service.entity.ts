import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { ApiProperty } from '@nestjs/swagger';
import { AddOnEntity } from '../../../../addons/infrastructure/persistence/entities/addon.entity';
import { CategoryEntity } from '../../../../categories/infrastructure/persistence/entities/category.entity';
import { StaffEntity } from '../../../../staff/infrastructure/persistence/entities/staff.entity';

export enum ServiceCategory {
  NAILS = 'NAILS',
  FACIAL = 'FACIAL',
  BODY = 'BODY',
  HAIR = 'HAIR',
  ADDON = 'ADDON',
}

@Table({
  tableName: 'services',
  paranoid: true,
  timestamps: true,
})
export class ServiceEntity extends Model<ServiceEntity> {
  @ApiProperty({
    description: 'The unique identifier for the service',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Column({
    primaryKey: true,
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
  })
  declare id: string;

  @ApiProperty({
    description: 'Service name',
    example: 'Manicure Clásica',
  })
  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  declare name: string;

  @ApiProperty({
    description: 'Service description',
    example: 'Manicure completa con esmaltado tradicional',
  })
  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare description?: string;

  @ApiProperty({
    description: 'Service category type',
    example: 'NAILS',
    enum: ServiceCategory,
  })
  @Column({
    type: DataType.ENUM(...Object.values(ServiceCategory)),
    allowNull: false,
    defaultValue: ServiceCategory.NAILS,
  })
  declare category: ServiceCategory;

  @ApiProperty({
    description: 'Category ID (foreign key)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ForeignKey(() => CategoryEntity)
  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'category_id',
  })
  declare categoryId: string;

  @ApiProperty({
    description: 'Service price in cents',
    example: 2500,
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
    description: 'Service duration in minutes',
    example: 60,
  })
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
    },
  })
  declare duration: number;

  @ApiProperty({
    description: 'Buffer time after service in minutes',
    example: 15,
  })
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 15,
    validate: {
      min: 0,
    },
  })
  declare bufferTime: number;

  @ApiProperty({
    description: 'Whether the service is currently active',
    example: true,
  })
  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  })
  declare isActive: boolean;

  @ApiProperty({
    description: 'Whether the service is marked as popular',
    example: false,
  })
  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  declare isPopular: boolean;

  @ApiProperty({
    description: 'Service requirements or preparations',
    example: ['Uñas cortas', 'Sin esmalte'],
  })
  @Column({
    type: DataType.ARRAY(DataType.STRING),
    allowNull: true,
    defaultValue: [],
  })
  declare requirements?: string[];

  @ApiProperty({
    description: 'Compatible add-on service IDs',
    example: ['123e4567-e89b-12d3-a456-426614174001'],
  })
  @Column({
    type: DataType.ARRAY(DataType.UUID),
    allowNull: true,
    defaultValue: [],
  })
  declare compatibleAddOns?: string[];

  @ApiProperty({
    description: 'Service image URL',
    example: 'https://example.com/service-image.jpg',
  })
  @Column({
    type: DataType.STRING(500),
    allowNull: true,
  })
  declare imageUrl?: string;

  @ApiProperty({
    description: 'Display order for service listings',
    example: 1,
  })
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
  })
  declare displayOrder: number;

  @ApiProperty({
    description: 'Whether the service is eligible for VIP combo (Mani + Pedi)',
    example: true,
  })
  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  declare combo: boolean;

  @ApiProperty({
    description: 'Associated service IDs for combo packages (the services that make up this combo)',
    example: ['123e4567-e89b-12d3-a456-426614174001', '123e4567-e89b-12d3-a456-426614174002'],
  })
  @Column({
    type: DataType.ARRAY(DataType.UUID),
    allowNull: true,
    defaultValue: [],
    field: 'associatedserviceids',
  })
  declare associatedServiceIds?: string[];

  @ApiProperty({
    description: 'When the service was created',
    example: '2025-09-21T13:00:00Z',
  })
  declare createdAt: Date;

  @ApiProperty({
    description: 'When the service was last updated',
    example: '2025-09-21T13:00:00Z',
  })
  declare updatedAt: Date;

  @ApiProperty({
    description: 'When the service was deleted (null if not deleted)',
    example: null,
  })
  declare deletedAt: Date;

  // Associations (defined in associations.ts)
  addOns?: AddOnEntity[];
  staff?: StaffEntity[];

  @BelongsTo(() => CategoryEntity, 'categoryId')
  declare categoryRelation?: CategoryEntity;
}

export default ServiceEntity;