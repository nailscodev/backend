import { ApiProperty } from '@nestjs/swagger';
import { StaffResponseDto } from './staff-response.dto';

export class PaginationMetadata {
  @ApiProperty({
    description: 'Current page number',
    example: 1,
  })
  page: number;

  @ApiProperty({
    description: 'Number of items per page',
    example: 10,
  })
  limit: number;

  @ApiProperty({
    description: 'Total number of staff members',
    example: 25,
  })
  total: number;

  @ApiProperty({
    description: 'Total number of pages',
    example: 3,
  })
  pages: number;
}

export class PaginatedStaffResponseDto {
  @ApiProperty({
    description: 'Array of staff members',
    type: [StaffResponseDto],
  })
  data: StaffResponseDto[];

  @ApiProperty({
    description: 'Pagination metadata',
    type: PaginationMetadata,
  })
  pagination: PaginationMetadata;
}