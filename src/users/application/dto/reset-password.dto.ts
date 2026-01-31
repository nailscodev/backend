import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({ description: 'Recovery token', example: '...' })
  @IsString()
  @IsNotEmpty({ message: 'The token is required' })
  token: string;

  @ApiProperty({ description: 'New password', example: 'NewPassword123!' })
  @IsString()
  @IsNotEmpty({ message: 'The new password is required' })
  @MinLength(8, { message: 'The password must be at least 8 characters long' })
  newPassword: string;
}
