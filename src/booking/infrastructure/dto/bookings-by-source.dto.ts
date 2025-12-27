import { ApiProperty } from '@nestjs/swagger';

export class BookingsBySourceDto {
  @ApiProperty({
    description: 'Number of bookings from web',
    example: 80,
  })
  web: number;

  @ApiProperty({
    description: 'Number of bookings from other sources (phone, walk-in)',
    example: 20,
  })
  other: number;
}
