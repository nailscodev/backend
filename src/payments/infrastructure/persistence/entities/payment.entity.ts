import { Table, Column, Model, DataType } from 'sequelize-typescript';
import { ApiProperty } from '@nestjs/swagger';

export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
  PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED'
}

export enum PaymentMethod {
  CASH = 'CASH',
  CARD = 'CARD',
  TRANSFER = 'TRANSFER',
  BIZUM = 'BIZUM',
  PAYPAL = 'PAYPAL',
  APPLE_PAY = 'APPLE_PAY',
  GOOGLE_PAY = 'GOOGLE_PAY'
}

export enum PaymentType {
  BOOKING_PAYMENT = 'BOOKING_PAYMENT',
  DEPOSIT = 'DEPOSIT',
  REFUND = 'REFUND',
  TIP = 'TIP',
  PRODUCT_SALE = 'PRODUCT_SALE'
}

@Table({
  tableName: 'payments',
  paranoid: true,
  timestamps: true,
})
export class PaymentEntity extends Model<PaymentEntity> {
  @ApiProperty({
    description: 'The unique identifier for the payment',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Column({
    primaryKey: true,
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
  })
  declare id: string;

  @ApiProperty({
    description: 'The tenant ID that owns this payment',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Column({
    type: DataType.STRING,
    allowNull: false,
    field: 'tenant_id',
  })
  tenantId: string;

  @ApiProperty({
    description: 'The booking ID this payment is for',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @Column({
    type: DataType.UUID,
    allowNull: true,
    field: 'booking_id',
  })
  bookingId?: string;

  @ApiProperty({
    description: 'The customer ID who made this payment',
    example: '123e4567-e89b-12d3-a456-426614174002',
  })
  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'customer_id',
  })
  customerId: string;

  @ApiProperty({
    description: 'Payment status',
    enum: PaymentStatus,
    example: PaymentStatus.COMPLETED,
  })
  @Column({
    type: DataType.ENUM(...Object.values(PaymentStatus)),
    allowNull: false,
    defaultValue: PaymentStatus.PENDING,
  })
  status: PaymentStatus;

  @ApiProperty({
    description: 'Payment method used',
    enum: PaymentMethod,
    example: PaymentMethod.CARD,
  })
  @Column({
    type: DataType.ENUM(...Object.values(PaymentMethod)),
    allowNull: false,
  })
  method: PaymentMethod;

  @ApiProperty({
    description: 'Type of payment',
    enum: PaymentType,
    example: PaymentType.BOOKING_PAYMENT,
  })
  @Column({
    type: DataType.ENUM(...Object.values(PaymentType)),
    allowNull: false,
    defaultValue: PaymentType.BOOKING_PAYMENT,
  })
  type: PaymentType;

  @ApiProperty({
    description: 'Payment amount in cents',
    example: 5000,
  })
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    validate: {
      min: 0,
    },
  })
  amount: number;

  @ApiProperty({
    description: 'Currency code',
    example: 'EUR',
  })
  @Column({
    type: DataType.STRING(3),
    allowNull: false,
    defaultValue: 'EUR',
  })
  currency: string;

  @ApiProperty({
    description: 'Tax amount in cents',
    example: 1050,
  })
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    validate: {
      min: 0,
    },
  })
  taxAmount?: number;

  @ApiProperty({
    description: 'Tip amount in cents',
    example: 500,
  })
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    validate: {
      min: 0,
    },
  })
  tipAmount?: number;

  @ApiProperty({
    description: 'Discount amount in cents',
    example: 1000,
  })
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    validate: {
      min: 0,
    },
  })
  discountAmount?: number;

  @ApiProperty({
    description: 'Final amount charged in cents',
    example: 4500,
  })
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    validate: {
      min: 0,
    },
  })
  finalAmount: number;

  @ApiProperty({
    description: 'Payment description',
    example: 'Pago por servicio de manicure',
  })
  @Column({
    type: DataType.STRING(255),
    allowNull: true,
  })
  description?: string;

  @ApiProperty({
    description: 'External payment provider transaction ID',
    example: 'stripe_pi_1234567890',
  })
  @Column({
    type: DataType.STRING(255),
    allowNull: true,
  })
  externalTransactionId?: string;

  @ApiProperty({
    description: 'Payment provider reference',
    example: 'stripe',
  })
  @Column({
    type: DataType.STRING(50),
    allowNull: true,
  })
  paymentProvider?: string;

  @ApiProperty({
    description: 'Additional payment metadata',
    example: { cardLast4: '1234', cardBrand: 'visa' },
  })
  @Column({
    type: DataType.JSONB,
    allowNull: true,
  })
  metadata?: Record<string, any>;

  @ApiProperty({
    description: 'When the payment was processed',
    example: '2025-09-21T14:00:00Z',
  })
  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  processedAt?: Date;

  @ApiProperty({
    description: 'Payment failure reason',
    example: 'Insufficient funds',
  })
  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  failureReason?: string;

  @ApiProperty({
    description: 'Refund amount in cents',
    example: 1000,
  })
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    validate: {
      min: 0,
    },
  })
  refundedAmount?: number;

  @ApiProperty({
    description: 'When the payment was refunded',
    example: '2025-09-21T15:00:00Z',
  })
  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  refundedAt?: Date;

  @ApiProperty({
    description: 'Refund reason',
    example: 'Customer requested cancellation',
  })
  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  refundReason?: string;

  @ApiProperty({
    description: 'Receipt number',
    example: 'REC-2025-001234',
  })
  @Column({
    type: DataType.STRING(50),
    allowNull: true,
  })
  receiptNumber?: string;

  @ApiProperty({
    description: 'Receipt URL',
    example: 'https://example.com/receipts/rec-123.pdf',
  })
  @Column({
    type: DataType.STRING(500),
    allowNull: true,
  })
  receiptUrl?: string;

  @ApiProperty({
    description: 'When the payment was created',
    example: '2025-09-21T13:00:00Z',
  })
  declare createdAt: Date;

  @ApiProperty({
    description: 'When the payment was last updated',
    example: '2025-09-21T13:00:00Z',
  })
  declare updatedAt: Date;

  @ApiProperty({
    description: 'When the payment was deleted (null if not deleted)',
    example: null,
  })
  declare deletedAt: Date;
}

export default PaymentEntity;