import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { ApiProperty } from '@nestjs/swagger';
import { AddOnEntity } from './addon.entity';

@Table({
    tableName: 'addon_incompatibilities',
    timestamps: true,
})
export class AddonIncompatibilityEntity extends Model<AddonIncompatibilityEntity> {
    @ApiProperty({
        description: 'The unique identifier for the incompatibility',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @Column({
        primaryKey: true,
        type: DataType.UUID,
        defaultValue: DataType.UUIDV4,
    })
    declare id: string;

    @ApiProperty({
        description: 'Add-on ID',
        example: '123e4567-e89b-12d3-a456-426614174001',
    })
    @ForeignKey(() => AddOnEntity)
    @Column({
        type: DataType.UUID,
        allowNull: false,
        field: 'addon_id',
    })
    declare addonId: string;

    @ApiProperty({
        description: 'Incompatible add-on ID',
        example: '123e4567-e89b-12d3-a456-426614174002',
    })
    @ForeignKey(() => AddOnEntity)
    @Column({
        type: DataType.UUID,
        allowNull: false,
        field: 'incompatible_addon_id',
    })
    declare incompatibleAddonId: string;

    @ApiProperty({
        description: 'When the incompatibility was created',
        example: '2025-09-21T13:00:00Z',
    })
    declare createdAt: Date;

    @ApiProperty({
        description: 'When the incompatibility was last updated',
        example: '2025-09-21T13:00:00Z',
    })
    declare updatedAt: Date;

    // Associations
    @BelongsTo(() => AddOnEntity, 'addonId')
    addon?: AddOnEntity;

    @BelongsTo(() => AddOnEntity, 'incompatibleAddonId')
    incompatibleAddon?: AddOnEntity;
}

export default AddonIncompatibilityEntity;
