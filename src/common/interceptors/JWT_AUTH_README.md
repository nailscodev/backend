# JWT Authentication Interceptor

Este interceptor protege automáticamente todos los requests **POST, PUT y DELETE** validando tokens JWT. Los requests **GET y OPTIONS** están permitidos sin autenticación por defecto.

## Características

✅ **Protección Automática**: Todos los POST, PUT, DELETE requieren JWT válido
✅ **Validación en Base de Datos**: Verifica que el token no esté revocado
✅ **Verificación de Usuario**: Comprueba que el usuario esté activo
✅ **Información en Request**: Adjunta datos del usuario al objeto request
✅ **Decoradores Útiles**: `@Public()` y `@CurrentUser()` para facilitar uso

## Configuración

El interceptor ya está registrado globalmente en `app.module.ts`:

```typescript
{
  provide: APP_INTERCEPTOR,
  useClass: JwtAuthInterceptor,
}
```

## Endpoints Públicos

Hay dos formas de marcar endpoints como públicos:

### 1. Usando el decorador `@Public()`

```typescript
import { Public } from '../common/decorators/public.decorator';

@Public()
@Post('login')
async login(@Body() loginDto: LoginDto) {
  return this.userService.login(loginDto);
}
```

### 2. Agregando rutas a `publicEndpoints` en el interceptor

Edita `jwt-auth.interceptor.ts`:

```typescript
private readonly publicEndpoints: string[] = [
  '/auth/login',
  '/auth/register',
  '/health',
  '/csrf/token',
  '/tu-nueva-ruta', // Agregar aquí
];
```

## Obtener Usuario Autenticado

Usa el decorador `@CurrentUser()` en tus controladores:

```typescript
import { CurrentUser, CurrentUserData } from '../common/decorators/current-user.decorator';

@Post('items')
async createItem(
  @Body() createItemDto: CreateItemDto,
  @CurrentUser() user: CurrentUserData,
) {
  console.log(user.id);       // ID del usuario
  console.log(user.username); // Username
  console.log(user.email);    // Email
  console.log(user.role);     // Role (admin, manager, staff)
  
  return this.itemsService.create(createItemDto, user.id);
}
```

También puedes extraer propiedades específicas:

```typescript
@Post('items')
async createItem(
  @Body() createItemDto: CreateItemDto,
  @CurrentUser('id') userId: number,
) {
  return this.itemsService.create(createItemDto, userId);
}
```

## Formato del Token

El cliente debe enviar el JWT en el header `Authorization`:

```http
POST /api/items HTTP/1.1
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "name": "Item name"
}
```

## Ejemplo con fetch/axios

```javascript
// Fetch API
fetch('/api/items', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(data),
});

// Axios
axios.post('/api/items', data, {
  headers: {
    'Authorization': `Bearer ${token}`,
  },
});
```

## Manejo de Errores

El interceptor lanza `UnauthorizedException` con mensajes descriptivos:

| Error | Descripción |
|-------|-------------|
| `Authorization header is required for this request` | Falta el header Authorization |
| `Authorization header must be in format: Bearer <token>` | Formato incorrecto |
| `JWT token is required` | Token vacío |
| `Invalid or revoked token` | Token no existe en DB o está revocado |
| `Token has expired` | Token expirado |
| `User account is inactive` | Usuario desactivado |

## Métodos HTTP Protegidos

| Método | Protección | Notas |
|--------|-----------|-------|
| GET | ❌ No | Lectura pública por defecto |
| POST | ✅ Sí | Requiere JWT válido |
| PUT | ✅ Sí | Requiere JWT válido |
| DELETE | ✅ Sí | Requiere JWT válido |
| PATCH | ✅ Sí | Requiere JWT válido |
| OPTIONS | ❌ No | Preflight CORS |

## Variables de Entorno Requeridas

```env
JWT_SECRET=tu-secreto-seguro-aqui
JWT_EXPIRES_IN=24h
```

## Flujo de Validación

1. **Extracción**: Se extrae el token del header `Authorization`
2. **Verificación JWT**: Se valida firma y expiración con `jsonwebtoken`
3. **Hash del Token**: Se calcula SHA-256 del token
4. **Consulta DB**: Se busca el token hash en `user_tokens`
5. **Verificación Usuario**: Se comprueba que el usuario esté activo
6. **Adjuntar Info**: Se agrega `user` al objeto `request`
7. **Continuar**: Se permite el acceso al endpoint

## Seguridad

- ✅ Tokens hasheados con SHA-256 en base de datos
- ✅ Validación de revocación de tokens
- ✅ Verificación de expiración en DB y JWT
- ✅ Comprobación de estado activo del usuario
- ✅ Logs de intentos no autorizados
- ✅ Rate limiting combinado con ThrottlerGuard

## Testing

Para testear endpoints protegidos:

1. Hacer login para obtener token:
```bash
curl -X POST http://localhost:3000/users/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password"}'
```

2. Usar el token en requests protegidos:
```bash
curl -X POST http://localhost:3000/api/items \
  -H "Authorization: Bearer <tu-token-aqui>" \
  -H "Content-Type: application/json" \
  -d '{"name":"New Item"}'
```

## Desactivar para Testing/Desarrollo

Si necesitas desactivar temporalmente, comenta en `app.module.ts`:

```typescript
// {
//   provide: APP_INTERCEPTOR,
//   useClass: JwtAuthInterceptor,
// },
```

**⚠️ NO hacer esto en producción**
