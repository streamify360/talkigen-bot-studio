
-- Add yahyahanifofficial@gmail.com as an admin
-- First, let's check if the user exists and get their ID, then add them to admin_roles
INSERT INTO public.admin_roles (user_id, role, granted_at)
VALUES ('b86b3869-c5ab-4c35-b68c-c9962a92eb62', 'admin', NOW())
ON CONFLICT (user_id) DO NOTHING;
