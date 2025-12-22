import { ApiProperty } from '@nestjs/swagger';

export class DashboardStatsDto {
  @ApiProperty({
    description: 'Total cash payments (efectivo)',
    example: 1250.50,
  })
  cash: number;

  @ApiProperty({
    description: 'Total bank/card payments',
    example: 2450.75,
  })
  bank: number;

  @ApiProperty({
    description: 'Number of completed bookings',
    example: 45,
  })
  bookings: number;

  @ApiProperty({
    description: 'Number of distinct services provided',
    example: 12,
  })
  distinctServices: number;

  @ApiProperty({
    description: 'Number of new customers in the date range',
    example: 8,
  })
  newCustomers: number;
}
