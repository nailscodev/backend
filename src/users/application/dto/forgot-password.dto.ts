import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({ description: 'User email for password recovery', example: 'user@email.com' })
  @IsEmail()
  @IsNotEmpty({ message: 'Email is required' })
  email: string;
}
