-- Add super_admin role to users table
-- First, create a new enum type with super_admin
CREATE TYPE user_role_enum AS ENUM ('customer', 'admin', 'super_admin');

-- Update the role column to use the new enum
ALTER TABLE users 
ALTER COLUMN role TYPE user_role_enum 
USING role::user_role_enum;

-- Drop the old enum type
DROP TYPE IF EXISTS user_role_enum_old;

-- Note: If you're using PostgreSQL and the above doesn't work, you can use:
-- ALTER TABLE users ALTER COLUMN role TYPE VARCHAR(20);
-- UPDATE users SET role = 'customer' WHERE role NOT IN ('customer', 'admin', 'super_admin'); 