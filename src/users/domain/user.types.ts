// User Domain Types and Interfaces

export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager', 
  RECEPTION = 'reception',
  STAFF = 'staff'
}

export interface UserDomain {
  readonly id: string;
  readonly username: string;
  readonly email: string;
  readonly password: string;
  readonly role: UserRole;
  readonly name: string;
  readonly avatar?: string;
  readonly isActive: boolean;
  readonly lastLogin?: Date;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface CreateUserDomain {
  readonly username: string;
  readonly email: string;
  readonly password: string;
  readonly role?: UserRole;
  readonly name: string;
  readonly avatar?: string;
  readonly isActive?: boolean;
}

export interface UpdateUserDomain {
  readonly username?: string;
  readonly email?: string;
  readonly password?: string;
  readonly role?: UserRole;
  readonly name?: string;
  readonly avatar?: string;
  readonly isActive?: boolean;
  readonly lastLogin?: Date;
}

export interface UserFilters {
  readonly search?: string;
  readonly role?: UserRole;
  readonly isActive?: boolean;
  readonly createdAfter?: Date;
  readonly createdBefore?: Date;
  readonly lastLoginAfter?: Date;
  readonly lastLoginBefore?: Date;
}

export interface PaginationParams {
  readonly page: number;
  readonly limit: number;
}

export interface PaginatedUsers {
  readonly data: UserDomain[];
  readonly pagination: {
    readonly currentPage: number;
    readonly totalPages: number;
    readonly totalItems: number;
    readonly itemsPerPage: number;
    readonly hasNextPage: boolean;
    readonly hasPrevPage: boolean;
  };
}

export interface UserStatistics {
  readonly totalUsers: number;
  readonly activeUsers: number;
  readonly inactiveUsers: number;
  readonly usersByRole: {
    readonly [K in UserRole]: number;
  };
  readonly recentLogins: number;
  readonly newUsersThisMonth: number;
}

export interface LoginCredentials {
  readonly usernameOrEmail: string;
  readonly password: string;
}

export interface LoginResult {
  readonly user: UserDomain;
  readonly token?: string;
  readonly refreshToken?: string;
}

export interface PasswordChangeRequest {
  readonly currentPassword: string;
  readonly newPassword: string;
}

// Repository interface
export interface UserRepositoryInterface {
  findAll(pagination: PaginationParams, filters?: UserFilters): Promise<PaginatedUsers>;
  findById(id: string): Promise<UserDomain | null>;
  findByEmail(email: string): Promise<UserDomain | null>;
  findByUsername(username: string): Promise<UserDomain | null>;
  findByUsernameOrEmail(usernameOrEmail: string): Promise<UserDomain | null>;
  create(userData: CreateUserDomain): Promise<UserDomain>;
  update(id: string, userData: UpdateUserDomain): Promise<UserDomain>;
  delete(id: string): Promise<boolean>;
  activate(id: string): Promise<UserDomain>;
  deactivate(id: string): Promise<UserDomain>;
  updateLastLogin(id: string): Promise<void>;
  getStatistics(): Promise<UserStatistics>;
  findActiveUsers(): Promise<UserDomain[]>;
  findUsersByRole(role: UserRole): Promise<UserDomain[]>;
}

// Service interface  
export interface UserServiceInterface {
  getAllUsers(pagination?: PaginationParams, filters?: UserFilters): Promise<PaginatedUsers>;
  getUserById(id: string): Promise<UserDomain>;
  getUserByEmail(email: string): Promise<UserDomain | null>;
  getUserByUsername(username: string): Promise<UserDomain | null>;
  createUser(userData: CreateUserDomain): Promise<UserDomain>;
  updateUser(id: string, userData: UpdateUserDomain): Promise<UserDomain>;
  deleteUser(id: string): Promise<boolean>;
  activateUser(id: string): Promise<UserDomain>;
  deactivateUser(id: string): Promise<UserDomain>;
  changePassword(id: string, passwordChange: PasswordChangeRequest): Promise<boolean>;
  login(credentials: LoginCredentials): Promise<LoginResult>;
  getUserStatistics(): Promise<UserStatistics>;
  getActiveUsers(): Promise<UserDomain[]>;
  getUsersByRole(role: UserRole): Promise<UserDomain[]>;
}