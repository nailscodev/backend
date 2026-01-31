import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsDateString } from 'class-validator';

// No se permite actualizar password por este DTO
export class UpdateUserDto extends PartialType(OmitType(CreateUserDto, [] as const)) {
  @ApiProperty({
    description: 'Timestamp of last login',
    example: '2025-09-21T13:00:00Z',
    required: false,
  })
  @IsOptional()
  @IsDateString({}, { message: 'Invalid last login date format' })
  lastLogin?: string;
}