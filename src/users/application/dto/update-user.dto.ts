import { PartialType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsDateString } from 'class-validator';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiProperty({
    description: 'Timestamp of last login',
    example: '2025-09-21T13:00:00Z',
    required: false,
  })
  @IsOptional()
  @IsDateString({}, { message: 'Invalid last login date format' })
  lastLogin?: string;
}