-- ===============================================================================
-- DDL para el Sistema de Gestión Estratégica de Licencias
-- ===============================================================================

-- 1. Roles del Sistema
CREATE TABLE t1_licenses_roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE, -- Ej: 'ADMIN', 'VALIDATOR' (Revisa pagos), 'CLIENT'
    description TEXT
);

-- 2. Usuarios Consolidados (Administradores, Validadores y Clientes)
CREATE TABLE t1_licenses_users (
    id SERIAL PRIMARY KEY,
    role_id INT NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    company_name VARCHAR(150),
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    phone_number VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES t1_licenses_roles(id)
);

-- 3. Productos / Softwares a licenciar
-- Aunque sea para un software principalmente, es buena práctica tener la tabla
CREATE TABLE t1_licenses_products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Planes de Licenciamiento
-- Define cuánto cuesta y cuánto dura (ej: Plan Mensual, Anual, Lifetime)
CREATE TABLE t1_licenses_plans (
    id SERIAL PRIMARY KEY,
    product_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,       -- Ej: 'Licencia Anual Básico'
    duration_days INT NOT NULL,       -- Ej: 365. Si es de por vida, puede ser 99999
    price DECIMAL(10, 2) NOT NULL,    -- Precio del plan
    max_devices INT DEFAULT 1,        -- Cuántos PC's pueden usar esta licencia
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (product_id) REFERENCES t1_licenses_products(id)
);

-- 5. Registro de Pagos / Consignaciones (Proceso de Validación)
-- Aquí los clientes suben su evidencia de pago para ser aprobada o rechazada
CREATE TABLE t1_licenses_payments (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    plan_id INT NOT NULL,
    
    amount_paid DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(50),       -- 'BANCARIZACION', 'EFECTIVO', 'TRANSFERENCIA'
    reference_number VARCHAR(100),    -- Número de comprobante o recibo
    evidence_url VARCHAR(255),        -- URL/Ruta de la imagen o PDF del comprobante
    
    -- Estados: 'PENDING_VALIDATION', 'APPROVED', 'REJECTED'
    status VARCHAR(50) DEFAULT 'PENDING_VALIDATION', 
    rejection_reason TEXT,            -- Si se rechaza, especificar por qué (Ej: Imagen borrosa)
    
    reviewed_by INT,                  -- ID del usuario (Admin/Validator) que aprobó o rechazó
    reviewed_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES t1_licenses_users(id),
    FOREIGN KEY (plan_id) REFERENCES t1_licenses_plans(id),
    FOREIGN KEY (reviewed_by) REFERENCES t1_licenses_users(id)
);

-- 6. Licencias Emitidas (El CRUD principal)
-- Una licencia puede nacer de un pago aprobado, o ser generada manualmente por un Admin (ej: Cortesía)
CREATE TABLE t1_licenses_records (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    payment_id INT,                   -- Puede ser NULL si la licencia la regaló un Admin manualmente
    
    license_key VARCHAR(255) NOT NULL UNIQUE,
    
    start_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    end_date TIMESTAMP NOT NULL,      -- Esta fecha bloquea el login cuando expira
    
    -- Estados: 'ACTIVE', 'EXPIRED', 'SUSPENDED' (El admin puede suspenderla)
    status VARCHAR(50) DEFAULT 'ACTIVE',
    max_devices INT DEFAULT 1,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES t1_licenses_users(id),
    FOREIGN KEY (product_id) REFERENCES t1_licenses_products(id),
    FOREIGN KEY (payment_id) REFERENCES t1_licenses_payments(id)
);

-- 7. Dispositivos Vinculados a Licencias (Previene piratería o préstamo de licencias)
-- Al iniciar sesión el software registra su HWID (Hardware ID / MAC Address)
CREATE TABLE t1_licenses_devices (
    id SERIAL PRIMARY KEY,
    license_id INT NOT NULL,
    hardware_id VARCHAR(255) NOT NULL, -- Identificador único del PC/Dispositivo
    device_name VARCHAR(100),          -- Ej: 'PC-CONTABILIDAD'
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE (license_id, hardware_id),  -- Un mismo equipo no se duplica
    FOREIGN KEY (license_id) REFERENCES t1_licenses_records(id)
);

-- 8. Auditoría / Trazabilidad General
-- Guarda quién hizo qué en el sistema (Ej: "El Admin A aprobó el pago B", "El cliente C intentó loguearse")
CREATE TABLE t1_licenses_audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INT,                      -- Quién realizó la acción (Puede ser NULL si fue el sistema)
    entity_name VARCHAR(50),          -- 'PAYMENT', 'LICENSE', 'USER', 'LOGIN'
    entity_id INT,                    -- ID afectado
    action VARCHAR(100),              -- 'CREATED_PAYMENT', 'APPROVED_PAYMENT', 'REVOKED_LICENSE'
    details TEXT,                     -- JSON o texto con datos previos/nuevos
    ip_address VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES t1_licenses_users(id)
);
