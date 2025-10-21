import { Table, Column, Model, DataType, ForeignKey } from 'sequelize-typescript';
import { ServiceEntity } from '../../services/infrastructure/persistence/entities/service.entity';
import { AddOnEntity } from '../../addons/infrastructure/persistence/entities/addon.entity';

/**
 * ServiceAddon - Junction table for many-to-many relationship between Services and AddOns
 */
@Table({
    tableName: 'service_addons',
    timestamps: true,
    paranoid: false,
    indexes: [
        {
            unique: true,
            fields: ['service_id', 'addon_id']
        },
        {
            fields: ['service_id']
        },
        {
            fields: ['addon_id']
        }
    ]
})
export class ServiceAddon extends Model<ServiceAddon> {
    @Column({
        primaryKey: true,
        type: DataType.UUID,
        defaultValue: DataType.UUIDV4,
    })
    declare id: string;

    @ForeignKey(() => ServiceEntity)
    @Column({
        type: DataType.UUID,
        allowNull: false,
        field: 'service_id'
    })
    service_id: string;

    @ForeignKey(() => AddOnEntity)
    @Column({
        type: DataType.UUID,
        allowNull: false,
        field: 'addon_id'
    })
    addon_id: string;

    @Column({
        type: DataType.DATE,
        allowNull: false,
        defaultValue: DataType.NOW,
        field: 'created_at'
    })
    declare createdAt: Date;

    @Column({
        type: DataType.DATE,
        allowNull: false,
        defaultValue: DataType.NOW,
        field: 'updated_at'
    })
    declare updatedAt: Date;

    // Associations (defined in associations.ts)
    service?: ServiceEntity;
    addon?: AddOnEntity;
}