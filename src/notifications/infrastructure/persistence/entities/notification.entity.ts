import { Table, Column, Model, DataType } from 'sequelize-typescript';
import { ApiProperty } from '@nestjs/swagger';

export enum NotificationType {
  BOOKING_CONFIRMATION = 'BOOKING_CONFIRMATION',
  BOOKING_REMINDER = 'BOOKING_REMINDER',
  BOOKING_CANCELLED = 'BOOKING_CANCELLED',
  BOOKING_RESCHEDULED = 'BOOKING_RESCHEDULED',
  PAYMENT_CONFIRMATION = 'PAYMENT_CONFIRMATION',
  PAYMENT_REMINDER = 'PAYMENT_REMINDER',
  PROMOTIONAL = 'PROMOTIONAL',
  BIRTHDAY = 'BIRTHDAY',
  SYSTEM = 'SYSTEM'
}

export enum NotificationChannel {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  PUSH = 'PUSH',
  IN_APP = 'IN_APP'
}

export enum NotificationStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED'
}

@Table({
  tableName: 'notifications',
  paranoid: true,
  timestamps: true,
})
export class NotificationEntity extends Model<NotificationEntity> {
  @ApiProperty({
    description: 'The unique identifier for the notification',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Column({
    primaryKey: true,
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
  })
  declare id: string;

  @ApiProperty({
    description: 'The tenant ID that owns this notification (optional for single-tenant setup)',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @Column({
    type: DataType.STRING,
    allowNull: true,
    field: 'tenant_id',
  })
  tenantId?: string;

  @ApiProperty({
    description: 'The customer ID this notification is for',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @Column({
    type: DataType.UUID,
    allowNull: true,
    field: 'customer_id',
  })
  customerId?: string;

  @ApiProperty({
    description: 'The booking ID related to this notification',
    example: '123e4567-e89b-12d3-a456-426614174002',
  })
  @Column({
    type: DataType.UUID,
    allowNull: true,
    field: 'booking_id',
  })
  bookingId?: string;

  @ApiProperty({
    description: 'Type of notification',
    enum: NotificationType,
    example: NotificationType.BOOKING_REMINDER,
  })
  @Column({
    type: DataType.ENUM(...Object.values(NotificationType)),
    allowNull: false,
  })
  type: NotificationType;

  @ApiProperty({
    description: 'Notification delivery channel',
    enum: NotificationChannel,
    example: NotificationChannel.EMAIL,
  })
  @Column({
    type: DataType.ENUM(...Object.values(NotificationChannel)),
    allowNull: false,
  })
  channel: NotificationChannel;

  @ApiProperty({
    description: 'Notification status',
    enum: NotificationStatus,
    example: NotificationStatus.SENT,
  })
  @Column({
    type: DataType.ENUM(...Object.values(NotificationStatus)),
    allowNull: false,
    defaultValue: NotificationStatus.PENDING,
  })
  status: NotificationStatus;

  @ApiProperty({
    description: 'Notification title/subject',
    example: 'Recordatorio de cita - Manicure',
  })
  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  title: string;

  @ApiProperty({
    description: 'Notification message content',
    example: 'Tu cita de manicure es mañana a las 15:00. ¡Te esperamos!',
  })
  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  message: string;

  @ApiProperty({
    description: 'Recipient email address',
    example: 'cliente@example.com',
  })
  @Column({
    type: DataType.STRING(255),
    allowNull: true,
  })
  recipientEmail?: string;

  @ApiProperty({
    description: 'Recipient phone number',
    example: '+34987654321',
  })
  @Column({
    type: DataType.STRING(20),
    allowNull: true,
  })
  recipientPhone?: string;

  @ApiProperty({
    description: 'Additional metadata for the notification',
    example: { templateId: 'reminder-template', variables: { customerName: 'Ana' } },
  })
  @Column({
    type: DataType.JSONB,
    allowNull: true,
  })
  metadata?: Record<string, any>;

  @ApiProperty({
    description: 'When the notification should be sent',
    example: '2025-09-21T14:00:00Z',
  })
  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  scheduledAt?: Date;

  @ApiProperty({
    description: 'When the notification was actually sent',
    example: '2025-09-21T14:00:00Z',
  })
  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  sentAt?: Date;

  @ApiProperty({
    description: 'When the notification was delivered',
    example: '2025-09-21T14:01:00Z',
  })
  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  deliveredAt?: Date;

  @ApiProperty({
    description: 'Error message if notification failed',
    example: 'Invalid email address',
  })
  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  errorMessage?: string;

  @ApiProperty({
    description: 'External provider message ID',
    example: 'msg_123456789',
  })
  @Column({
    type: DataType.STRING(255),
    allowNull: true,
  })
  externalId?: string;

  @ApiProperty({
    description: 'Number of retry attempts',
    example: 0,
  })
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
  })
  retryCount: number;

  @ApiProperty({
    description: 'Maximum number of retry attempts',
    example: 3,
  })
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 3,
  })
  maxRetries: number;

  @ApiProperty({
    description: 'When the notification was created',
    example: '2025-09-21T13:00:00Z',
  })
  declare createdAt: Date;

  @ApiProperty({
    description: 'When the notification was last updated',
    example: '2025-09-21T13:00:00Z',
  })
  declare updatedAt: Date;

  @ApiProperty({
    description: 'When the notification was deleted (null if not deleted)',
    example: null,
  })
  declare deletedAt: Date;
}

export default NotificationEntity;