import { Table, Column, Model, DataType } from 'sequelize-typescript';

export type TestType = 'load' | 'stress' | 'spike' | 'soak';
export type TestStatus = 'running' | 'completed' | 'failed' | 'cancelled';

@Table({
  tableName: 'performance_test_runs',
  timestamps: true,
})
export class PerformanceTestRunEntity extends Model<PerformanceTestRunEntity> {
  @Column({
    primaryKey: true,
    type: DataType.UUID,
    allowNull: false,
  })
  declare id: string;

  @Column({
    type: DataType.STRING(20),
    allowNull: false,
  })
  declare type: TestType;

  @Column({
    type: DataType.STRING(20),
    allowNull: false,
    defaultValue: 'running',
  })
  declare status: TestStatus;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    field: 'started_at',
  })
  declare startedAt: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    field: 'completed_at',
  })
  declare completedAt: Date | null;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
  })
  declare progress: number;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare scenario: string | null;

  @Column({
    type: DataType.JSON,
    allowNull: true,
    field: 'target_endpoints',
  })
  declare targetEndpoints: string[] | null;

  @Column({
    type: DataType.JSON,
    allowNull: true,
  })
  declare summary: Record<string, unknown> | null;
}
