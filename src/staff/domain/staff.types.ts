// Staff Domain Types and Interfaces

export enum StaffRole {
  OWNER = 'OWNER',
  MANAGER = 'MANAGER',
  TECHNICIAN = 'TECHNICIAN',
  RECEPTIONIST = 'RECEPTIONIST'
}

export enum StaffStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ON_VACATION = 'ON_VACATION',
  SICK_LEAVE = 'SICK_LEAVE'
}

export interface StaffDomain {
  readonly id: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string;
  readonly phone: string;
  readonly role: StaffRole;
  readonly status: StaffStatus;
  readonly serviceIds?: string[];
  readonly specialties?: string[];
  readonly commissionPercentage?: number;
  readonly hourlyRate?: number;
  readonly startDate?: Date;
  readonly endDate?: Date;
  readonly bio?: string;
  readonly profilePictureUrl?: string;
  readonly notes?: string;
  readonly isBookable: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly deletedAt?: Date;
}

export interface CreateStaffDomain {
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string;
  readonly phone: string;
  readonly role?: StaffRole;
  readonly status?: StaffStatus;
  readonly serviceIds?: string[];
  readonly specialties?: string[];
  readonly commissionPercentage?: number;
  readonly hourlyRate?: number;
  readonly startDate?: Date;
  readonly bio?: string;
  readonly profilePictureUrl?: string;
  readonly notes?: string;
  readonly isBookable?: boolean;
}

export interface UpdateStaffDomain {
  readonly firstName?: string;
  readonly lastName?: string;
  readonly email?: string;
  readonly phone?: string;
  readonly role?: StaffRole;
  readonly status?: StaffStatus;
  readonly serviceIds?: string[];
  readonly specialties?: string[];
  readonly commissionPercentage?: number;
  readonly hourlyRate?: number;
  readonly startDate?: Date;
  readonly endDate?: Date;
  readonly bio?: string;
  readonly profilePictureUrl?: string;
  readonly notes?: string;
  readonly isBookable?: boolean;
}

export interface StaffStatistics {
  readonly totalStaff: number;
  readonly activeStaff: number;
  readonly inactiveStaff: number;
  readonly avgCommissionRate: number;
  readonly staffByRole: Record<StaffRole, number>;
}

export interface PaginatedStaff {
  readonly staff: StaffDomain[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
  readonly totalPages: number;
}

// Staff Repository Interface (for dependency inversion)
export interface StaffRepositoryInterface {
  create(staff: CreateStaffDomain): Promise<StaffDomain>;
  findById(id: string): Promise<StaffDomain | null>;
  findByEmail(email: string): Promise<StaffDomain | null>;
  findAll(page?: number, limit?: number): Promise<PaginatedStaff>;
  findAvailable(): Promise<StaffDomain[]>;
  findByServiceId(serviceId: string): Promise<StaffDomain[]>;
  update(id: string, staff: UpdateStaffDomain): Promise<StaffDomain>;
  delete(id: string): Promise<void>;
  getStatistics(): Promise<StaffStatistics>;
}

// Staff Service Interface (for use cases)
export interface StaffServiceInterface {
  createStaff(staff: CreateStaffDomain): Promise<StaffDomain>;
  findStaffById(id: string): Promise<StaffDomain>;
  findStaffByEmail(email: string): Promise<StaffDomain | null>;
  getAllStaff(page?: number, limit?: number): Promise<PaginatedStaff>;
  getAvailableStaff(): Promise<StaffDomain[]>;
  getStaffByServiceId(serviceId: string): Promise<StaffDomain[]>;
  updateStaff(id: string, staff: UpdateStaffDomain): Promise<StaffDomain>;
  deleteStaff(id: string): Promise<void>;
  activateStaff(id: string): Promise<StaffDomain>;
  deactivateStaff(id: string): Promise<StaffDomain>;
  addServiceToStaff(staffId: string, serviceId: string): Promise<StaffDomain>;
  removeServiceFromStaff(staffId: string, serviceId: string): Promise<StaffDomain>;
  getStaffStatistics(): Promise<StaffStatistics>;
}