import { ApiProperty } from '@nestjs/swagger';

export class TopStaffDto {
  @ApiProperty({
    description: 'Staff member ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  staffId: string;

  @ApiProperty({
    description: 'Staff member full name',
    example: 'Ana Gomez',
  })
  staffName: string;

  @ApiProperty({
    description: 'Number of bookings',
    example: 45,
  })
  bookingsCount: number;

  @ApiProperty({
    description: 'Total revenue generated',
    example: 2250.00,
  })
  totalRevenue: number;

  @ApiProperty({
    description: 'Staff role or designation',
    example: 'Senior Technician',
  })
  role: string;
}
