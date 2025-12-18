import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { UserEntity, UserRole } from '../common/entities/user.entity';
import { LoginDto, AuthResponse } from './dto/auth.dto';

/**
 * @deprecated This service is LEGACY and should not be used for new implementations.
 * 
 * Use `UserService.login()` from `users/application/user.service.ts` instead.
 * 
 * Reasons:
 * - Does NOT store JWT tokens in the database (no token tracking/revocation)
 * - Uses bcryptjs instead of the standard bcrypt used elsewhere
 * - Uses incorrect column names (is_active, last_login) that don't match Sequelize models
 * - Does NOT revoke previous tokens on login
 * - Missing advanced logging and error handling
 * 
 * The new implementation in UserService provides:
 * ✅ JWT token persistence with SHA-256 hashing in user_tokens table
 * ✅ Automatic revocation of previous tokens on login
 * ✅ Proper Sequelize model mapping (camelCase -> snake_case)
 * ✅ Enhanced security and token lifecycle management
 */
@Injectable()
export class AuthService {
  constructor(
    @InjectModel(UserEntity)
    private userModel: typeof UserEntity,
  ) {}

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const { username, password } = loginDto;

    // Find user by username or email
    const user = await this.userModel.findOne({
      where: {
        [Op.or]: [
          { username },
          { email: username },
        ],
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.is_active) {
      throw new UnauthorizedException('Account is deactivated');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login
    await user.update({
      last_login: new Date(),
    });

    // Generate JWT token
    const payload = {
      sub: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    };

    const accessToken = jwt.sign(payload, process.env.JWT_SECRET || 'fallback-secret', {
      expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    } as jwt.SignOptions);

    return {
      access_token: accessToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        first_name: user.name,
        last_name: '', // UserEntity solo tiene 'name', no first_name/last_name separados
      },
    };
  }

  async validateToken(token: string): Promise<UserEntity | null> {
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as {
        sub: string;
        username: string;
        email: string;
        role: UserRole;
      };
      
      const user = await this.userModel.findByPk(payload.sub);

      if (!user || !user.is_active) {
        return null;
      }

      return user;
    } catch {
      return null;
    }
  }

  async hashPassword(password: string): Promise<string> {
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
    return bcrypt.hash(password, saltRounds);
  }

  async createUser(userData: {
    username: string;
    email: string;
    password: string;
    role: UserRole;
    name: string;
    phone?: string;
  }): Promise<UserEntity> {
    const hashedPassword = await this.hashPassword(userData.password);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return this.userModel.create({
      username: userData.username,
      email: userData.email,
      password: hashedPassword,
      role: userData.role,
      name: userData.name,
    } as any);
  }
}