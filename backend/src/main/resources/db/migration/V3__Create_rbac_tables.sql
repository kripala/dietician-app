-- V3__Create_rbac_tables.sql
-- RBAC tables for role-based access control with action-level permissions

-- ============================================
-- ACTIONS TABLE
-- ============================================

CREATE SEQUENCE actions_id_seq;

CREATE TABLE actions (
    id BIGINT PRIMARY KEY DEFAULT nextval('actions_id_seq'),
    action_code VARCHAR(50) NOT NULL UNIQUE,
    action_name VARCHAR(100) NOT NULL,
    description VARCHAR(255),
    module VARCHAR(50) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by VARCHAR(100) NOT NULL,
    created_date TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
    modified_by VARCHAR(100),
    modified_date TIMESTAMP WITHOUT TIME ZONE
);

CREATE INDEX idx_actions_module ON actions(module);
CREATE INDEX idx_actions_active ON actions(is_active);

COMMENT ON TABLE actions IS 'Granular actions/permissions for RBAC';
COMMENT ON COLUMN actions.action_code IS 'Unique action identifier: VIEW_PATIENT, CREATE_PATIENT, etc.';
COMMENT ON COLUMN actions.module IS 'Module grouping: PATIENT, DIETICIAN, ADMIN, APPOINTMENT, etc.';

-- ============================================
-- ROLE_ACTIONS TABLE (Role-Action Mapping)
-- ============================================

CREATE SEQUENCE role_actions_id_seq;

CREATE TABLE role_actions (
    id BIGINT PRIMARY KEY DEFAULT nextval('role_actions_id_seq'),
    role_id BIGINT NOT NULL,
    action_id BIGINT NOT NULL,
    created_by VARCHAR(100) NOT NULL,
    created_date TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT fk_role_action_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    CONSTRAINT fk_role_action_action FOREIGN KEY (action_id) REFERENCES actions(id) ON DELETE CASCADE,
    CONSTRAINT uk_role_action UNIQUE(role_id, action_id)
);

CREATE INDEX idx_role_actions_role ON role_actions(role_id);

COMMENT ON TABLE role_actions IS 'Maps roles to actions (many-to-many relationship)';

-- ============================================
-- PASSWORD_RESET_TOKENS TABLE
-- ============================================

CREATE SEQUENCE password_reset_tokens_id_seq;

CREATE TABLE password_reset_tokens (
    id BIGINT PRIMARY KEY DEFAULT nextval('password_reset_tokens_id_seq'),
    user_id BIGINT NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    expiry_timestamp TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    used BOOLEAN NOT NULL DEFAULT FALSE,
    created_date TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT fk_reset_token_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_password_reset_user ON password_reset_tokens(user_id);
CREATE INDEX idx_password_reset_token ON password_reset_tokens(token);

COMMENT ON TABLE password_reset_tokens IS 'Stores password reset tokens for admin-initiated password resets';

-- ============================================
-- SEED DATA: ACTIONS
-- ============================================

INSERT INTO actions (action_code, action_name, description, module, created_by) VALUES
-- Patient Module Actions
('VIEW_PATIENT', 'View Patient', 'View patient list and details', 'PATIENT', 'SYSTEM'),
('CREATE_PATIENT', 'Create Patient', 'Create new patient account', 'PATIENT', 'SYSTEM'),
('EDIT_PATIENT', 'Edit Patient', 'Edit patient information', 'PATIENT', 'SYSTEM'),
('DELETE_PATIENT', 'Delete Patient', 'Delete patient account', 'PATIENT', 'SYSTEM'),
('ACTIVATE_PATIENT', 'Activate Patient', 'Activate patient account', 'PATIENT', 'SYSTEM'),
('DEACTIVATE_PATIENT', 'Deactivate Patient', 'Deactivate patient account', 'PATIENT', 'SYSTEM'),
('RESET_PATIENT_PASSWORD', 'Reset Patient Password', 'Reset patient password (sends email)', 'PATIENT', 'SYSTEM'),

-- Dietician Module Actions
('VIEW_DIETICIAN', 'View Dietician', 'View dietician list and details', 'DIETICIAN', 'SYSTEM'),
('CREATE_DIETICIAN', 'Create Dietician', 'Create new dietician account', 'DIETICIAN', 'SYSTEM'),
('EDIT_DIETICIAN', 'Edit Dietician', 'Edit dietician information', 'DIETICIAN', 'SYSTEM'),
('DELETE_DIETICIAN', 'Delete Dietician', 'Delete dietician account', 'DIETICIAN', 'SYSTEM'),
('ACTIVATE_DIETICIAN', 'Activate Dietician', 'Activate dietician account', 'DIETICIAN', 'SYSTEM'),
('DEACTIVATE_DIETICIAN', 'Deactivate Dietician', 'Deactivate dietician account', 'DIETICIAN', 'SYSTEM'),
('RESET_DIETICIAN_PASSWORD', 'Reset Dietician Password', 'Reset dietician password (sends email)', 'DIETICIAN', 'SYSTEM'),

-- Admin Module Actions
('MANAGE_ROLES', 'Manage Roles', 'Assign roles and action permissions', 'ADMIN', 'SYSTEM'),
('VIEW_AUDIT_LOGS', 'View Audit Logs', 'View system audit logs', 'ADMIN', 'SYSTEM');

-- ============================================
-- SEED DATA: ROLE-ACTION MAPPINGS
-- ============================================

-- Admin (role_id = 1) gets ALL actions
INSERT INTO role_actions (role_id, action_id, created_by)
SELECT 1, id, 'SYSTEM' FROM actions;

-- Dietician (role_id = 2) gets limited patient actions
INSERT INTO role_actions (role_id, action_id, created_by)
SELECT 2, id, 'SYSTEM' FROM actions WHERE action_code IN (
    'VIEW_PATIENT',
    'EDIT_PATIENT'
);

-- Patient (role_id = 3) gets no management actions (only self-access)

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON actions TO dietician_user;
GRANT USAGE, SELECT ON SEQUENCE actions_id_seq TO dietician_user;

GRANT SELECT, INSERT, UPDATE, DELETE ON role_actions TO dietician_user;
GRANT USAGE, SELECT ON SEQUENCE role_actions_id_seq TO dietician_user;

GRANT SELECT, INSERT, UPDATE, DELETE ON password_reset_tokens TO dietician_user;
GRANT USAGE, SELECT ON SEQUENCE password_reset_tokens_id_seq TO dietician_user;
