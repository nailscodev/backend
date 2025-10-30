import { Injectable, NotFoundException, ConflictException, BadRequestException, UnauthorizedException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, WhereOptions } from 'sequelize';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { PaginatedUserResponseDto } from './dto/paginated-user-response.dto';
import { UserStatisticsResponseDto } from './dto/user-statistics-response.dto';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UserEntity } from '../infrastructure/persistence/entities/user.entity';
import { UserRole } from '../domain/user.types';

interface PaginationParams {
  page: number;
  limit: number;
}

interface UserFilters {
  search?: string;
  role?: UserRole;
  isActive?: boolean;
  createdAfter?: Date;
  createdBefore?: Date;
  lastLoginAfter?: Date;
  lastLoginBefore?: Date;
}

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  private readonly DEFAULT_PAGE = 1;
  private readonly DEFAULT_LIMIT = 10;
  private readonly MAX_LIMIT = 100;
  private readonly SALT_ROUNDS = 12;

  constructor(
    @InjectModel(UserEntity)
    private readonly userModel: typeof UserEntity,
  ) { }

  /**
   * Creates a new user
   */
  async createUser(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    this.logger.log(`Creating user with email: ${createUserDto.email}`);

    // Check if email already exists
    const existingUserByEmail = await this.userModel.findOne({
      where: { email: createUserDto.email.toLowerCase().trim() }
    });

    if (existingUserByEmail) {
      throw new ConflictException('User with this email already exists');
    }

    // Check if username already exists
    const existingUserByUsername = await this.userModel.findOne({
      where: { username: createUserDto.username.toLowerCase().trim() }
    });

    if (existingUserByUsername) {
      throw new ConflictException('User with this username already exists');
    }

    try {
      // Hash the password
      const hashedPassword = await this.hashPassword(createUserDto.password);

      const userData = {
        username: createUserDto.username.toLowerCase().trim(),
        email: createUserDto.email.toLowerCase().trim(),
        password: hashedPassword,
        role: createUserDto.role || UserRole.STAFF,
        name: createUserDto.name,
        avatar: createUserDto.avatar,
        isActive: createUserDto.isActive ?? true
      };

      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const createdUser = await this.userModel.create(userData as any);

      this.logger.log(`User created successfully with ID: ${createdUser.id}`);
      return this.mapToResponseDto(createdUser);
    } catch (error: unknown) {
      this.logger.error('Failed to create user', error);
      throw new BadRequestException('Failed to create user');
    }
  }

  /**
   * Retrieves paginated list of users with optional filters
   */
  async getAllUsers(
    pagination: PaginationParams = { page: this.DEFAULT_PAGE, limit: this.DEFAULT_LIMIT },
    filters: UserFilters = {}
  ): Promise<PaginatedUserResponseDto> {
    this.logger.log(`Finding users with pagination: ${JSON.stringify(pagination)}`);

    const validatedPagination = this.validatePaginationParams(pagination);
    const whereConditions = this.buildWhereConditions(filters);

    try {
      const { count, rows } = await this.userModel.findAndCountAll({
        where: whereConditions,
        limit: validatedPagination.limit,
        offset: (validatedPagination.page - 1) * validatedPagination.limit,
        order: [['createdAt', 'DESC']],
        attributes: { exclude: ['password'] }, // Never return password
      });

      const users = rows.map(user => this.mapToResponseDto(user));

      const totalPages = Math.ceil(count / validatedPagination.limit);

      return {
        data: users,
        pagination: {
          currentPage: validatedPagination.page,
          totalPages,
          totalItems: count,
          itemsPerPage: validatedPagination.limit,
          hasNextPage: validatedPagination.page < totalPages,
          hasPrevPage: validatedPagination.page > 1,
        },
      };
    } catch (error: unknown) {
      this.logger.error('Failed to retrieve users', error);
      throw new BadRequestException('Failed to retrieve users');
    }
  }

  /**
   * Finds a user by ID
   */
  async getUserById(id: string): Promise<UserResponseDto> {
    this.logger.log(`Finding user by ID: ${id}`);

    const user = await this.findUserEntityById(id);
    return this.mapToResponseDto(user);
  }

  /**
   * Finds a user by email
   */
  async getUserByEmail(email: string): Promise<UserResponseDto | null> {
    this.logger.log(`Finding user by email: ${email}`);

    const user = await this.userModel.findOne({
      where: { email: email.toLowerCase().trim() },
      attributes: { exclude: ['password'] },
    });

    return user ? this.mapToResponseDto(user) : null;
  }

  /**
   * Finds a user by username
   */
  async getUserByUsername(username: string): Promise<UserResponseDto | null> {
    this.logger.log(`Finding user by username: ${username}`);

    const user = await this.userModel.findOne({
      where: { username: username.toLowerCase().trim() },
      attributes: { exclude: ['password'] },
    });

    return user ? this.mapToResponseDto(user) : null;
  }

  /**
   * Updates a user by ID
   */
  async updateUser(id: string, updateUserDto: UpdateUserDto): Promise<UserResponseDto> {
    this.logger.log(`Updating user with ID: ${id}`);

    const user = await this.findUserEntityById(id);

    this.validateBusinessRules(updateUserDto);

    // Prepare update data
    const updateData: Partial<UserEntity> = {};

    if (updateUserDto.username !== undefined) {
      const existingUser = await this.userModel.findOne({
        where: {
          username: updateUserDto.username.toLowerCase().trim(),
          id: { [Op.ne]: id }
        }
      });
      if (existingUser) {
        throw new ConflictException('Username already exists');
      }
      updateData.username = updateUserDto.username.toLowerCase().trim();
    }

    if (updateUserDto.email !== undefined) {
      const existingUser = await this.userModel.findOne({
        where: {
          email: updateUserDto.email.toLowerCase().trim(),
          id: { [Op.ne]: id }
        }
      });
      if (existingUser) {
        throw new ConflictException('Email already exists');
      }
      updateData.email = updateUserDto.email.toLowerCase().trim();
    }

    if (updateUserDto.password !== undefined) {
      updateData.password = await this.hashPassword(updateUserDto.password);
    }

    if (updateUserDto.role !== undefined) {
      updateData.role = updateUserDto.role;
    }

    if (updateUserDto.name !== undefined) {
      updateData.name = updateUserDto.name;
    }

    if (updateUserDto.avatar !== undefined) {
      updateData.avatar = updateUserDto.avatar;
    }

    if (updateUserDto.isActive !== undefined) {
      updateData.isActive = updateUserDto.isActive;
    }

    if (updateUserDto.lastLogin !== undefined) {
      updateData.lastLogin = updateUserDto.lastLogin ? new Date(updateUserDto.lastLogin) : undefined;
    }

    try {
      await user.update(updateData);
      this.logger.log(`User updated successfully with ID: ${id}`);
      return this.mapToResponseDto(user);
    } catch (error: unknown) {
      this.logger.error(`Failed to update user with ID: ${id}`, error);
      throw new BadRequestException('Failed to update user');
    }
  }

  /**
   * Deletes a user by ID
   */
  async deleteUser(id: string): Promise<boolean> {
    this.logger.log(`Deleting user with ID: ${id}`);

    const user = await this.findUserEntityById(id);

    try {
      await user.destroy();
      this.logger.log(`User deleted successfully with ID: ${id}`);
      return true;
    } catch (error: unknown) {
      this.logger.error(`Failed to delete user with ID: ${id}`, error);
      throw new BadRequestException('Failed to delete user');
    }
  }

  /**
   * Activates a user
   */
  async activateUser(id: string): Promise<UserResponseDto> {
    this.logger.log(`Activating user with ID: ${id}`);

    const user = await this.findUserEntityById(id);

    try {
      await user.update({ isActive: true });
      this.logger.log(`User activated successfully with ID: ${id}`);
      return this.mapToResponseDto(user);
    } catch (error: unknown) {
      this.logger.error(`Failed to activate user with ID: ${id}`, error);
      throw new BadRequestException('Failed to activate user');
    }
  }

  /**
   * Deactivates a user
   */
  async deactivateUser(id: string): Promise<UserResponseDto> {
    this.logger.log(`Deactivating user with ID: ${id}`);

    const user = await this.findUserEntityById(id);

    try {
      await user.update({ isActive: false });
      this.logger.log(`User deactivated successfully with ID: ${id}`);
      return this.mapToResponseDto(user);
    } catch (error: unknown) {
      this.logger.error(`Failed to deactivate user with ID: ${id}`, error);
      throw new BadRequestException('Failed to deactivate user');
    }
  }

  /**
   * Changes user password
   */
  async changePassword(id: string, changePasswordDto: ChangePasswordDto): Promise<boolean> {
    this.logger.log(`Changing password for user with ID: ${id}`);

    const user = await this.userModel.findByPk(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await this.comparePassword(changePasswordDto.currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Hash new password
    const hashedNewPassword = await this.hashPassword(changePasswordDto.newPassword);

    try {
      await user.update({ password: hashedNewPassword });
      this.logger.log(`Password changed successfully for user with ID: ${id}`);
      return true;
    } catch (error: unknown) {
      this.logger.error(`Failed to change password for user with ID: ${id}`, error);
      throw new BadRequestException('Failed to change password');
    }
  }

  /**
   * Authenticates user login
   */
  async login(loginDto: LoginDto): Promise<LoginResponseDto> {
    this.logger.log(`Login attempt for: ${loginDto.usernameOrEmail}`);

    // Find user by email or username
    const user = await this.userModel.findOne({
      where: {
        [Op.or]: [
          { email: loginDto.usernameOrEmail.toLowerCase().trim() },
          { username: loginDto.usernameOrEmail.toLowerCase().trim() }
        ]
      }
    });

    console.log('🔍 USER FOUND:', user ? {
      id: user.id,
      email: user.email,
      username: user.username,
      isActive: user.isActive,
      role: user.role
    } : 'NOT FOUND');

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    console.log('🔐 USER ACTIVE STATUS:', user.isActive, 'TYPE:', typeof user.isActive);

    if (!user.isActive) {
      throw new UnauthorizedException('User account is deactivated');
    }

    // Verify password
    const isPasswordValid = await this.comparePassword(loginDto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login
    await user.update({ lastLogin: new Date() });

    this.logger.log(`User logged in successfully: ${user.id}`);

    return {
      user: this.mapToResponseDto(user),
      message: 'Login successful',
      loginAt: new Date(),
    };
  }

  /**
   * Gets user statistics
   */
  async getUserStatistics(): Promise<UserStatisticsResponseDto> {
    this.logger.log('Calculating user statistics');

    try {
      const [
        totalUsers,
        activeUsers,
        usersByRole,
        recentLogins,
        newUsersThisMonth,
      ] = await Promise.all([
        this.userModel.count(),
        this.userModel.count({ where: { isActive: true } }),
        this.getUserCountByRole(),
        this.getRecentLoginsCount(),
        this.getNewUsersThisMonthCount(),
      ]);

      const inactiveUsers = totalUsers - activeUsers;
      const activeUserPercentage = totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0;
      const averageUsersPerRole = totalUsers > 0 ? totalUsers / Object.keys(UserRole).length : 0;

      return {
        totalUsers,
        activeUsers,
        inactiveUsers,
        usersByRole,
        recentLogins,
        newUsersThisMonth,
        activeUserPercentage: Number(activeUserPercentage.toFixed(2)),
        averageUsersPerRole: Number(averageUsersPerRole.toFixed(2)),
      };
    } catch (error: unknown) {
      this.logger.error('Failed to calculate user statistics', error);
      throw new BadRequestException('Failed to calculate user statistics');
    }
  }

  /**
   * Gets all active users
   */
  async getActiveUsers(): Promise<UserResponseDto[]> {
    this.logger.log('Finding all active users');

    try {
      const users = await this.userModel.findAll({
        where: { isActive: true },
        attributes: { exclude: ['password'] },
        order: [['name', 'ASC']],
      });

      return users.map(user => this.mapToResponseDto(user));
    } catch (error: unknown) {
      this.logger.error('Failed to retrieve active users', error);
      throw new BadRequestException('Failed to retrieve active users');
    }
  }

  /**
   * Gets users by role
   */
  async getUsersByRole(role: UserRole): Promise<UserResponseDto[]> {
    this.logger.log(`Finding users by role: ${role}`);

    try {
      const users = await this.userModel.findAll({
        where: { role },
        attributes: { exclude: ['password'] },
        order: [['name', 'ASC']],
      });

      return users.map(user => this.mapToResponseDto(user));
    } catch (error: unknown) {
      this.logger.error(`Failed to retrieve users by role: ${role}`, error);
      throw new BadRequestException('Failed to retrieve users by role');
    }
  }

  /**
   * Updates last login timestamp
   */
  async updateLastLogin(id: string): Promise<void> {
    this.logger.log(`Updating last login for user with ID: ${id}`);

    const user = await this.findUserEntityById(id);

    try {
      await user.update({ lastLogin: new Date() });
      this.logger.log(`Last login updated successfully for user with ID: ${id}`);
    } catch (error: unknown) {
      this.logger.error(`Failed to update last login for user with ID: ${id}`, error);
      throw new BadRequestException('Failed to update last login');
    }
  }

  // Private helper methods

  private async hashPassword(password: string): Promise<string> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    return (bcrypt as any).hash(password, this.SALT_ROUNDS) as Promise<string>;
  }

  private async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    return (bcrypt as any).compare(password, hashedPassword) as Promise<boolean>;
  }

  private async findUserEntityById(id: string): Promise<UserEntity> {
    const user = await this.userModel.findByPk(id, {
      attributes: { exclude: ['password'] },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  private validatePaginationParams(pagination: PaginationParams): PaginationParams {
    const page = Math.max(1, pagination.page || this.DEFAULT_PAGE);
    const limit = Math.min(this.MAX_LIMIT, Math.max(1, pagination.limit || this.DEFAULT_LIMIT));

    return { page, limit };
  }

  private buildWhereConditions(filters: UserFilters): WhereOptions {
    const where: WhereOptions = {};

    if (filters.search) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      (where as any)[Op.or] = [
        { name: { [Op.iLike]: `%${filters.search}%` } },
        { email: { [Op.iLike]: `%${filters.search}%` } },
        { username: { [Op.iLike]: `%${filters.search}%` } },
      ];
    }

    if (filters.role !== undefined) {
      where.role = filters.role;
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters.createdAfter || filters.createdBefore) {
      const createdAtConditions: any = {};
      if (filters.createdAfter) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        createdAtConditions[Op.gte] = filters.createdAfter;
      }
      if (filters.createdBefore) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        createdAtConditions[Op.lte] = filters.createdBefore;
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      where.createdAt = createdAtConditions;
    }

    if (filters.lastLoginAfter || filters.lastLoginBefore) {
      const lastLoginConditions: any = {};
      if (filters.lastLoginAfter) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        lastLoginConditions[Op.gte] = filters.lastLoginAfter;
      }
      if (filters.lastLoginBefore) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        lastLoginConditions[Op.lte] = filters.lastLoginBefore;
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      where.lastLogin = lastLoginConditions;
    }

    return where;
  }

  private validateBusinessRules(updateUserDto: UpdateUserDto): void {
    // Add any business rule validations here
    if (updateUserDto.email && !updateUserDto.email.includes('@')) {
      throw new BadRequestException('Invalid email format');
    }

    if (updateUserDto.username && updateUserDto.username.length < 3) {
      throw new BadRequestException('Username must be at least 3 characters long');
    }
  }

  private async getUserCountByRole(): Promise<{ [K in UserRole]: number }> {
    const roleCountsArray = await this.userModel.findAll({
      attributes: [
        'role',
        [this.userModel.sequelize!.fn('COUNT', this.userModel.sequelize!.col('role')), 'count']
      ],
      group: ['role'],
      raw: true,
    }) as any[];

    const roleCounts = {} as { [K in UserRole]: number };

    // Initialize all roles with 0
    Object.values(UserRole).forEach(role => {
      roleCounts[role] = 0;
    });

    // Update with actual counts
    roleCountsArray.forEach((item: any) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument
      if (Object.values(UserRole).includes(item.role)) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument
        roleCounts[item.role] = parseInt(item.count, 10);
      }
    });

    return roleCounts;
  }

  private async getRecentLoginsCount(): Promise<number> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return this.userModel.count({
      where: {
        lastLogin: {
          [Op.gte]: thirtyDaysAgo,
        },
      },
    });
  }

  private async getNewUsersThisMonthCount(): Promise<number> {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    return this.userModel.count({
      where: {
        createdAt: {
          [Op.gte]: startOfMonth,
        },
      },
    });
  }

  private mapToResponseDto(user: UserEntity): UserResponseDto {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      name: user.name,
      avatar: user.avatar,
      isActive: user.isActive,
      isActiveUser: user.isActiveUser,
      initials: user.initials,
      isAdmin: user.isAdmin,
      isManager: user.isManager,
      isStaff: user.isStaff,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}