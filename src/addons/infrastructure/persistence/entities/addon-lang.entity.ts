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
import { AddOnEntity } from './addon.entity';
import { LanguageEntity } from '../../../../shared/domain/entities/language.entity';

@Table({
  tableName: 'addons_lang',
  timestamps: true,
})
export class AddOnLangEntity extends Model<AddOnLangEntity> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @ForeignKey(() => AddOnEntity)
  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'addon_id',
  })
  declare addonId: string;

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

  @BelongsTo(() => AddOnEntity)
  declare addon: AddOnEntity;

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
