# Guía de Testing - JWT Interceptor

Esta guía te ayudará a probar que el interceptor JWT está funcionando correctamente.

## 🧪 Pruebas Manuales con cURL

### 1. Login y Obtener Token

```bash
curl -X POST http://localhost:3000/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "usernameOrEmail": "admin",
    "password": "tu-password"
  }'
```

**Respuesta esperada:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid-here",
    "username": "admin",
    "email": "admin@example.com",
    "role": "admin"
  }
}
```

### 2. GET Request (Público - NO requiere token)

```bash
curl -X GET http://localhost:3000/users
```

**Resultado:** ✅ Funciona sin token

### 3. POST Request SIN Token (Debe Fallar)

```bash
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "Test123!",
    "name": "Test User",
    "role": "staff"
  }'
```

**Respuesta esperada:**
```json
{
  "statusCode": 401,
  "message": "Authorization header is required for this request",
  "error": "Unauthorized"
}
```

### 4. POST Request CON Token (Debe Funcionar)

```bash
# Reemplaza YOUR_TOKEN_HERE con el token del paso 1
curl -X POST http://localhost:3000/users \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "Test123!",
    "name": "Test User",
    "role": "staff"
  }'
```

**Resultado:** ✅ Usuario creado exitosamente

### 5. PUT Request CON Token

```bash
curl -X PUT http://localhost:3000/users/USER_ID \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Name"
  }'
```

**Resultado:** ✅ Usuario actualizado

### 6. DELETE Request CON Token

```bash
curl -X DELETE http://localhost:3000/users/USER_ID \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Resultado:** ✅ Usuario eliminado (si tienes permisos)

## 🧪 Pruebas con Postman

### Configuración de Environment

1. Crear variable `base_url` = `http://localhost:3000`
2. Crear variable `token` = (vacía inicialmente)

### Request 1: Login

```
POST {{base_url}}/users/login
Content-Type: application/json

{
  "usernameOrEmail": "admin",
  "password": "password"
}
```

**Tests Script:**
```javascript
// Guardar token automáticamente
const response = pm.response.json();
pm.environment.set("token", response.accessToken);
```

### Request 2: Crear Usuario (Protegido)

```
POST {{base_url}}/users
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "username": "newuser",
  "email": "new@example.com",
  "password": "Password123!",
  "name": "New User",
  "role": "staff"
}
```

### Request 3: Obtener Usuarios (Público)

```
GET {{base_url}}/users
```

## 📝 Casos de Prueba

### ✅ Casos que DEBEN Funcionar

| Método | Endpoint | Token | Resultado Esperado |
|--------|----------|-------|-------------------|
| POST | `/users/login` | ❌ No | 200 OK (público) |
| GET | `/users` | ❌ No | 200 OK (público) |
| GET | `/users/:id` | ❌ No | 200 OK (público) |
| POST | `/users` | ✅ Sí | 201 Created |
| PUT | `/users/:id` | ✅ Sí | 200 OK |
| DELETE | `/users/:id` | ✅ Sí | 200 OK |

### ❌ Casos que DEBEN Fallar (401 Unauthorized)

| Método | Endpoint | Token | Mensaje Esperado |
|--------|----------|-------|-----------------|
| POST | `/users` | ❌ No | "Authorization header is required" |
| PUT | `/users/:id` | ❌ No | "Authorization header is required" |
| DELETE | `/users/:id` | ❌ No | "Authorization header is required" |
| POST | `/users` | 🔴 Token inválido | "Invalid token" |
| POST | `/users` | 🔴 Token expirado | "Token has expired" |
| POST | `/users` | 🔴 Token revocado | "Invalid or revoked token" |

## 🔍 Verificación de Logs

Cuando ejecutes las pruebas, deberías ver logs como estos en la consola:

### Login Exitoso
```
[UserService] User admin logged in successfully
```

### Request Protegido Sin Token
```
[JwtAuthInterceptor] Unauthorized POST request to /users: Missing Authorization header
```

### Request Con Token Válido
```
[JwtAuthInterceptor] Authenticated user admin for POST /users
```

### Token Inválido
```
[JwtAuthInterceptor] Invalid JWT token: invalid signature
```

## 🧪 Pruebas Automatizadas (Ejemplo con Jest)

```typescript
describe('JWT Interceptor', () => {
  let app: INestApplication;
  let token: string;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Login para obtener token
    const loginResponse = await request(app.getHttpServer())
      .post('/users/login')
      .send({
        usernameOrEmail: 'admin',
        password: 'password',
      });
    
    token = loginResponse.body.accessToken;
  });

  it('GET /users should work without token', () => {
    return request(app.getHttpServer())
      .get('/users')
      .expect(200);
  });

  it('POST /users without token should return 401', () => {
    return request(app.getHttpServer())
      .post('/users')
      .send({
        username: 'test',
        email: 'test@example.com',
        password: 'Test123!',
      })
      .expect(401)
      .expect((res) => {
        expect(res.body.message).toContain('Authorization header is required');
      });
  });

  it('POST /users with valid token should work', () => {
    return request(app.getHttpServer())
      .post('/users')
      .set('Authorization', `Bearer ${token}`)
      .send({
        username: 'newuser',
        email: 'new@example.com',
        password: 'Password123!',
        name: 'New User',
        role: 'staff',
      })
      .expect(201);
  });

  it('POST /users with invalid token should return 401', () => {
    return request(app.getHttpServer())
      .post('/users')
      .set('Authorization', 'Bearer invalid-token-here')
      .send({
        username: 'test',
        email: 'test@example.com',
        password: 'Test123!',
      })
      .expect(401);
  });

  it('PUT /users/:id without token should return 401', () => {
    return request(app.getHttpServer())
      .put('/users/some-id')
      .send({ name: 'Updated' })
      .expect(401);
  });

  it('DELETE /users/:id without token should return 401', () => {
    return request(app.getHttpServer())
      .delete('/users/some-id')
      .expect(401);
  });

  afterAll(async () => {
    await app.close();
  });
});
```

## 🐛 Troubleshooting

### Problema: "Authorization header is required" en GET requests

**Solución:** Verifica que el método `intercept()` permita GET sin token:
```typescript
if (method === 'GET' || method === 'OPTIONS') {
  return next.handle();
}
```

### Problema: "Invalid or revoked token" con token válido

**Posibles causas:**
1. Token no existe en la tabla `user_tokens`
2. Columna `revoked` está en `true`
3. Token expiró en la base de datos

**Verificar en BD:**
```sql
SELECT * FROM user_tokens WHERE user_id = 'user-uuid' AND revoked = false;
```

### Problema: Login funciona pero otros endpoints dan 401

**Verificar:**
1. El token se está enviando correctamente en el header
2. Formato correcto: `Authorization: Bearer <token>`
3. El token no ha expirado

### Problema: El interceptor no se está ejecutando

**Verificar en `app.module.ts`:**
```typescript
{
  provide: APP_INTERCEPTOR,
  useClass: JwtAuthInterceptor,
}
```

## 📊 Checklist de Verificación

- [ ] Login retorna token JWT
- [ ] GET requests funcionan SIN token
- [ ] POST requests requieren token
- [ ] PUT requests requieren token  
- [ ] DELETE requests requieren token
- [ ] POST/PUT/DELETE sin token retornan 401
- [ ] Endpoints con `@Public()` funcionan sin token
- [ ] Token inválido retorna 401
- [ ] Token expirado retorna 401
- [ ] Usuario inactivo retorna 401
- [ ] `@CurrentUser()` funciona en endpoints protegidos

## 🎯 Testing Completo Exitoso

Si todos los casos de prueba pasan, el interceptor JWT está funcionando correctamente y tu API está protegida. 🎉

---

**Última actualización:** Diciembre 10, 2025
