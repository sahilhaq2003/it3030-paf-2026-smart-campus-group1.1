-- Ensures columns exist when Hibernate ddl-auto cannot alter (e.g. restricted pooler roles).
-- Safe to run every startup (IF NOT EXISTS).
ALTER TABLE users ADD COLUMN IF NOT EXISTS technician_category VARCHAR(32);
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS sla_deadline TIMESTAMP;

-- Keep role check constraint in sync with backend enum values.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'user_roles_role_check'
    ) THEN
        ALTER TABLE user_roles DROP CONSTRAINT user_roles_role_check;
    END IF;
END $$;

ALTER TABLE user_roles
    ADD CONSTRAINT user_roles_role_check
    CHECK (role IN ('USER', 'LECTURER', 'ADMIN', 'TECHNICIAN', 'MANAGER'));
