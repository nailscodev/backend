import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { CustomerService } from '../../application/customer.service';
import { CreateCustomerDto } from '../../application/dto/create-customer.dto';
import { UpdateCustomerDto, SearchCustomersDto } from '../../application/dto/update-customer.dto';
import { CustomerResponseDto } from '../../application/dto/customer-response.dto';
import { StrictThrottle, LightThrottle, SearchThrottle } from '../../../common/decorators/throttle.decorator';
import { CsrfProtected, SkipCsrf } from '../../../common/decorators/csrf.decorator';
import { Public } from '../../../common/decorators/public.decorator';

@ApiTags('customers')
@Controller('customers')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Post()
  @Public() // Allow public access for booking flow
  @HttpCode(HttpStatus.CREATED)
  @StrictThrottle() // 5 requests per 15 minutes for account creation
  @CsrfProtected() // Require CSRF token for customer creation
  @ApiOperation({ summary: 'Create a new customer' })
  @ApiResponse({
    status: 201,
    description: 'Customer created successfully',
    type: CustomerResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  @ApiResponse({ status: 403, description: 'CSRF token required' })
  async createCustomer(
    @Body(ValidationPipe) createCustomerDto: CreateCustomerDto,
  ): Promise<CustomerResponseDto> {
    return this.customerService.createCustomer(createCustomerDto);
  }

  @Get()
  @SearchThrottle() // 50 requests per 5 minutes for listings
  @SkipCsrf() // Read operation, skip CSRF for performance
  @ApiOperation({ summary: 'Get all customers' })
  @ApiResponse({
    status: 200,
    description: 'List of all customers',
    type: [CustomerResponseDto],
  })
  async getAllCustomers(): Promise<CustomerResponseDto[]> {
    return this.customerService.getAllCustomers();
  }

  @Get('search')
  @SearchThrottle() // 50 requests per 5 minutes for search operations
  @SkipCsrf() // Read operation, skip CSRF for performance
  @ApiOperation({ summary: 'Search customers' })
  @ApiQuery({ name: 'query', description: 'Search query (name, email, or phone)' })
  @ApiResponse({
    status: 200,
    description: 'Search results',
    type: [CustomerResponseDto],
  })
  async searchCustomers(
    @Query() searchDto: SearchCustomersDto,
  ): Promise<CustomerResponseDto[]> {
    return this.customerService.searchCustomers(searchDto);
  }

  @Get('email/:email')
  @Public() // Allow public access for booking flow (check if customer exists)
  @SkipCsrf() // Read operation, skip CSRF
  @ApiOperation({ summary: 'Get customer by email' })
  @ApiParam({ name: 'email', description: 'Customer email' })
  @ApiResponse({
    status: 200,
    description: 'Customer details',
    type: CustomerResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async getCustomerByEmail(@Param('email') email: string): Promise<CustomerResponseDto> {
    return this.customerService.getCustomerByEmail(email);
  }

  @Get(':id')
  @SkipCsrf() // Read operation, skip CSRF
  @ApiOperation({ summary: 'Get customer by ID' })
  @ApiParam({ name: 'id', description: 'Customer ID' })
  @ApiResponse({
    status: 200,
    description: 'Customer details',
    type: CustomerResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async getCustomerById(@Param('id') id: string): Promise<CustomerResponseDto> {
    return this.customerService.getCustomerById(id);
  }

  @Put(':id')
  @LightThrottle() // 20 requests per 5 minutes for updates
  @CsrfProtected() // Require CSRF token for customer updates
  @ApiOperation({ summary: 'Update customer details' })
  @ApiParam({ name: 'id', description: 'Customer ID' })
  @ApiResponse({
    status: 200,
    description: 'Customer updated successfully',
    type: CustomerResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  @ApiResponse({ status: 403, description: 'CSRF token required' })
  async updateCustomer(
    @Param('id') id: string,
    @Body(ValidationPipe) updateCustomerDto: UpdateCustomerDto,
  ): Promise<CustomerResponseDto> {
    return this.customerService.updateCustomer(id, updateCustomerDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @CsrfProtected() // Require CSRF token for customer deletion
  @ApiOperation({ summary: 'Delete customer' })
  @ApiParam({ name: 'id', description: 'Customer ID' })
  @ApiResponse({ status: 204, description: 'Customer deleted successfully' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  @ApiResponse({ status: 403, description: 'CSRF token required' })
  async deleteCustomer(@Param('id') id: string): Promise<void> {
    return this.customerService.deleteCustomer(id);
  }
}