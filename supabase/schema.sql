-- ═══════════════════════════════════════════════════════
-- CARAXE — Supabase Schema
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- ═══════════════════════════════════════════════════════

-- 1. PROFILES (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  company TEXT,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'client' CHECK (role IN ('client', 'admin')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'client')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. ORDERS
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ref TEXT UNIQUE NOT NULL, -- CRX-2026-XXXX
  client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  budget TEXT,
  deadline TEXT,
  notes TEXT,
  status INTEGER NOT NULL DEFAULT 0 CHECK (status BETWEEN 0 AND 6),
  -- 0=En attente, 1=Recherche, 2=Négo, 3=Échantillon, 4=Production, 5=Expédition, 6=Livré
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  supplier TEXT DEFAULT '—',
  city TEXT DEFAULT '—',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Auto-generate ref on insert
CREATE OR REPLACE FUNCTION public.generate_order_ref()
RETURNS TRIGGER AS $$
DECLARE
  next_num INTEGER;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(ref FROM 10) AS INTEGER)), 0) + 1
    INTO next_num FROM public.orders;
  NEW.ref := 'CRX-' || EXTRACT(YEAR FROM now())::TEXT || '-' || LPAD(next_num::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_order_ref
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  WHEN (NEW.ref IS NULL OR NEW.ref = '')
  EXECUTE FUNCTION public.generate_order_ref();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER orders_updated
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

-- 3. MESSAGES
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id),
  sender_role TEXT NOT NULL CHECK (sender_role IN ('client', 'admin')),
  content TEXT NOT NULL,
  attachment_url TEXT,
  attachment_name TEXT,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. DOCUMENTS (files attached to orders)
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  size TEXT,
  storage_path TEXT NOT NULL, -- path in Supabase Storage
  uploaded_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ═══════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Helper: check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- PROFILES
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (id = auth.uid() OR public.is_admin());

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid());

-- ORDERS
CREATE POLICY "Clients see own orders"
  ON public.orders FOR SELECT
  USING (client_id = auth.uid() OR public.is_admin());

CREATE POLICY "Clients can create orders"
  ON public.orders FOR INSERT
  WITH CHECK (client_id = auth.uid());

CREATE POLICY "Admins can update orders"
  ON public.orders FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Admins can delete orders"
  ON public.orders FOR DELETE
  USING (public.is_admin());

-- MESSAGES
CREATE POLICY "Users see messages of their orders"
  ON public.messages FOR SELECT
  USING (
    public.is_admin() OR
    EXISTS (SELECT 1 FROM public.orders WHERE orders.id = messages.order_id AND orders.client_id = auth.uid())
  );

CREATE POLICY "Users can send messages on their orders"
  ON public.messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() AND (
      public.is_admin() OR
      EXISTS (SELECT 1 FROM public.orders WHERE orders.id = messages.order_id AND orders.client_id = auth.uid())
    )
  );

CREATE POLICY "Users can mark messages as read"
  ON public.messages FOR UPDATE
  USING (
    public.is_admin() OR
    EXISTS (SELECT 1 FROM public.orders WHERE orders.id = messages.order_id AND orders.client_id = auth.uid())
  );

-- DOCUMENTS
CREATE POLICY "Users see documents of their orders"
  ON public.documents FOR SELECT
  USING (
    public.is_admin() OR
    EXISTS (SELECT 1 FROM public.orders WHERE orders.id = documents.order_id AND orders.client_id = auth.uid())
  );

CREATE POLICY "Admins can upload documents"
  ON public.documents FOR INSERT
  WITH CHECK (public.is_admin());

-- ═══════════════════════════════════════════════════════
-- STORAGE BUCKET
-- ═══════════════════════════════════════════════════════

INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can read documents"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'documents' AND auth.role() = 'authenticated');

CREATE POLICY "Admins can upload documents"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'documents' AND public.is_admin());

-- ═══════════════════════════════════════════════════════
-- REALTIME (enable for messages + orders)
-- ═══════════════════════════════════════════════════════

ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;

-- ═══════════════════════════════════════════════════════
-- SEED: Make yourself admin
-- Replace with YOUR email after signup
-- ═══════════════════════════════════════════════════════
-- UPDATE public.profiles SET role = 'admin' WHERE email = 'zizoubensky@icloud.com';