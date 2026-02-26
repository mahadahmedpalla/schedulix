-- ==========================================
-- 1. Create User Roles Table
-- ==========================================
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid references auth.users on delete cascade not null primary key,
  role text not null check (role in ('admin', 'student')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own role
CREATE POLICY "Users can read own role"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = id);

-- ==========================================
-- 2. Update Events Table for Private Events
-- ==========================================
ALTER TABLE public.events 
  ADD COLUMN IF NOT EXISTS created_by uuid references auth.users default auth.uid(),
  ADD COLUMN IF NOT EXISTS is_global boolean default false;

-- ==========================================
-- 3. Update Events Table RLS Policies
-- ==========================================
-- Drop old policies (replace these names with your actual policy names if different)
DROP POLICY IF EXISTS "Anyone can select events" ON public.events;
DROP POLICY IF EXISTS "Admins can insert events" ON public.events;
DROP POLICY IF EXISTS "Admins can update events" ON public.events;
DROP POLICY IF EXISTS "Admins can delete events" ON public.events;

-- New SELECT Policy: Everyone sees global events, plus their own private events
CREATE POLICY "Users can see global and own events"
  ON public.events FOR SELECT
  USING (is_global = true OR created_by = auth.uid());

-- New INSERT Policy:
-- - Admins can insert global events
-- - Anyone logged in can insert non-global (private) events
CREATE POLICY "Users and admins can insert events"
  ON public.events FOR INSERT
  WITH CHECK (
    (is_global = false AND auth.uid() IS NOT NULL) 
    OR 
    (is_global = true AND EXISTS (
      SELECT 1 FROM public.user_roles WHERE id = auth.uid() AND role = 'admin'
    ))
  );

-- New UPDATE Policy:
-- - Admins can update global events
-- - Users can update their own private events
CREATE POLICY "Users and admins can update events"
  ON public.events FOR UPDATE
  USING (
    (is_global = false AND created_by = auth.uid()) 
    OR 
    (is_global = true AND EXISTS (
      SELECT 1 FROM public.user_roles WHERE id = auth.uid() AND role = 'admin'
    ))
  );

-- New DELETE Policy:
-- - Admins can delete global events
-- - Users can delete their own private events
CREATE POLICY "Users and admins can delete events"
  ON public.events FOR DELETE
  USING (
    (is_global = false AND created_by = auth.uid()) 
    OR 
    (is_global = true AND EXISTS (
      SELECT 1 FROM public.user_roles WHERE id = auth.uid() AND role = 'admin'
    ))
  );

-- ==========================================
-- 4. How to make an Admin
-- ==========================================
-- After signing up on the website, run this query to make yourself an admin:
-- INSERT INTO public.user_roles (id, role) VALUES ('PUT-YOUR-USER-ID-HERE', 'admin');
