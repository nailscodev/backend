import { Table, Column, Model, DataType } from 'sequelize-typescript';
import { ApiProperty } from '@nestjs/swagger';

export enum ReportType {
  DAILY_SALES = 'DAILY_SALES',
  WEEKLY_SALES = 'WEEKLY_SALES',
  MONTHLY_SALES = 'MONTHLY_SALES',
  SERVICE_PERFORMANCE = 'SERVICE_PERFORMANCE',
  STAFF_PERFORMANCE = 'STAFF_PERFORMANCE',
  CUSTOMER_ANALYTICS = 'CUSTOMER_ANALYTICS',
  BOOKING_ANALYTICS = 'BOOKING_ANALYTICS',
  REVENUE_ANALYTICS = 'REVENUE_ANALYTICS',
  CANCELLATION_REPORT = 'CANCELLATION_REPORT',
  POPULAR_SERVICES = 'POPULAR_SERVICES'
}

export enum ReportStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

@Table({
  tableName: 'reports',
  paranoid: true,
  timestamps: true,
})
export class ReportEntity extends Model<ReportEntity> {
  @ApiProperty({
    description: 'The unique identifier for the report',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Column({
    primaryKey: true,
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
  })
  declare id: string;

  @ApiProperty({
    description: 'The tenant ID that owns this report',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Column({
    type: DataType.STRING,
    allowNull: false,
    field: 'tenant_id',
  })
  tenantId: string;

  @ApiProperty({
    description: 'Type of report',
    enum: ReportType,
    example: ReportType.MONTHLY_SALES,
  })
  @Column({
    type: DataType.ENUM(...Object.values(ReportType)),
    allowNull: false,
  })
  type: ReportType;

  @ApiProperty({
    description: 'Report status',
    enum: ReportStatus,
    example: ReportStatus.COMPLETED,
  })
  @Column({
    type: DataType.ENUM(...Object.values(ReportStatus)),
    allowNull: false,
    defaultValue: ReportStatus.PENDING,
  })
  status: ReportStatus;

  @ApiProperty({
    description: 'Report title',
    example: 'Ventas de Septiembre 2025',
  })
  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  title: string;

  @ApiProperty({
    description: 'Report description',
    example: 'Informe detallado de ventas del mes de septiembre',
  })
  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  description?: string;

  @ApiProperty({
    description: 'Start date for the report period',
    example: '2025-09-01',
  })
  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  startDate: Date;

  @ApiProperty({
    description: 'End date for the report period',
    example: '2025-09-30',
  })
  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  endDate: Date;

  @ApiProperty({
    description: 'Report parameters and filters',
    example: { serviceIds: ['123'], staffIds: ['456'], includeMetrics: true },
  })
  @Column({
    type: DataType.JSONB,
    allowNull: true,
    defaultValue: {},
  })
  parameters?: Record<string, any>;

  @ApiProperty({
    description: 'Generated report data',
    example: { 
      totalRevenue: 50000, 
      totalBookings: 150, 
      averageBookingValue: 333,
      topServices: [{ name: 'Manicure', revenue: 20000 }]
    },
  })
  @Column({
    type: DataType.JSONB,
    allowNull: true,
  })
  data?: Record<string, any>;

  @ApiProperty({
    description: 'Report summary metrics',
    example: {
      totalRevenue: 50000,
      totalBookings: 150,
      totalCustomers: 75,
      averageBookingValue: 333
    },
  })
  @Column({
    type: DataType.JSONB,
    allowNull: true,
  })
  summary?: Record<string, any>;

  @ApiProperty({
    description: 'URL to generated report file',
    example: 'https://storage.example.com/reports/monthly-sales-sept-2025.pdf',
  })
  @Column({
    type: DataType.STRING(500),
    allowNull: true,
  })
  fileUrl?: string;

  @ApiProperty({
    description: 'Report file type',
    example: 'PDF',
  })
  @Column({
    type: DataType.STRING(10),
    allowNull: true,
  })
  fileType?: string;

  @ApiProperty({
    description: 'Report file size in bytes',
    example: 2048576,
  })
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  fileSize?: number;

  @ApiProperty({
    description: 'When the report generation started',
    example: '2025-09-21T13:00:00Z',
  })
  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  startedAt?: Date;

  @ApiProperty({
    description: 'When the report generation completed',
    example: '2025-09-21T13:05:00Z',
  })
  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  completedAt?: Date;

  @ApiProperty({
    description: 'Error message if report generation failed',
    example: 'Insufficient data for the selected period',
  })
  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  errorMessage?: string;

  @ApiProperty({
    description: 'Who requested this report',
    example: 'admin@nailsco.com',
  })
  @Column({
    type: DataType.STRING(255),
    allowNull: true,
  })
  requestedBy?: string;

  @ApiProperty({
    description: 'Whether this is a scheduled recurring report',
    example: false,
  })
  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  isScheduled: boolean;

  @ApiProperty({
    description: 'Cron expression for scheduled reports',
    example: '0 0 1 * *',
  })
  @Column({
    type: DataType.STRING(100),
    allowNull: true,
  })
  scheduleExpression?: string;

  @ApiProperty({
    description: 'When the report was created',
    example: '2025-09-21T13:00:00Z',
  })
  declare createdAt: Date;

  @ApiProperty({
    description: 'When the report was last updated',
    example: '2025-09-21T13:00:00Z',
  })
  declare updatedAt: Date;

  @ApiProperty({
    description: 'When the report was deleted (null if not deleted)',
    example: null,
  })
  declare deletedAt: Date;
}

export default ReportEntity;