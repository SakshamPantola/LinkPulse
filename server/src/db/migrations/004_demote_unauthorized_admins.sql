-- Demote any users who gained 'admin' role through unauthorized email patterns.
-- Only the designated super admin (platform404@gmail.com) retains admin privileges.
UPDATE users 
SET role = 'user' 
WHERE role = 'admin' 
  AND LOWER(email) != 'platform404@gmail.com';
