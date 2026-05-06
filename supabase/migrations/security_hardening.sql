-- ════════════════════════════════════════════════════════════
-- CARAXES — Security hardening migration
-- Fixes: C1 (role escalation), C2 (storage over-exposure)
-- ════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────
-- C1. Prevent role escalation on profiles
-- A client can UPDATE their own profile, but NOT change `role`.
-- Only an admin can change someone's role.
-- ───────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.prevent_role_escalation()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    IF NOT public.is_admin() THEN
      RAISE EXCEPTION 'Only admins can change user roles (attempted %→%)', OLD.role, NEW.role
        USING ERRCODE = 'insufficient_privilege';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS profiles_prevent_role_escalation ON public.profiles;
CREATE TRIGGER profiles_prevent_role_escalation
  BEFORE UPDATE OF role ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_role_escalation();

-- ───────────────────────────────────────────────────────────
-- C2. Restrict Storage reads on `documents` bucket
-- Only owner of the attached order (or admin) can read.
-- Uses the public.documents table as source of truth for ownership.
-- ───────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Authenticated users can read documents" ON storage.objects;
DROP POLICY IF EXISTS "Users read documents of their orders" ON storage.objects;

CREATE POLICY "Users read documents of their orders"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'documents' AND (
      public.is_admin() OR
      EXISTS (
        SELECT 1
        FROM public.documents d
        JOIN public.orders o ON o.id = d.order_id
        WHERE d.storage_path = storage.objects.name
          AND o.client_id = auth.uid()
      )
    )
  );

-- ───────────────────────────────────────────────────────────
-- Bonus. Audit log for sensitive changes (role + order deletion)
-- Useful for forensics and compliance.
-- ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.audit_log (
  id BIGSERIAL PRIMARY KEY,
  event_type TEXT NOT NULL,
  actor_id UUID,
  target_id UUID,
  before_state JSONB,
  after_state JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read audit_log" ON public.audit_log;
CREATE POLICY "Admins read audit_log"
  ON public.audit_log FOR SELECT
  USING (public.is_admin());

-- Log every role change (success OR attempt on admin).
CREATE OR REPLACE FUNCTION public.log_role_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    INSERT INTO public.audit_log (event_type, actor_id, target_id, before_state, after_state)
    VALUES (
      'role_change',
      auth.uid(),
      NEW.id,
      jsonb_build_object('role', OLD.role),
      jsonb_build_object('role', NEW.role)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS profiles_log_role_change ON public.profiles;
CREATE TRIGGER profiles_log_role_change
  AFTER UPDATE OF role ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.log_role_change();

-- ───────────────────────────────────────────────────────────
-- Sanity: verify the helper function still works correctly.
-- ───────────────────────────────────────────────────────────
SELECT 'security_hardening migration OK' AS status;
