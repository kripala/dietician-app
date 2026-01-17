-- V4__Add_audit_columns_to_role_actions.sql
-- Add missing audit columns to role_actions table

ALTER TABLE diet.role_actions
ADD COLUMN IF NOT EXISTS modified_by VARCHAR(100),
ADD COLUMN IF NOT EXISTS modified_date TIMESTAMP WITHOUT TIME ZONE;
