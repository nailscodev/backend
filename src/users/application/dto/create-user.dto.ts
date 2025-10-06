import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsOptional,
  Length,
  IsEnum,
  IsBoolean,
  Matches,
  IsUrl,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { UserRole } from '../../domain/user.types';

export class CreateUserDto {
  @ApiProperty({
    description: 'Username for login',
    example: 'john_doe',
    minLength: 3,
    maxLength: 50,
  })
  @IsString()
  @Length(3, 50, { message: 'Username must be between 3 and 50 characters' })
  @Matches(/^[a-zA-Z0-9_-]+$/, { message: 'Username can only contain letters, numbers, underscores and hyphens' })
  @Transform(({ value }: { value: any }): string => typeof value === 'string' ? value.trim().toLowerCase() : value)
  username: string;

  @ApiProperty({
    description: 'User email address',
    example: 'john.doe@example.com',
  })
  @IsEmail({}, { message: 'Invalid email format' })
  @Transform(({ value }: { value: any }): string => typeof value === 'string' ? value.toLowerCase().trim() : value)
  email: string;

  @ApiProperty({
    description: 'User password',
    example: 'SecurePassword123!',
    minLength: 8,
  })
  @IsString()
  @Length(8, 255, { message: 'Password must be at least 8 characters long' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    { message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character' }
  )
  password: string;

  @ApiProperty({
    description: 'User role in the system',
    enum: UserRole,
    example: UserRole.STAFF,
    required: false,
  })
  @IsOptional()
  @IsEnum(UserRole, { message: 'Invalid user role' })
  role?: UserRole = UserRole.STAFF;

  @ApiProperty({
    description: 'Display name of the user',
    example: 'John Doe',
    minLength: 1,
    maxLength: 100,
  })
  @IsString()
  @Length(1, 100, { message: 'Name must be between 1 and 100 characters' })
  @Transform(({ value }: { value: any }): string => typeof value === 'string' ? value.trim() : value)
  name: string;

  @ApiProperty({
    description: 'User profile avatar URL',
    example: 'https://example.com/avatar.jpg',
    required: false,
  })
  @IsOptional()
  @IsUrl({}, { message: 'Avatar must be a valid URL' })
  @Transform(({ value }: { value: any }): string => typeof value === 'string' ? value.trim() : value)
  avatar?: string;

  @ApiProperty({
    description: 'Whether the user account is active',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;
}