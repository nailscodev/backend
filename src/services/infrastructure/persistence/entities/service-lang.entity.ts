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
import { ServiceEntity } from './service.entity';
import { LanguageEntity } from '../../../../shared/domain/entities/language.entity';

@Table({
  tableName: 'services_lang',
  timestamps: true,
})
export class ServiceLangEntity extends Model<ServiceLangEntity> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @ForeignKey(() => ServiceEntity)
  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'service_id',
  })
  declare serviceId: string;

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

  @BelongsTo(() => ServiceEntity)
  declare service: ServiceEntity;

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
