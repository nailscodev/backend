-- Script para crear todas las tablas de la aplicacion
-- Basado en los modelos Sequelize - Ejecutar DESPUES del reset
-- psql -U postgres -d nailsandco -f create-tables.sql

-- Enum types
CREATE TYPE user_role AS ENUM ('admin', 'manager', 'reception', 'staff', 'owner');
CREATE TYPE staff_role AS ENUM ('OWNER', 'MANAGER', 'TECHNICIAN', 'RECEPTIONIST');
CREATE TYPE staff_status AS ENUM ('ACTIVE', 'INACTIVE', 'ON_VACATION', 'SICK_LEAVE');
CREATE TYPE booking_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled', 'no_show');
CREATE TYPE payment_method AS ENUM ('CASH', 'CARD');
CREATE TYPE service_category AS ENUM ('NAILS', 'FACIAL', 'BODY', 'HAIR', 'ADDON');

-- 1. CATEGORIES Table (Categorías de servicios)
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "imageUrl" VARCHAR(500),
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 2. USERS Table (Sistema de autenticacion)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'staff',
    name VARCHAR(100) NOT NULL,
    avatar VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 2.1. USER_TOKENS Table (Tokens de autenticacion JWT)
CREATE TABLE IF NOT EXISTS user_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    revoked BOOLEAN NOT NULL DEFAULT false,
    last_used TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 3. SERVICES Table (Catalogo de servicios)
CREATE TABLE IF NOT EXISTS services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category service_category NOT NULL DEFAULT 'NAILS',
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    parent_category_id UUID REFERENCES categories(id),
    price INTEGER NOT NULL CHECK (price >= 0),
    duration INTEGER NOT NULL CHECK (duration >= 1),
    "bufferTime" INTEGER NOT NULL DEFAULT 15 CHECK ("bufferTime" >= 0),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPopular" BOOLEAN NOT NULL DEFAULT false,
    requirements TEXT[],
    "compatibleAddOns" UUID[],
    "imageUrl" VARCHAR(500),
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    combo BOOLEAN NOT NULL DEFAULT false,
    "associatedServiceIds" UUID[],
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "deletedAt" TIMESTAMP WITH TIME ZONE
);

-- 4. STAFF Table (Personal del salon)
CREATE TABLE IF NOT EXISTS staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "firstName" VARCHAR(100) NOT NULL,
    "lastName" VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(20),
    role staff_role NOT NULL DEFAULT 'TECHNICIAN',
    status staff_status NOT NULL DEFAULT 'ACTIVE',
    specialties TEXT[],
    "workingDays" TEXT[] DEFAULT ARRAY['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    shifts JSONB DEFAULT '[]',
    "commissionPercentage" DECIMAL(5,2) CHECK ("commissionPercentage" >= 0 AND "commissionPercentage" <= 100),
    "hourlyRate" INTEGER CHECK ("hourlyRate" >= 0),
    "startDate" DATE,
    "endDate" DATE,
    bio TEXT,
    "profilePictureUrl" VARCHAR(500),
    notes TEXT,
    "isBookable" BOOLEAN NOT NULL DEFAULT true,
    "isWebVisible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "deletedAt" TIMESTAMP WITH TIME ZONE
);

-- 4.1. STAFF_SERVICES Table (Relación many-to-many entre staff y servicios)
CREATE TABLE IF NOT EXISTS staff_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id UUID NOT NULL,
    service_id UUID NOT NULL,
    "isPreferred" BOOLEAN NOT NULL DEFAULT false,
    "proficiencyLevel" VARCHAR(20) DEFAULT 'STANDARD' CHECK ("proficiencyLevel" IN ('BEGINNER', 'STANDARD', 'ADVANCED', 'EXPERT')),
    notes TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(staff_id, service_id),
    CONSTRAINT fk_staff_services_staff FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE,
    CONSTRAINT fk_staff_services_service FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
);

-- 5. CUSTOMERS Table (Clientes)
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(255) NOT NULL,
    "firstName" VARCHAR(100) NOT NULL,
    "lastName" VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) NOT NULL,
    "birthDate" DATE,
    notes TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "deletedAt" TIMESTAMP WITH TIME ZONE
);

-- 6. BOOKINGS Table (Reservas/Citas)
CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "customerId" UUID REFERENCES customers(id) ON DELETE SET NULL,
    "serviceId" UUID REFERENCES services(id) ON DELETE SET NULL,
    "staffId" UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    "appointmentDate" DATE NOT NULL,
    "startTime" TIME NOT NULL,
    "endTime" TIME NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    notes TEXT,
    "totalPrice" DECIMAL(10,2),
    "paymentMethod" VARCHAR(50) DEFAULT 'cash',
    web BOOLEAN NOT NULL DEFAULT true,
    "cancellationReason" TEXT,
    "cancelledAt" TIMESTAMP WITH TIME ZONE,
    "addOnIds" UUID[],
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "deletedAt" TIMESTAMP WITH TIME ZONE
);

-- 7. ADDONS Table (Servicios adicionales/complementarios)
CREATE TABLE IF NOT EXISTS addons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price INTEGER NOT NULL CHECK (price >= 0),
    "additionalTime" INTEGER NOT NULL DEFAULT 0 CHECK ("additionalTime" >= 0),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    removal BOOLEAN NOT NULL DEFAULT false,
    "compatibleServiceIds" UUID[],
    "imageUrl" VARCHAR(500),
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "deletedAt" TIMESTAMP WITH TIME ZONE
);

-- 8. NOTIFICATIONS Table (Sistema de notificaciones)
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "customerId" UUID REFERENCES customers(id) ON DELETE CASCADE,
    "bookingId" UUID REFERENCES bookings(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    channel VARCHAR(50) NOT NULL,
    recipient VARCHAR(255) NOT NULL,
    subject VARCHAR(255),
    message TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    "sentAt" TIMESTAMP WITH TIME ZONE,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_user_tokens_user_id ON user_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_user_tokens_expires_at ON user_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_tokens_revoked ON user_tokens(revoked);

CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);
CREATE INDEX IF NOT EXISTS idx_categories_active ON categories("isActive");
CREATE INDEX IF NOT EXISTS idx_services_category_id ON services(category_id);
CREATE INDEX IF NOT EXISTS idx_services_parent_category ON services(parent_category_id);
CREATE INDEX IF NOT EXISTS idx_services_active ON services("isActive");

CREATE INDEX IF NOT EXISTS idx_staff_email ON staff(email);
CREATE INDEX IF NOT EXISTS idx_staff_status ON staff(status);
CREATE INDEX IF NOT EXISTS idx_staff_role ON staff(role);

CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);

CREATE INDEX IF NOT EXISTS idx_bookings_customer_id ON bookings("customerId");
CREATE INDEX IF NOT EXISTS idx_bookings_service_id ON bookings("serviceId");
CREATE INDEX IF NOT EXISTS idx_bookings_staff_id ON bookings("staffId");
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings("appointmentDate");
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);

CREATE INDEX IF NOT EXISTS idx_addons_active ON addons("isActive");
CREATE INDEX IF NOT EXISTS idx_addons_display_order ON addons("displayOrder");
CREATE INDEX IF NOT EXISTS idx_addons_compatible_services ON addons USING GIN("compatibleServiceIds");

-- 9. SERVICE_ADDONS Table (Tabla intermedia para relacionar servicios con add-ons)
CREATE TABLE IF NOT EXISTS service_addons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    service_id UUID NOT NULL,
    addon_id UUID NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign keys
    CONSTRAINT fk_service_addons_service 
        FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
    CONSTRAINT fk_service_addons_addon 
        FOREIGN KEY (addon_id) REFERENCES addons(id) ON DELETE CASCADE,
    
    -- Unique constraint para evitar duplicados
    CONSTRAINT uk_service_addon UNIQUE (service_id, addon_id)
);

-- Indices para la tabla service_addons
CREATE INDEX IF NOT EXISTS idx_service_addons_service_id ON service_addons(service_id);
CREATE INDEX IF NOT EXISTS idx_service_addons_addon_id ON service_addons(addon_id);

CREATE INDEX IF NOT EXISTS idx_notifications_customer_id ON notifications("customerId");
CREATE INDEX IF NOT EXISTS idx_notifications_booking_id ON notifications("bookingId");
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_channel ON notifications(channel);

-- 10. SERVICE_INCOMPATIBILITIES Table (Incompatibilidades entre categorías de servicios)
-- Define qué categorías son incompatibles entre sí
CREATE TABLE IF NOT EXISTS service_incompatibilities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    incompatible_category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Constraint para evitar duplicados y auto-referencias
    CONSTRAINT uk_category_incompatibility UNIQUE (category_id, incompatible_category_id),
    CONSTRAINT chk_no_self_reference CHECK (category_id != incompatible_category_id)
);

-- Índices para la tabla service_incompatibilities
CREATE INDEX IF NOT EXISTS idx_service_incompatibilities_category_id ON service_incompatibilities(category_id);
CREATE INDEX IF NOT EXISTS idx_service_incompatibilities_incompatible_category_id ON service_incompatibilities(incompatible_category_id);

-- 11. REMOVAL_STEP Table (Categorías que requieren paso de removal)
-- Define qué categorías necesitan mostrar el paso de removal en el flujo de booking
CREATE TABLE IF NOT EXISTS removal_step (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL UNIQUE REFERENCES categories(id) ON DELETE CASCADE,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Índice para la tabla removal_step
CREATE INDEX IF NOT EXISTS idx_removal_step_category_id ON removal_step(category_id);

-- 12. ADDON_INCOMPATIBILITIES Table (Incompatibilidades entre add-ons)
-- Define qué add-ons no pueden ser seleccionados juntos
CREATE TABLE IF NOT EXISTS addon_incompatibilities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    addon_id UUID NOT NULL REFERENCES addons(id) ON DELETE CASCADE,
    incompatible_addon_id UUID NOT NULL REFERENCES addons(id) ON DELETE CASCADE,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Constraint para evitar duplicados y auto-referencias
    CONSTRAINT uk_addon_incompatibility UNIQUE (addon_id, incompatible_addon_id),
    CONSTRAINT chk_no_self_reference_addon CHECK (addon_id != incompatible_addon_id)
);

-- Índices para la tabla addon_incompatibilities
CREATE INDEX IF NOT EXISTS idx_addon_incompatibilities_addon_id ON addon_incompatibilities(addon_id);
CREATE INDEX IF NOT EXISTS idx_addon_incompatibilities_incompatible_addon_id ON addon_incompatibilities(incompatible_addon_id);

-- 13. LANGUAGES Table (Idiomas soportados)
-- Define los idiomas disponibles en la aplicación
CREATE TABLE IF NOT EXISTS languages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(10) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 14. SERVICES_LANG Table (Traducciones de servicios)
-- Almacena las traducciones de título y descripción de servicios
CREATE TABLE IF NOT EXISTS services_lang (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    language_id UUID NOT NULL REFERENCES languages(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Constraint para evitar duplicados: un servicio solo puede tener una traducción por idioma
    CONSTRAINT uk_service_language UNIQUE (service_id, language_id)
);

-- 15. ADDONS_LANG Table (Traducciones de add-ons)
-- Almacena las traducciones de título y descripción de add-ons
CREATE TABLE IF NOT EXISTS addons_lang (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    addon_id UUID NOT NULL REFERENCES addons(id) ON DELETE CASCADE,
    language_id UUID NOT NULL REFERENCES languages(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Constraint para evitar duplicados: un addon solo puede tener una traducción por idioma
    CONSTRAINT uk_addon_language UNIQUE (addon_id, language_id)
);

-- 15.1. CATEGORIES_LANG Table (Traducciones de categorías)
-- Almacena las traducciones de título y descripción de categorías
CREATE TABLE IF NOT EXISTS categories_lang (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    language_id UUID NOT NULL REFERENCES languages(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Constraint para evitar duplicados: una categoría solo puede tener una traducción por idioma
    CONSTRAINT uk_category_language UNIQUE (category_id, language_id)
);

-- Índices para las tablas de traducciones
CREATE INDEX IF NOT EXISTS idx_languages_code ON languages(code);
CREATE INDEX IF NOT EXISTS idx_languages_active ON languages("isActive");
CREATE INDEX IF NOT EXISTS idx_services_lang_service_id ON services_lang(service_id);
CREATE INDEX IF NOT EXISTS idx_services_lang_language_id ON services_lang(language_id);
CREATE INDEX IF NOT EXISTS idx_addons_lang_addon_id ON addons_lang(addon_id);
CREATE INDEX IF NOT EXISTS idx_addons_lang_language_id ON addons_lang(language_id);
CREATE INDEX IF NOT EXISTS idx_categories_lang_category_id ON categories_lang(category_id);
CREATE INDEX IF NOT EXISTS idx_categories_lang_language_id ON categories_lang(language_id);

-- 16. COMBO_ELIGIBLE Table (Combinaciones elegibles para VIP Combo)
-- Define qué combinaciones de servicios en el carrito activan el paso de VIP Combo
-- Si los IDs de servicios en el carrito coinciden con alguna fila, se muestra el combo step
CREATE TABLE IF NOT EXISTS combo_eligible (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    "serviceIds" UUID[] NOT NULL,
    "extraPrice" INTEGER NOT NULL DEFAULT 0,
    "suggestedComboId" UUID REFERENCES services(id) ON DELETE SET NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Índices para la tabla combo_eligible
CREATE INDEX IF NOT EXISTS idx_combo_eligible_service_ids ON combo_eligible USING GIN("serviceIds");
CREATE INDEX IF NOT EXISTS idx_combo_eligible_active ON combo_eligible("isActive");
CREATE INDEX IF NOT EXISTS idx_combo_eligible_suggested ON combo_eligible("suggestedComboId");

-- 17. MANUAL_ADJUSTMENTS Table (Ajustes manuales para reconciliación)
-- Registra ingresos o gastos manuales no asociados a bookings (ej: propinas, gastos varios)
CREATE TABLE IF NOT EXISTS manual_adjustments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
    description TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    "paymentMethod" VARCHAR(20) NOT NULL CHECK ("paymentMethod" IN ('CASH', 'CARD')),
    "createdBy" UUID REFERENCES users(id) ON DELETE SET NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Índices para la tabla manual_adjustments
CREATE INDEX IF NOT EXISTS idx_manual_adjustments_type ON manual_adjustments(type);
CREATE INDEX IF NOT EXISTS idx_manual_adjustments_payment_method ON manual_adjustments("paymentMethod");
CREATE INDEX IF NOT EXISTS idx_manual_adjustments_created_by ON manual_adjustments("createdBy");
CREATE INDEX IF NOT EXISTS idx_manual_adjustments_created_at ON manual_adjustments("createdAt");

-- Triggers para updated_at automatico
-- Función para tablas con camelCase (updatedAt)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Función para tablas con snake_case (updated_at)
CREATE OR REPLACE FUNCTION update_updated_at_column_snake_case()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para tablas con snake_case
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column_snake_case();

CREATE TRIGGER update_user_tokens_updated_at BEFORE UPDATE ON user_tokens 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column_snake_case();

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_staff_updated_at BEFORE UPDATE ON staff 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_addons_updated_at BEFORE UPDATE ON addons 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para updated_at en service_addons
CREATE OR REPLACE FUNCTION update_service_addons_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_service_addons_updated_at
    BEFORE UPDATE ON service_addons
    FOR EACH ROW
    EXECUTE FUNCTION update_service_addons_updated_at();

CREATE TRIGGER update_service_incompatibilities_updated_at 
BEFORE UPDATE ON service_incompatibilities 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_removal_step_updated_at 
BEFORE UPDATE ON removal_step 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_languages_updated_at 
BEFORE UPDATE ON languages 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_lang_updated_at 
BEFORE UPDATE ON services_lang 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_addons_lang_updated_at 
BEFORE UPDATE ON addons_lang 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_lang_updated_at 
BEFORE UPDATE ON categories_lang 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_manual_adjustments_updated_at 
BEFORE UPDATE ON manual_adjustments 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 18. SCREEN_ROLES Table (Asociación de roles con pantallas del sistema)
-- Define qué roles pueden ver cada pantalla de la aplicación
CREATE TABLE IF NOT EXISTS screen_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    screen_id VARCHAR(50) NOT NULL,
    role user_role NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Constraint para evitar duplicados: un rol no puede tener acceso duplicado a la misma pantalla
    CONSTRAINT uk_screen_role UNIQUE (screen_id, role)
);

-- Índices para la tabla screen_roles
CREATE INDEX IF NOT EXISTS idx_screen_roles_screen_id ON screen_roles(screen_id);
CREATE INDEX IF NOT EXISTS idx_screen_roles_role ON screen_roles(role);

-- Trigger para updated_at en screen_roles
CREATE TRIGGER update_screen_roles_updated_at
BEFORE UPDATE ON screen_roles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =========================================================
-- Query Optimization Indexes
-- These indexes target the most frequent query patterns
-- (status+date dashboard reports, availability checks, etc.)
-- =========================================================

-- 1. Bookings: partial composite for dashboard completed-booking reports (7x hotspot)
CREATE INDEX IF NOT EXISTS idx_bookings_status_date
  ON bookings (status, "appointmentDate")
  WHERE "deletedAt" IS NULL;

-- 2. Bookings: partial composite for upcoming appointments widget
CREATE INDEX IF NOT EXISTS idx_bookings_upcoming
  ON bookings (status, "appointmentDate", "startTime")
  WHERE status IN ('pending', 'in_progress') AND "deletedAt" IS NULL;

-- 3. Bookings: partial composite for all date-range ORM queries
CREATE INDEX IF NOT EXISTS idx_bookings_not_deleted
  ON bookings ("appointmentDate", status)
  WHERE "deletedAt" IS NULL;

-- 4. Staff: composite for availability lookups (runs on every booking check)
CREATE INDEX IF NOT EXISTS idx_staff_availability
  ON staff (status, "isBookable", "isWebVisible")
  WHERE "deletedAt" IS NULL;

-- 5. Services: composite for catalog browsing
CREATE INDEX IF NOT EXISTS idx_services_catalog
  ON services ("isActive", "displayOrder", category_id)
  WHERE "deletedAt" IS NULL;

-- 6. Customers: partial covering index for email lookups in booking flow
CREATE INDEX IF NOT EXISTS idx_customers_active
  ON customers (email, "createdAt" DESC)
  WHERE "deletedAt" IS NULL;

-- 7. Manual adjustments: composite for financial report GROUP BY date + paymentMethod
CREATE INDEX IF NOT EXISTS idx_manual_adjustments_date_type
  ON manual_adjustments ("createdAt" DESC, type, "paymentMethod");

-- 8. Notifications: composite for status-based retry and cleanup queries
CREATE INDEX IF NOT EXISTS idx_notifications_pending
  ON notifications (status, "createdAt" DESC);

-- 9. Bookings: composite for staff availability checks
CREATE INDEX IF NOT EXISTS idx_bookings_staff_date
  ON bookings ("staffId", "appointmentDate");

-- 10. Bookings: descending createdAt for date-range report queries
CREATE INDEX IF NOT EXISTS idx_bookings_created_at_desc
  ON bookings ("createdAt" DESC);

-- =========================================================
-- 19. PERFORMANCE_TEST_RUNS Table
-- Persists performance/stress test run results for the backoffice
-- =========================================================
CREATE TABLE IF NOT EXISTS performance_test_runs (
    id               UUID          PRIMARY KEY,
    type             VARCHAR(20)   NOT NULL,
    status           VARCHAR(20)   NOT NULL DEFAULT 'running',
    started_at       TIMESTAMPTZ   NOT NULL,
    completed_at     TIMESTAMPTZ,
    progress         SMALLINT      NOT NULL DEFAULT 0,
    scenario         TEXT,
    target_endpoints JSONB,
    summary          JSONB,
    "createdAt"      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    "updatedAt"      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_perf_test_runs_status     ON performance_test_runs (status);
CREATE INDEX IF NOT EXISTS idx_perf_test_runs_started_at ON performance_test_runs (started_at DESC);

CREATE TRIGGER update_performance_test_runs_updated_at
BEFORE UPDATE ON performance_test_runs
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Verificacion final
SELECT 
    'Tablas creadas exitosamente:' as resultado,
    COUNT(*) as total_tablas
FROM information_schema.tables 
WHERE table_schema = 'public'
AND table_name IN ('users', 'services', 'staff', 'customers', 'bookings', 'addons', 'notifications', 'service_addons', 'service_incompatibilities', 'removal_step');