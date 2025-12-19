import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { UserEntity } from './infrastructure/persistence/entities/user.entity';
import { UserTokenEntity } from './infrastructure/persistence/entities/user-token.entity';
import { UserService } from './application/user.service';
import { UserController } from './infrastructure/web/user.controller';

@Module({
  imports: [
    SequelizeModule.forFeature([UserEntity, UserTokenEntity]),
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [
    UserService,
    SequelizeModule, // Export to allow other modules to inject User entities
  ],
})
export class UserModule {}