import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, Length } from 'class-validator';
import { Transform } from 'class-transformer';
import { UserRole } from '../../common/entities/user.entity';

export class LoginDto {
  @ApiProperty({ description: 'Username or email for login', example: 'john_doe' })
  @IsString()
  @IsNotEmpty({ message: 'Username or email is required' })
  @Transform(({ value }: { value: any }): string => (typeof value === 'string' ? value.trim() : value))
  username: string;

  @ApiProperty({ description: 'User password', example: 'SecurePassword123!' })
  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  @Length(1, 255, { message: 'Password cannot be empty' })
  password: string;
}

export interface AuthResponse {
  access_token: string;
  user: {
    id: string;
    username: string;
    email: string;
    role: UserRole;
    first_name: string;
    last_name: string;
  };
}
