import { ApiProperty } from '@nestjs/swagger';

export class BestSellingServiceDto {
  @ApiProperty({
    description: 'Service ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  serviceId: string;

  @ApiProperty({
    description: 'Service name',
    example: 'Classic Manicure',
  })
  serviceName: string;

  @ApiProperty({
    description: 'Number of bookings',
    example: 48,
  })
  bookingsCount: number;

  @ApiProperty({
    description: 'Total revenue generated',
    example: 1200.00,
  })
  totalRevenue: number;

  @ApiProperty({
    description: 'Average price per booking',
    example: 25.00,
  })
  averagePrice: number;
}
