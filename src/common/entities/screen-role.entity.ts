import { Table, Column, Model, DataType, PrimaryKey, Default, CreatedAt, UpdatedAt } from 'sequelize-typescript';
import { UserRole } from './user.entity';

@Table({
  tableName: 'screen_roles',
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
})
export class ScreenRoleEntity extends Model<ScreenRoleEntity> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  declare id: string;

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    field: 'screen_id', // Explicitly map to database column name
  })
  declare screenId: string;

  @Column({
    type: DataType.ENUM('admin', 'manager', 'reception', 'staff', 'owner'),
    allowNull: false,
  })
  declare role: UserRole;

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