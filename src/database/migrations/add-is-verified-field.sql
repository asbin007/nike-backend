-- Add isVerified field to users table
ALTER TABLE users ADD COLUMN isVerified BOOLEAN DEFAULT FALSE;

-- Update existing users to be verified (optional)
UPDATE users SET isVerified = TRUE WHERE isVerified IS NULL; 