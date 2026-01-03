import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  ForeignKey,
  BelongsTo,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript';
import { CategoryEntity } from './category.entity';
import { LanguageEntity } from '../../../../shared/domain/entities/language.entity';

@Table({
  tableName: 'categories_lang',
  timestamps: true,
})
export class CategoryLangEntity extends Model<CategoryLangEntity> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @ForeignKey(() => CategoryEntity)
  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'category_id',
  })
  declare categoryId: string;

  @ForeignKey(() => LanguageEntity)
  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'language_id',
  })
  declare languageId: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  declare title: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare description: string;

  @BelongsTo(() => CategoryEntity)
  declare category: CategoryEntity;

  @BelongsTo(() => LanguageEntity)
  declare language: LanguageEntity;

  @CreatedAt
  @Column({
    type: DataType.DATE,
    field: 'createdAt',
  })
  declare createdAt: Date;

  @UpdatedAt
  @Column({
    type: DataType.DATE,
    field: 'updatedAt',
  })
  declare updatedAt: Date;
}
