import {
    Table,
    Column,
    Model,
    DataType,
    ForeignKey,
    BelongsTo,
    CreatedAt,
    UpdatedAt,
} from 'sequelize-typescript';
import { CategoryEntity } from '../../../../categories/infrastructure/persistence/entities/category.entity';

@Table({
    tableName: 'service_incompatibilities',
    timestamps: true,
})
export class ServiceIncompatibilityEntity extends Model<ServiceIncompatibilityEntity> {
    @Column({
        type: DataType.UUID,
        defaultValue: DataType.UUIDV4,
        primaryKey: true,
    })
    declare id: string;

    @ForeignKey(() => CategoryEntity)
    @Column({
        type: DataType.UUID,
        allowNull: false,
        field: 'category_id',
    })
    declare categoryId: string;

    @BelongsTo(() => CategoryEntity, 'categoryId')
    declare category: CategoryEntity;

    @ForeignKey(() => CategoryEntity)
    @Column({
        type: DataType.UUID,
        allowNull: false,
        field: 'incompatible_category_id',
    })
    declare incompatibleCategoryId: string;

    @BelongsTo(() => CategoryEntity, 'incompatibleCategoryId')
    declare incompatibleCategory: CategoryEntity;

    @CreatedAt
    @Column({ field: 'created_at' })
    declare createdAt: Date;

    @UpdatedAt
    @Column({ field: 'updated_at' })
    declare updatedAt: Date;
}
