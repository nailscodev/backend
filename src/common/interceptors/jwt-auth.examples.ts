/**
 * EJEMPLO: Cómo usar JWT Authentication en tus Controladores
 * 
 * Este archivo muestra ejemplos de cómo implementar autenticación JWT
 * en tus controladores usando los decoradores @Public() y @CurrentUser()
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  ForbiddenException,
} from '@nestjs/common';
import { Public } from '../decorators/public.decorator';
import { CurrentUser } from '../decorators/current-user.decorator';
import type { CurrentUserData } from '../decorators/current-user.decorator';

// ============================================================================
// EJEMPLO 1: Controlador con endpoints mixtos (públicos y protegidos)
// ============================================================================

@Controller('items')
export class ItemsController {
  
  // ✅ GET requests son públicos por defecto (no requieren JWT)
  @Get()
  async findAll() {
    return { message: 'This is publicly accessible' };
  }

  // ✅ GET con ID también es público
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return { message: `Getting item ${id} - public access` };
  }

  // 🔒 POST está PROTEGIDO automáticamente (requiere JWT)
  // El usuario autenticado está disponible via @CurrentUser()
  @Post()
  async create(
    @Body() createItemDto: any,
    @CurrentUser() user: CurrentUserData,
  ) {
    console.log(`User ${user.username} (ID: ${user.id}) is creating an item`);
    return {
      message: 'Item created',
      createdBy: user.username,
      userId: user.id,
    };
  }

  // 🔒 PUT está PROTEGIDO automáticamente
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateItemDto: any,
    @CurrentUser() user: CurrentUserData,
  ) {
    return {
      message: `Item ${id} updated by ${user.username}`,
      role: user.role,
    };
  }

  // 🔒 DELETE está PROTEGIDO - solo admin puede eliminar
  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    // Verificar permisos basados en role
    if (user.role !== 'admin') {
      throw new ForbiddenException('Only admins can delete items');
    }
    return { message: `Item ${id} deleted by admin ${user.username}` };
  }
}

// ============================================================================
// EJEMPLO 2: Endpoints públicos con @Public()
// ============================================================================

@Controller('auth')
export class AuthController {
  
  // ✅ Login debe ser público (usar @Public())
  @Public()
  @Post('login')
  async login(@Body() loginDto: any) {
    return {
      accessToken: 'jwt-token-here',
      message: 'Login successful - this endpoint is public',
    };
  }

  // ✅ Register también es público
  @Public()
  @Post('register')
  async register(@Body() registerDto: any) {
    return { message: 'User registered - this endpoint is public' };
  }

  // 🔒 Logout requiere JWT (no usar @Public())
  @Post('logout')
  async logout(@CurrentUser('id') userId: number) {
    console.log(`User ${userId} is logging out`);
    return { message: 'Logged out successfully' };
  }

  // 🔒 Cambiar contraseña requiere autenticación
  @Post('change-password')
  async changePassword(
    @Body() changePasswordDto: any,
    @CurrentUser() user: CurrentUserData,
  ) {
    return { 
      message: `Password changed for user ${user.username}`,
    };
  }
}

// ============================================================================
// EJEMPLO 3: Extracción de propiedades específicas del usuario
// ============================================================================

@Controller('profile')
export class ProfileController {
  
  // Obtener objeto completo del usuario
  @Get('me')
  async getProfile(@CurrentUser() user: CurrentUserData) {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    };
  }

  // Extraer solo el ID del usuario
  @Put('me')
  async updateProfile(
    @Body() updateDto: any,
    @CurrentUser('id') userId: number,
  ) {
    console.log(`Updating profile for user ID: ${userId}`);
    return { message: 'Profile updated' };
  }

  // Extraer solo el username
  @Post('avatar')
  async uploadAvatar(
    @Body() avatarDto: any,
    @CurrentUser('username') username: string,
  ) {
    console.log(`Uploading avatar for: ${username}`);
    return { message: 'Avatar uploaded' };
  }

  // Extraer solo el role
  @Get('permissions')
  async getPermissions(@CurrentUser('role') role: string) {
    return {
      role,
      canEdit: role === 'admin' || role === 'manager',
      canDelete: role === 'admin',
    };
  }
}

// ============================================================================
// EJEMPLO 4: Control de acceso basado en roles
// ============================================================================

@Controller('admin')
export class AdminController {
  
  // Solo admins pueden acceder
  @Get('dashboard')
  async getDashboard(@CurrentUser() user: CurrentUserData) {
    if (user.role !== 'admin') {
      throw new ForbiddenException('Admin access required');
    }
    return { message: 'Admin dashboard data' };
  }

  // Admins y managers pueden acceder
  @Post('reports')
  async createReport(@CurrentUser() user: CurrentUserData, @Body() reportDto: any) {
    const allowedRoles = ['admin', 'manager'];
    if (!allowedRoles.includes(user.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }
    return { message: `Report created by ${user.role}` };
  }

  // Verificar que el usuario solo edite sus propios recursos
  @Put('users/:id')
  async updateUser(
    @Param('id') id: string,
    @Body() updateDto: any,
    @CurrentUser() user: CurrentUserData,
  ) {
    // Admin puede editar cualquier usuario, otros solo su propio perfil
    if (user.role !== 'admin' && user.id.toString() !== id) {
      throw new ForbiddenException('You can only edit your own profile');
    }
    return { message: 'User updated' };
  }
}

// ============================================================================
// EJEMPLO 5: Manejo de errores con JWT
// ============================================================================

@Controller('orders')
export class OrdersController {
  
  @Post()
  async createOrder(
    @Body() orderDto: any,
    @CurrentUser() user: CurrentUserData | null,
  ) {
    // Si por alguna razón el user es null (no debería pasar con el interceptor)
    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    return {
      message: 'Order created',
      customerId: user.id,
      customerEmail: user.email,
    };
  }

  // Logging de acciones del usuario
  @Delete(':id')
  async cancelOrder(
    @Param('id') orderId: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    console.log(`[AUDIT] User ${user.username} (${user.role}) cancelled order ${orderId}`);
    
    // Lógica para cancelar orden...
    
    return {
      message: 'Order cancelled',
      cancelledBy: user.username,
      timestamp: new Date().toISOString(),
    };
  }
}

// ============================================================================
// RESUMEN DE COMPORTAMIENTO
// ============================================================================

/*
  MÉTODOS HTTP Y AUTENTICACIÓN:

  ✅ GET      → Público por defecto (sin JWT requerido)
  ✅ OPTIONS  → Público por defecto (CORS preflight)
  🔒 POST     → PROTEGIDO (JWT requerido)
  🔒 PUT      → PROTEGIDO (JWT requerido)
  🔒 DELETE   → PROTEGIDO (JWT requerido)
  ❓ PATCH    → Público por defecto (agregar a interceptor si necesitas protección)

  DECORADORES:

  @Public()
    - Marca un endpoint como público
    - POST/PUT/DELETE no requerirán JWT
    - Úsalo para: login, register, forgot-password, etc.

  @CurrentUser()
    - Extrae información del usuario autenticado del JWT
    - Disponible solo en endpoints protegidos
    - Retorna: { id, username, email, role }
    - Se puede extraer propiedades: @CurrentUser('id'), @CurrentUser('role')

  VALIDACIÓN DE JWT:

  El interceptor automáticamente:
  ✅ Valida firma del JWT
  ✅ Verifica que no esté expirado
  ✅ Comprueba que no esté revocado en la BD
  ✅ Valida que el usuario esté activo
  ✅ Adjunta información del usuario al request

  Si falla alguna validación → UnauthorizedException

  FORMATO DE REQUEST:

  Authorization: Bearer <jwt-token>

  EJEMPLO CURL:

  curl -X POST http://localhost:3000/items \
    -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
    -H "Content-Type: application/json" \
    -d '{"name":"New Item"}'
*/
