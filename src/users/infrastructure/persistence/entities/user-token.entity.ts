import { Table, Column, Model, DataType, Index, ForeignKey } from 'sequelize-typescript';
import { ApiProperty } from '@nestjs/swagger';
import { UserEntity } from './user.entity';

@Table({
  tableName: 'user_tokens',
  timestamps: true,
})
export class UserTokenEntity extends Model<UserTokenEntity> {
  @ApiProperty({ description: 'Primary id' })
  @Column({
    primaryKey: true,
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
  })
  declare id: string;

  @ApiProperty({ description: 'User id' })
  @ForeignKey(() => UserEntity)
  @Index
  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'user_id',
  })
  declare userId: string;

  @ApiProperty({ description: 'Hashed token value' })
  @Column({
    type: DataType.TEXT,
    allowNull: false,
    field: 'token',
  })
  declare token: string;

  @ApiProperty({ description: 'Expiration timestamp' })
  @Index
  @Column({
    type: DataType.DATE,
    allowNull: false,
    field: 'expires_at',
  })
  declare expiresAt: Date;

  @ApiProperty({ description: 'Revoked flag' })
  @Index
  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'revoked',
  })
  declare revoked: boolean;

  @ApiProperty({ description: 'Last used timestamp' })
  @Column({
    type: DataType.DATE,
    allowNull: true,
    field: 'last_used',
  })
  declare lastUsed?: Date;

  @ApiProperty({ description: 'Created at' })
  @Column({ type: DataType.DATE, allowNull: false, field: 'created_at' })
  declare createdAt: Date;

  @ApiProperty({ description: 'Updated at' })
  @Column({ type: DataType.DATE, allowNull: false, field: 'updated_at' })
  declare updatedAt: Date;
}
