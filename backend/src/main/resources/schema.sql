-- Ensures columns exist when Hibernate ddl-auto cannot alter (e.g. restricted pooler roles).
-- Safe to run every startup (IF NOT EXISTS).
ALTER TABLE users ADD COLUMN IF NOT EXISTS technician_category VARCHAR(32);
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS sla_deadline TIMESTAMP;
