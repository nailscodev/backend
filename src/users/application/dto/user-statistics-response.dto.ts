import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../domain/user.types';

export class UserStatisticsResponseDto {
  @ApiProperty({
    description: 'Total number of users in the system',
    example: 150,
  })
  totalUsers: number;

  @ApiProperty({
    description: 'Number of active users',
    example: 140,
  })
  activeUsers: number;

  @ApiProperty({
    description: 'Number of inactive users',
    example: 10,
  })
  inactiveUsers: number;

  @ApiProperty({
    description: 'Number of users by role',
    example: {
      admin: 2,
      manager: 5,
      reception: 8,
      staff: 20,
    },
  })
  usersByRole: {
    [K in UserRole]: number;
  };

  @ApiProperty({
    description: 'Number of users who logged in recently (last 30 days)',
    example: 95,
  })
  recentLogins: number;

  @ApiProperty({
    description: 'Number of new users registered this month',
    example: 12,
  })
  newUsersThisMonth: number;

  @ApiProperty({
    description: 'Percentage of active users',
    example: 93.33,
  })
  activeUserPercentage: number;

  @ApiProperty({
    description: 'Average users per role',
    example: 37.5,
  })
  averageUsersPerRole: number;
}