import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpStatus,
  ValidationPipe,
  ParseUUIDPipe,
  ParseIntPipe,
  ParseBoolPipe,
  ParseEnumPipe,
  HttpCode,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { UserService } from '../../application/user.service';
import { CreateUserDto } from '../../application/dto/create-user.dto';
import { UpdateUserDto } from '../../application/dto/update-user.dto';
import { UserResponseDto } from '../../application/dto/user-response.dto';
import { PaginatedUserResponseDto } from '../../application/dto/paginated-user-response.dto';
import { UserStatisticsResponseDto } from '../../application/dto/user-statistics-response.dto';
import { LoginDto } from '../../application/dto/login.dto';
import { LoginResponseDto } from '../../application/dto/login-response.dto';
import { ChangePasswordDto } from '../../application/dto/change-password.dto';
import { ForgotPasswordDto } from '../../application/dto/forgot-password.dto';
import { ResetPasswordDto } from '../../application/dto/reset-password.dto';
import { UserRole } from '../persistence/entities/user.entity';
import { ScreenRoleService } from '../../../common/services/screen-role.service';
import { RequireAuth } from '../../../common/decorators/require-auth.decorator';
import { Public } from '../../../common/decorators/public.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import type { CurrentUserData } from '../../../common/decorators/current-user.decorator';

@ApiTags('users')
@Controller('users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly screenRoleService: ScreenRoleService,
  ) {}

  @Post()
  @ApiOperation({ 
    summary: 'Create a new user',
    description: 'Creates a new user account with the provided information. Password will be hashed automatically.',
  })
  @ApiBody({
    type: CreateUserDto,
    description: 'User creation data',
    examples: {
      admin: {
        summary: 'Create Admin User',
        description: 'Example of creating an admin user',
        value: {
          username: 'admin_user',
          email: 'admin@example.com',
          role: 'ADMIN',
          name: 'System Administrator',
          avatar: 'https://example.com/admin-avatar.jpg',
          isActive: true,
        },
      },
      regular: {
        summary: 'Create Regular User',
        description: 'Example of creating a regular user',
        value: {
          username: 'john_doe',
          email: 'john.doe@example.com',
          name: 'John Doe',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'User has been created successfully',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'User with email or username already exists',
  })
  @HttpCode(HttpStatus.CREATED)
  async createUser(
    @Body(new ValidationPipe({ transform: true })) createUserDto: CreateUserDto,
  ): Promise<UserResponseDto> {
    return this.userService.createUser(createUserDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all users',
    description: 'Retrieves a paginated list of users with optional filtering capabilities.',
  })
  @ApiQuery({ name: 'page', required: false, type: 'number', description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: 'number', description: 'Items per page (default: 10, max: 100)' })
  @ApiQuery({ name: 'search', required: false, type: 'string', description: 'Search in name, email, or username' })
  @ApiQuery({ name: 'role', required: false, enum: UserRole, description: 'Filter by user role' })
  @ApiQuery({ name: 'isActive', required: false, type: 'boolean', description: 'Filter by active status' })
  @ApiQuery({ name: 'createdAfter', required: false, type: 'string', description: 'Filter by creation date (ISO string)' })
  @ApiQuery({ name: 'createdBefore', required: false, type: 'string', description: 'Filter by creation date (ISO string)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Users retrieved successfully',
    type: PaginatedUserResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid query parameters',
  })
  async getAllUsers(
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('search') search?: string,
    @Query('role', new ParseEnumPipe(UserRole, { optional: true })) role?: UserRole,
    @Query('isActive', new ParseBoolPipe({ optional: true })) isActive?: boolean,
    @Query('createdAfter') createdAfter?: string,
    @Query('createdBefore') createdBefore?: string,
  ): Promise<PaginatedUserResponseDto> {
    const pagination = { page: page || 1, limit: limit || 10 };
    const filters = {
      search,
      role,
      isActive,
      createdAfter: createdAfter ? new Date(createdAfter) : undefined,
      createdBefore: createdBefore ? new Date(createdBefore) : undefined,
    };
    
    // Remove undefined values
    const cleanedFilters = Object.fromEntries(
      Object.entries(filters).filter(([, value]) => value !== undefined)
    );

    return this.userService.getAllUsers(pagination, cleanedFilters);
  }

  @Get('active')
  @ApiOperation({
    summary: 'Get active users',
    description: 'Retrieves all users with active status.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Active users retrieved successfully',
    type: [UserResponseDto],
  })
  async getActiveUsers(): Promise<UserResponseDto[]> {
    return this.userService.getActiveUsers();
  }

  @Get('statistics')
  @ApiOperation({
    summary: 'Get user statistics',
    description: 'Retrieves comprehensive statistics about users in the system.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User statistics retrieved successfully',
    type: UserStatisticsResponseDto,
  })
  async getUserStatistics(): Promise<UserStatisticsResponseDto> {
    return this.userService.getUserStatistics();
  }

  @Get('by-role/:role')
  @ApiOperation({
    summary: 'Get users by role',
    description: 'Retrieves all users with a specific role.',
  })
  @ApiParam({
    name: 'role',
    enum: UserRole,
    description: 'User role to filter by',
    example: UserRole.ADMIN,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Users by role retrieved successfully',
    type: [UserResponseDto],
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid role provided',
  })
  async getUsersByRole(
    @Param('role', new ParseEnumPipe(UserRole)) role: UserRole,
  ): Promise<UserResponseDto[]> {
    return this.userService.getUsersByRole(role);
  }

  @Get('email/:email')
  @ApiOperation({
    summary: 'Get user by email',
    description: 'Retrieves a user by their email address.',
  })
  @ApiParam({
    name: 'email',
    type: 'string',
    description: 'User email address',
    example: 'john.doe@example.com',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User retrieved successfully',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found',
  })
  async getUserByEmail(@Param('email') email: string): Promise<UserResponseDto | null> {
    return this.userService.getUserByEmail(email);
  }

  @Get('username/:username')
  @ApiOperation({
    summary: 'Get user by username',
    description: 'Retrieves a user by their username.',
  })
  @ApiParam({
    name: 'username',
    type: 'string',
    description: 'Username',
    example: 'john_doe',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User retrieved successfully',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found',
  })
  async getUserByUsername(@Param('username') username: string): Promise<UserResponseDto | null> {
    return this.userService.getUserByUsername(username);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get user by ID',
    description: 'Retrieves a specific user by their unique identifier.',
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    description: 'User unique identifier (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User retrieved successfully',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid UUID format',
  })
  async getUserById(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<UserResponseDto> {
    return this.userService.getUserById(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update user',
    description: 'Updates an existing user with the provided information. Only provided fields will be updated.',
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    description: 'User unique identifier (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiBody({
    type: UpdateUserDto,
    description: 'User update data (all fields optional)',
    examples: {
      updateProfile: {
        summary: 'Update Profile Information',
        description: 'Update user profile information',
        value: {
          name: 'John Smith',
          avatar: 'https://example.com/new-avatar.jpg',
        },
      },
      updateRole: {
        summary: 'Update User Role',
        description: 'Update user role',
        value: {
          role: 'MANAGER',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User updated successfully',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Email or username already exists',
  })
  async updateUser(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body(new ValidationPipe({ transform: true })) updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    return this.userService.updateUser(id, updateUserDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete user',
    description: 'Permanently deletes a user from the system.',
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    description: 'User unique identifier (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User deleted successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'User deleted successfully' },
        deleted: { type: 'boolean', example: true },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found',
  })
  @HttpCode(HttpStatus.OK)
  async deleteUser(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<{ message: string; deleted: boolean }> {
    const deleted = await this.userService.deleteUser(id);
    return {
      message: 'User deleted successfully',
      deleted,
    };
  }

  @Patch(':id/activate')
  @ApiOperation({
    summary: 'Activate user',
    description: 'Activates a user account, allowing them to login and access the system.',
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    description: 'User unique identifier (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User activated successfully',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found',
  })
  async activateUser(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<UserResponseDto> {
    return this.userService.activateUser(id);
  }

  @Patch(':id/deactivate')
  @ApiOperation({
    summary: 'Deactivate user',
    description: 'Deactivates a user account, preventing them from logging in.',
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    description: 'User unique identifier (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User deactivated successfully',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found',
  })
  async deactivateUser(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<UserResponseDto> {
    return this.userService.deactivateUser(id);
  }

  @Patch(':id/change-password')
  @ApiOperation({
    summary: 'Change user password',
    description: 'Changes the password for a specific user. Requires current password verification. Protected by JWT authentication.',
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    description: 'User unique identifier (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiBody({
    type: ChangePasswordDto,
    description: 'Password change data',
    examples: {
      passwordChange: {
        summary: 'Change Password',
        description: 'Change user password with current password verification',
        value: {
          currentPassword: 'CurrentPassword123!',
          newPassword: 'NewSecurePassword123!',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Password changed successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Password changed successfully' },
        success: { type: 'boolean', example: true },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Current password is incorrect',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid password format',
  })
  async changePassword(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body(new ValidationPipe({ transform: true })) changePasswordDto: ChangePasswordDto,
    // Optional: You can also get authenticated user info from JWT token
    // @CurrentUser() currentUser: CurrentUserData,
  ): Promise<{ message: string; success: boolean }> {
    // Optional: Verify user can only change their own password (or admin can change any)
    // if (currentUser.role !== 'admin' && currentUser.id.toString() !== id) {
    //   throw new ForbiddenException('You can only change your own password');
    // }
    const success = await this.userService.changePassword(id, changePasswordDto);
    return {
      message: 'Password changed successfully',
      success,
    };
  }

  @Public() // This endpoint doesn't require JWT authentication
  @Post('login')
  @ApiOperation({
    summary: 'User login',
    description: 'Authenticates a user with username/email and password. Updates last login timestamp on success.',
  })
  @ApiBody({
    type: LoginDto,
    description: 'Login credentials',
    examples: {
      emailLogin: {
        summary: 'Login with Email',
        description: 'Login using email address',
        value: {
          usernameOrEmail: 'john.doe@example.com',
          password: 'UserPassword123!',
        },
      },
      usernameLogin: {
        summary: 'Login with Username',
        description: 'Login using username',
        value: {
          usernameOrEmail: 'john_doe',
          password: 'UserPassword123!',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Login successful',
    type: LoginResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid credentials or inactive account',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @HttpCode(HttpStatus.OK)
  async login(
    @Body(new ValidationPipe({ transform: true })) loginDto: LoginDto,
  ): Promise<LoginResponseDto> {
    return this.userService.login(loginDto);
  }

  @Post('logout')
  @ApiOperation({
    summary: 'User logout',
    description: 'Revokes the current JWT token, preventing further use. Requires authentication.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Logout successful',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Logged out successfully' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid or missing token',
  })
  @HttpCode(HttpStatus.OK)
  async logout(@Req() request: any): Promise<{ success: boolean; message: string }> {
    // Extract token from Authorization header
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { success: false, message: 'No token provided' };
    }

    const token = authHeader.substring(7);
    await this.userService.revokeToken(token);
    
    return { success: true, message: 'Logged out successfully' };
  }

  @Get('me/permissions')
  @RequireAuth()
  @ApiOperation({
    summary: 'Get current user permissions',
    description: 'Returns the screen permissions for the currently authenticated user.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User permissions retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        screens: { 
          type: 'array',
          items: { type: 'string' },
          example: ['admin-dashboard', 'admin-reservas', 'admin-clientes']
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid or missing token',
  })
  async getCurrentUserPermissions(
    @CurrentUser() currentUser: CurrentUserData,
  ): Promise<{ screens: string[] }> {
    console.log('🎭 Full currentUser object:', JSON.stringify(currentUser, null, 2));
    
    // Check if user is authenticated
    if (!currentUser || !currentUser.role) {
      console.error('❌ User not authenticated or role not found');
      throw new UnauthorizedException('User not authenticated or role not found');
    }

    console.log('🎭 Getting permissions for user:', {
      id: currentUser.id,
      username: currentUser.username,
      role: currentUser.role,
      roleType: typeof currentUser.role
    });

    const screens = await this.screenRoleService.getScreenIdsByRole(currentUser.role as UserRole);
    
    console.log('📱 Final screens found:', screens);

    return { screens };
  }

  @Get('debug/screen-roles')
  @Public()
  @ApiOperation({
    summary: 'Debug: Get all screen roles (temporary)',
    description: 'Returns all screen roles for debugging purposes.',
  })
  async debugScreenRoles(): Promise<any> {
    const allRoles = await this.screenRoleService.getAllScreenRoles();
    return {
      total: allRoles.length,
      roles: allRoles
    };
  }

  @Patch(':id/update-last-login')
  @ApiOperation({
    summary: 'Update last login timestamp',
    description: 'Updates the last login timestamp for a user. Typically called by authentication systems.',
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    description: 'User unique identifier (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Last login updated successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Last login updated successfully' },
        timestamp: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found',
  })
  async updateLastLogin(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<{ message: string; timestamp: Date }> {
    await this.userService.updateLastLogin(id);
    return {
      message: 'Last login updated successfully',
      timestamp: new Date(),
    };
  }

  @Public()
  @Post('forgot-password')
  @ApiOperation({ summary: 'Forgot password', description: 'Starts the password recovery process by sending an email with instructions.' })
  @ApiBody({ type: ForgotPasswordDto })
  @ApiResponse({ status: HttpStatus.OK, description: 'If the email exists, instructions to recover the password were sent.' })
  @HttpCode(HttpStatus.OK)
  async forgotPassword(
    @Body(new ValidationPipe({ transform: true })) forgotPasswordDto: ForgotPasswordDto,
  ): Promise<{ message: string }> {
    await this.userService.forgotPassword(forgotPasswordDto.email);
    return { message: 'If the email exists, instructions to recover the password were sent.' };
  }

  @Public()
  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password', description: 'Allows resetting the password using a recovery token.' })
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({ status: HttpStatus.OK, description: 'Password reset successfully.' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid or expired token.' })
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @Body(new ValidationPipe({ transform: true })) resetPasswordDto: ResetPasswordDto,
  ): Promise<{ message: string }> {
    await this.userService.resetPassword(resetPasswordDto.token, resetPasswordDto.newPassword);
    return { message: 'Password reset successfully.' };
  }
}