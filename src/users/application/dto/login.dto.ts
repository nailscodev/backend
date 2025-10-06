import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, Length } from 'class-validator';
import { Transform } from 'class-transformer';

export class LoginDto {
  @ApiProperty({
    description: 'Username or email for login',
    example: 'john_doe',
  })
  @IsString()
  @IsNotEmpty({ message: 'Username or email is required' })
  @Transform(({ value }: { value: any }): string => typeof value === 'string' ? value.trim() : value)
  usernameOrEmail: string;

  @ApiProperty({
    description: 'User password',
    example: 'SecurePassword123!',
  })
  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  @Length(1, 255, { message: 'Password cannot be empty' })
  password: string;
}