export interface CreateCustomerData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  notes?: string;
  birthDate?: Date;
}

export interface CustomerData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  notes?: string;
  birthDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICustomerRepository {
  save(customer: CreateCustomerData): Promise<void>;
  findById(id: string): Promise<CustomerData | null>;
  findByEmail(email: string): Promise<CustomerData | null>;
  findAll(): Promise<CustomerData[]>;
  search(query: string): Promise<CustomerData[]>;
  delete(id: string): Promise<void>;
}