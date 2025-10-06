import { IsString, IsOptional, IsEnum, IsNumber, IsObject, IsDate, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PaymentMethod, PaymentType } from '../../infrastructure/persistence/entities/payment.entity';

export class CreatePaymentDto {
  @ApiProperty({
    description: 'The booking ID this payment is for',
    example: '123e4567-e89b-12d3-a456-426614174001',
    required: false,
  })
  @IsOptional()
  @IsString()
  bookingId?: string;

  @ApiProperty({
    description: 'The customer ID who made this payment',
    example: '123e4567-e89b-12d3-a456-426614174002',
  })
  @IsString()
  customerId: string;

  @ApiProperty({
    description: 'Payment method used',
    enum: PaymentMethod,
    example: PaymentMethod.CARD,
  })
  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @ApiProperty({
    description: 'Type of payment',
    enum: PaymentType,
    example: PaymentType.BOOKING_PAYMENT,
    required: false,
  })
  @IsOptional()
  @IsEnum(PaymentType)
  type?: PaymentType;

  @ApiProperty({
    description: 'Payment amount in cents',
    example: 5000,
  })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({
    description: 'Currency code',
    example: 'EUR',
    required: false,
  })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({
    description: 'Tax amount in cents',
    example: 1050,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  taxAmount?: number;

  @ApiProperty({
    description: 'Tip amount in cents',
    example: 500,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  tipAmount?: number;

  @ApiProperty({
    description: 'Discount amount in cents',
    example: 1000,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discountAmount?: number;

  @ApiProperty({
    description: 'Final amount charged in cents',
    example: 4500,
  })
  @IsNumber()
  @Min(0)
  finalAmount: number;

  @ApiProperty({
    description: 'Payment description',
    example: 'Pago por servicio de manicure',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'External payment provider transaction ID',
    example: 'stripe_pi_1234567890',
    required: false,
  })
  @IsOptional()
  @IsString()
  externalTransactionId?: string;

  @ApiProperty({
    description: 'Payment provider reference',
    example: 'stripe',
    required: false,
  })
  @IsOptional()
  @IsString()
  paymentProvider?: string;

  @ApiProperty({
    description: 'Additional payment metadata',
    example: { cardLast4: '1234', cardBrand: 'visa' },
    required: false,
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @ApiProperty({
    description: 'When the payment was processed',
    example: '2025-09-21T14:00:00Z',
    required: false,
  })
  @IsOptional()
  @IsDate()
  processedAt?: Date;

  @ApiProperty({
    description: 'Receipt number',
    example: 'REC-2025-001234',
    required: false,
  })
  @IsOptional()
  @IsString()
  receiptNumber?: string;

  @ApiProperty({
    description: 'Receipt URL',
    example: 'https://example.com/receipts/rec-123.pdf',
    required: false,
  })
  @IsOptional()
  @IsString()
  receiptUrl?: string;
}