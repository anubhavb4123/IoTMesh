-- Seed file to create admin user
-- Run this after creating a user account through the signup form

-- Replace 'user@example.com' with the actual email of the user you want to make admin
-- UPDATE public.user_roles
-- SET role = 'admin'
-- WHERE user_id = (
--   SELECT id FROM auth.users WHERE email = 'user@example.com'
-- );

-- Alternative: Insert admin role directly (uncomment and modify user_id)
-- INSERT INTO public.user_roles (user_id, role)
-- VALUES ('your-user-uuid-here', 'admin')
-- ON CONFLICT (user_id, role) DO NOTHING;

-- To find a user's UUID, you can check the Supabase dashboard or run:
-- SELECT id, email FROM auth.users;
