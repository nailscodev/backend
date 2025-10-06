import { IsString, IsOptional, IsEnum, IsEmail, IsObject, IsDate, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { NotificationType, NotificationChannel } from '../../infrastructure/persistence/entities/notification.entity';

export class CreateNotificationDto {
  @ApiProperty({
    description: 'The customer ID this notification is for',
    example: '123e4567-e89b-12d3-a456-426614174001',
    required: false,
  })
  @IsOptional()
  @IsString()
  customerId?: string;

  @ApiProperty({
    description: 'The booking ID related to this notification',
    example: '123e4567-e89b-12d3-a456-426614174002',
    required: false,
  })
  @IsOptional()
  @IsString()
  bookingId?: string;

  @ApiProperty({
    description: 'Type of notification',
    enum: NotificationType,
    example: NotificationType.BOOKING_REMINDER,
  })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty({
    description: 'Notification delivery channel',
    enum: NotificationChannel,
    example: NotificationChannel.EMAIL,
  })
  @IsEnum(NotificationChannel)
  channel: NotificationChannel;

  @ApiProperty({
    description: 'Notification title/subject',
    example: 'Recordatorio de cita - Manicure',
  })
  @IsString()
  title: string;

  @ApiProperty({
    description: 'Notification message content',
    example: 'Tu cita de manicure es mañana a las 15:00. ¡Te esperamos!',
  })
  @IsString()
  message: string;

  @ApiProperty({
    description: 'Recipient email address',
    example: 'cliente@example.com',
    required: false,
  })
  @IsOptional()
  @IsEmail()
  recipientEmail?: string;

  @ApiProperty({
    description: 'Recipient phone number',
    example: '+34987654321',
    required: false,
  })
  @IsOptional()
  @IsString()
  recipientPhone?: string;

  @ApiProperty({
    description: 'Additional metadata for the notification',
    example: { templateId: 'reminder-template', variables: { customerName: 'Ana' } },
    required: false,
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @ApiProperty({
    description: 'When the notification should be sent',
    example: '2025-09-21T14:00:00Z',
    required: false,
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  scheduledAt?: Date;

  @ApiProperty({
    description: 'Maximum number of retry attempts',
    example: 3,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  maxRetries?: number;
}