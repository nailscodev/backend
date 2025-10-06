import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { UserEntity } from './infrastructure/persistence/entities/user.entity';
import { UserService } from './application/user.service';
import { UserController } from './infrastructure/web/user.controller';

@Module({
  imports: [
    SequelizeModule.forFeature([UserEntity]),
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}