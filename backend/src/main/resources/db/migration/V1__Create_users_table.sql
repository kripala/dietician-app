-- V1__Create_initial_schema.sql
-- Initial database schema with master tables and audit fields

-- ============================================
-- MASTER TABLES
-- ============================================

CREATE SEQUENCE roles_id_seq;

CREATE TABLE roles (
    id BIGINT PRIMARY KEY DEFAULT nextval('roles_id_seq'),
    role_code VARCHAR(20) NOT NULL UNIQUE,
    role_name VARCHAR(50) NOT NULL,
    description VARCHAR(200),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by VARCHAR(100) NOT NULL,
    created_date TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_by VARCHAR(100),
    modified_date TIMESTAMP WITHOUT TIME ZONE
);

CREATE INDEX idx_roles_code ON roles(role_code);
CREATE INDEX idx_roles_active ON roles(is_active);

COMMENT ON TABLE roles IS 'Master table for user roles';
COMMENT ON COLUMN roles.role_code IS 'Unique code: DIETICIAN, PATIENT, ADMIN';

-- ============================================
-- CORE TABLES
-- ============================================

CREATE SEQUENCE users_id_seq ;

CREATE TABLE users (
    id BIGINT PRIMARY KEY DEFAULT nextval('users_id_seq'),
    email VARCHAR(500) NOT NULL UNIQUE,
    email_search VARCHAR(128) NOT NULL UNIQUE,
    password VARCHAR(100),
    google_id VARCHAR(100) UNIQUE,
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    otp_code VARCHAR(10),
    otp_expiry TIMESTAMP WITHOUT TIME ZONE,
    role_id BIGINT NOT NULL,
    full_name VARCHAR(100),
    profile_picture_url VARCHAR(500),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by VARCHAR(100) NOT NULL,
    created_date TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_by VARCHAR(100),
    modified_date TIMESTAMP WITHOUT TIME ZONE,
    CONSTRAINT fk_user_role FOREIGN KEY (role_id) REFERENCES roles(id)
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_email_search ON users(email_search);
CREATE INDEX idx_users_google_id ON users(google_id);
CREATE INDEX idx_users_role ON users(role_id);
CREATE INDEX idx_users_email_verified ON users(email_verified);
CREATE INDEX idx_users_active ON users(is_active);

COMMENT ON TABLE users IS 'Users table storing both dieticians and patients';
COMMENT ON COLUMN users.email IS 'Encrypted email address using AES-256-GCM at application level';
COMMENT ON COLUMN users.password IS 'BCrypt hashed password, NULL for OAuth users';
COMMENT ON COLUMN users.google_id IS 'Google OAuth provider ID';

-- ============================================
-- AUDIT TABLES
-- ============================================

CREATE SEQUENCE audit_logs_id_seq;

CREATE TABLE audit_logs (
    id BIGINT PRIMARY KEY DEFAULT nextval('audit_logs_id_seq'),
    table_name VARCHAR(50) NOT NULL,
    record_id BIGINT NOT NULL,
    action VARCHAR(20) NOT NULL,
    changed_by VARCHAR(100) NOT NULL,
    changed_date TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent VARCHAR(255)
);

CREATE INDEX idx_audit_table_record ON audit_logs(table_name, record_id);
CREATE INDEX idx_audit_changed_by ON audit_logs(changed_by);
CREATE INDEX idx_audit_changed_date ON audit_logs(changed_date);

COMMENT ON TABLE audit_logs IS 'Audit log for tracking all data changes';
COMMENT ON COLUMN audit_logs.action IS 'Action type: INSERT, UPDATE, DELETE';

CREATE SEQUENCE audit_log_details_id_seq;

CREATE TABLE audit_log_details (
    id BIGINT PRIMARY KEY DEFAULT nextval('audit_log_details_id_seq'),
    audit_log_id BIGINT NOT NULL,
    field_name VARCHAR(50) NOT NULL,
    old_value TEXT,
    new_value TEXT,
    CONSTRAINT fk_audit_log FOREIGN KEY (audit_log_id) REFERENCES audit_logs(id) ON DELETE CASCADE
);

CREATE INDEX idx_audit_details_log ON audit_log_details(audit_log_id);
CREATE INDEX idx_audit_details_field ON audit_log_details(field_name);

COMMENT ON TABLE audit_log_details IS 'Detailed field-level changes for audit logs';

-- ============================================
-- SEED DATA
-- ============================================

-- Insert default roles
INSERT INTO roles (role_code, role_name, description, created_by, created_date) VALUES
('ADMIN', 'Administrator', 'System administrator with full access', 'SYSTEM', CURRENT_TIMESTAMP),
('DIETICIAN', 'Dietician', 'Healthcare professional providing dietary consultations', 'SYSTEM', CURRENT_TIMESTAMP),
('PATIENT', 'Patient', 'User seeking dietary consultation and guidance', 'SYSTEM', CURRENT_TIMESTAMP);

-- Sequences already auto-increment; no manual reset needed
