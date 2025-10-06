import { Module } from '@nestjs/common';
// TODO: Convert to Sequelize

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';

@Module({
  imports: [
    // TODO: Add SequelizeModule.forFeature([UserEntity]) when implementing auth
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}