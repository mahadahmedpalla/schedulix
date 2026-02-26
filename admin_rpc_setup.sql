-- ==========================================
-- Secure Admin Registration Function
-- ==========================================
-- This function allows a user to register as an admin IF they provide the correct secret key.
-- It requires the user to already be authenticated (logged in/signed up via normal Supabase Auth).

CREATE OR REPLACE FUNCTION public.make_admin_via_secret(secret_key text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER -- This is required so the function can bypass RLS to insert into user_roles
SET search_path = public -- Security best practice
AS $$
DECLARE
  -- This is the secret password you must type into the signup form.
  -- You can change this to whatever you want for your site!
  expected_key text := 'schedulix-admin-2024'; 
BEGIN
  -- Check if the provided key matches the expected secret key
  IF secret_key = expected_key THEN
    
    -- Insert or update the user in the user_roles table
    INSERT INTO public.user_roles (id, role) 
    VALUES (auth.uid(), 'admin')
    ON CONFLICT (id) DO UPDATE SET role = 'admin';
    
    RETURN true;
  ELSE
    RETURN false;
  END IF;
END;
$$;
