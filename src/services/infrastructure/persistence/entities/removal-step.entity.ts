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
    tableName: 'removal_step',
    timestamps: true,
})
export class RemovalStepEntity extends Model<RemovalStepEntity> {
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
        unique: true,
        field: 'category_id',
    })
    declare categoryId: string;

    @BelongsTo(() => CategoryEntity, 'categoryId')
    declare category: CategoryEntity;

    @CreatedAt
    @Column({ field: 'createdAt' })
    declare createdAt: Date;

    @UpdatedAt
    @Column({ field: 'updatedAt' })
    declare updatedAt: Date;
}
