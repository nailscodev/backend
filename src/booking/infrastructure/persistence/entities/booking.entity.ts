import { Table, Column, Model, DataType } from 'sequelize-typescript';
import { ApiProperty } from '@nestjs/swagger';
import { BookingStatus } from '../../../domain/value-objects/booking-status.vo';

export enum PaymentMethod {
  CASH = 'CASH',
  CARD = 'CARD',
}

@Table({
  tableName: 'bookings',
  paranoid: false, // Disable soft deletes for now
  timestamps: true, // Adds createdAt, updatedAt
})
export class BookingEntity extends Model<BookingEntity> {
  @ApiProperty({
    description: 'The unique identifier for the booking',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Column({
    primaryKey: true,
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
  })
  declare id: string;



  @ApiProperty({
    description: 'The ID of the service booked',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'serviceId',
  })
  declare serviceId: string;

  @ApiProperty({
    description: 'The ID of the customer who made the booking',
    example: '123e4567-e89b-12d3-a456-426614174002',
  })
  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'customerId',
  })
  declare customerId: string;

  @ApiProperty({
    description: 'The ID of the staff member assigned to the booking',
    example: '123e4567-e89b-12d3-a456-426614174003',
  })
  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'staffId',
  })
  declare staffId: string;

  @ApiProperty({
    description: 'The appointment date',
    example: '2025-09-21',
  })
  @Column({
    type: DataType.DATEONLY,
    allowNull: false,
    field: 'appointmentDate',
  })
  declare appointmentDate: string;

  @ApiProperty({
    description: 'The start time of the booking',
    example: '2025-09-21T14:00:00Z',
  })
  @Column({
    type: DataType.DATE,
    allowNull: false,
    field: 'startTime',
  })
  declare startTime: string;

  @ApiProperty({
    description: 'The end time of the booking',
    example: '2025-09-21T15:00:00Z',
  })
  @Column({
    type: DataType.DATE,
    allowNull: false,
    field: 'endTime',
  })
  declare endTime: string;

  @ApiProperty({
    description: 'Array of add-on service IDs',
    example: ['123e4567-e89b-12d3-a456-426614174004'],
  })
  @Column({
    type: DataType.ARRAY(DataType.UUID),
    allowNull: true,
    defaultValue: null,
    field: 'addOnIds',
    get() {
      const value = this.getDataValue('addOnIds') as string[] | null;
      return value || [];
    },
    set(value: string[] | null | undefined) {
      // Store the array as-is if it has items, otherwise store null
      if (value && Array.isArray(value) && value.length > 0) {
        this.setDataValue('addOnIds', value);
      } else {
        this.setDataValue('addOnIds', null);
      }
    }
  })
  declare addOnIds: string[];

  @ApiProperty({
    description: 'Current status of the booking',
    enum: BookingStatus,
    example: BookingStatus.PENDING,
  })
  @Column({
    type: DataType.ENUM(...Object.values(BookingStatus)),
    allowNull: false,
    defaultValue: BookingStatus.PENDING,
  })
  declare status: BookingStatus;

  @ApiProperty({
    description: 'Payment method used for this booking',
    enum: ['CASH', 'CARD'],
    example: 'CARD',
    required: false,
  })
  @Column({
    type: DataType.ENUM('CASH', 'CARD'),
    allowNull: true,
    field: 'paymentMethod',
  })
  declare paymentMethod?: 'CASH' | 'CARD';

  @ApiProperty({
    description: 'Total booking amount',
    example: 50.00,
  })
  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: true,
    field: 'totalAmount',
  })
  declare totalAmount?: number;

  @ApiProperty({
    description: 'Indicates if the booking was made via web',
    example: true,
    required: false,
  })
  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    field: 'web',
  })
  declare web: boolean;

  @ApiProperty({
    description: 'Special notes or requests for the booking',
    example: 'Cliente prefiere técnica específica',
  })
  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare notes?: string;

  // Automatically managed by Sequelize
  @ApiProperty({
    description: 'When the booking was created',
    example: '2025-09-21T13:00:00Z',
  })
  @Column({
    type: DataType.DATE,
    allowNull: false,
    field: 'createdAt',
  })
  declare createdAt: Date;

  @ApiProperty({
    description: 'When the booking was last updated',
    example: '2025-09-21T13:00:00Z',
  })
  @Column({
    type: DataType.DATE,
    allowNull: false,
    field: 'updatedAt',
  })
  declare updatedAt: Date;


}

export default BookingEntity;