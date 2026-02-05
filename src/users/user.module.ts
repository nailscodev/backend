import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { UserEntity } from './infrastructure/persistence/entities/user.entity';
import { UserTokenEntity } from './infrastructure/persistence/entities/user-token.entity';
import { ScreenRoleEntity } from '../common/entities/screen-role.entity';
import { UserService } from './application/user.service';
import { UserController } from './infrastructure/web/user.controller';
import { ScreenRoleService } from '../common/services/screen-role.service';
import { MailModule } from '../common/services/mail.module';

@Module({
  imports: [
    SequelizeModule.forFeature([UserEntity, UserTokenEntity, ScreenRoleEntity]),
    MailModule,
  ],
  controllers: [UserController],
  providers: [UserService, ScreenRoleService],
  exports: [
    UserService,
    ScreenRoleService,
    SequelizeModule, // Export to allow other modules to inject User entities
  ],
})
export class UserModule {}