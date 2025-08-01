-- Remove super_admin role from users table
-- Update the role column to only allow 'customer' and 'admin'

-- First, update any existing super_admin users to admin
UPDATE users SET role = 'admin' WHERE role = 'super_admin';

-- Create a new enum type without super_admin
CREATE TYPE user_role_enum_new AS ENUM ('customer', 'admin');

-- Update the role column to use the new enum
ALTER TABLE users 
ALTER COLUMN role TYPE user_role_enum_new 
USING role::user_role_enum_new;

-- Drop the old enum type
DROP TYPE IF EXISTS user_role_enum;

-- Rename the new enum to the original name
ALTER TYPE user_role_enum_new RENAME TO user_role_enum;

-- Note: If you're using PostgreSQL and the above doesn't work, you can use:
-- ALTER TABLE users ALTER COLUMN role TYPE VARCHAR(20);
-- UPDATE users SET role = 'admin' WHERE role = 'super_admin';
-- ALTER TABLE users ADD CONSTRAINT check_role CHECK (role IN ('customer', 'admin')); 