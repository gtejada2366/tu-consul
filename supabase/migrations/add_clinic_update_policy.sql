-- Allow admins to update their own clinic.
-- Without this, Settings > Clínica saves silently fail (RLS blocks UPDATE with 0 rows affected).
-- Does not depend on auth.user_clinic_id() because Supabase restricts CREATE FUNCTION in the auth schema.

CREATE POLICY "Admins can update their own clinic"
  ON clinics FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
        AND users.clinic_id = clinics.id
        AND users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
        AND users.clinic_id = clinics.id
        AND users.role = 'admin'
    )
  );
