import { ApiProperty } from '@nestjs/swagger';

export class StaffStatisticsResponseDto {
  @ApiProperty({
    description: 'Total number of staff members',
    example: 25,
  })
  totalStaff: number;

  @ApiProperty({
    description: 'Number of active staff members',
    example: 22,
  })
  activeStaff: number;

  @ApiProperty({
    description: 'Number of inactive staff members',
    example: 3,
  })
  inactiveStaff: number;

  @ApiProperty({
    description: 'Number of staff members on vacation',
    example: 2,
  })
  onVacationStaff: number;

  @ApiProperty({
    description: 'Number of staff members on sick leave',
    example: 1,
  })
  sickLeaveStaff: number;

  @ApiProperty({
    description: 'Number of staff members available for bookings',
    example: 20,
  })
  availableStaff: number;

  @ApiProperty({
    description: 'Staff utilization rate percentage',
    example: 85,
  })
  utilizationRate: number;
}