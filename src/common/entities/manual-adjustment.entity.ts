import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  AllowNull,
  ForeignKey,
  BelongsTo,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript';
import { UserEntity } from '../../users/infrastructure/persistence/entities/user.entity';

export enum AdjustmentType {
  INCOME = 'income',
  EXPENSE = 'expense',
}

export enum PaymentMethod {
  CASH = 'CASH',
  CARD = 'CARD',
}

@Table({
  tableName: 'manual_adjustments',
  timestamps: true,
})
export class ManualAdjustment extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @AllowNull(false)
  @Column({
    type: DataType.STRING(20),
    validate: {
      isIn: [Object.values(AdjustmentType)],
    },
  })
  declare type: AdjustmentType;

  @AllowNull(false)
  @Column(DataType.TEXT)
  declare description: string;

  @AllowNull(false)
  @Column({
    type: DataType.DECIMAL(10, 2),
    validate: {
      min: 0.01,
    },
  })
  declare amount: number;

  @AllowNull(false)
  @Column({
    type: DataType.STRING(20),
    field: 'paymentMethod',
    validate: {
      isIn: [Object.values(PaymentMethod)],
    },
  })
  declare paymentMethod: PaymentMethod;

  @ForeignKey(() => UserEntity)
  @Column({
    type: DataType.UUID,
    field: 'createdBy',
  })
  declare createdBy?: string;

  @BelongsTo(() => UserEntity)
  declare creator?: UserEntity;

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
