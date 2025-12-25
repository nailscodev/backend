import { Table, Column, Model, DataType } from 'sequelize-typescript';
import { ApiProperty } from '@nestjs/swagger';

@Table({
  tableName: 'combo_eligible',
  timestamps: true,
})
export class ComboEligibleEntity extends Model<ComboEligibleEntity> {
  @ApiProperty({
    description: 'The unique identifier for the combo eligible entry',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Column({
    primaryKey: true,
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
  })
  declare id: string;

  @ApiProperty({
    description: 'Name of the combo eligibility rule',
    example: 'Mani + Pedi Combo',
  })
  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  declare name: string;

  @ApiProperty({
    description: 'Description of the combo',
    example: 'Any manicure combined with any pedicure service',
  })
  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare description?: string;

  @ApiProperty({
    description: 'Service IDs that when matched in cart, activate the VIP combo step',
    example: ['123e4567-e89b-12d3-a456-426614174001', '123e4567-e89b-12d3-a456-426614174002'],
  })
  @Column({
    type: DataType.ARRAY(DataType.UUID),
    allowNull: false,
  })
  declare serviceIds: string[];

  @ApiProperty({
    description: 'Extra price for the combo in cents',
    example: 1500,
  })
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
  })
  declare extraPrice: number;

  @ApiProperty({
    description: 'ID of the suggested combo service to offer when these services are in cart',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  declare suggestedComboId?: string;

  @ApiProperty({
    description: 'Whether this combo rule is active',
    example: true,
  })
  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  })
  declare isActive: boolean;

  @ApiProperty({
    description: 'When the entry was created',
    example: '2025-09-21T13:00:00Z',
  })
  declare createdAt: Date;

  @ApiProperty({
    description: 'When the entry was last updated',
    example: '2025-09-21T13:00:00Z',
  })
  declare updatedAt: Date;
}

export default ComboEligibleEntity;
