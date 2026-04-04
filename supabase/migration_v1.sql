-- ============================================================
-- CARAXES — Supabase Migration v1
-- Tables: profiles, orders, messages, documents
-- + RLS Policies + Realtime + Storage + Auto-profile trigger
-- ============================================================

-- ── 1. PROFILES ──────────────────────────────────────────────
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  full_name   text,
  role        text not null default 'client' check (role in ('client', 'admin')),
  created_at  timestamptz not null default now()
);

comment on table public.profiles is 'User profiles — synced from auth.users';

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    'client'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ── 2. ORDERS ────────────────────────────────────────────────
create table if not exists public.orders (
  id          uuid primary key default gen_random_uuid(),
  client_id   uuid not null references public.profiles(id) on delete cascade,
  ref         text unique,
  product     text not null,
  quantity    integer default 0,
  budget      text default 'À définir',
  deadline    text default 'À définir',
  notes       text,
  status      integer not null default 0 check (status between 0 and 6),
  progress    integer not null default 0 check (progress between 0 and 100),
  supplier    text,
  city        text,
  created_at  timestamptz not null default now()
);

comment on table public.orders is 'Sourcing orders — one per product request';

-- Auto-generate ref like CRX-001
create or replace function public.generate_order_ref()
returns trigger
language plpgsql
as $$
declare
  next_num integer;
begin
  select coalesce(max(
    cast(substring(ref from 'CRX-(\d+)') as integer)
  ), 0) + 1
  into next_num
  from public.orders;

  new.ref := 'CRX-' || lpad(next_num::text, 3, '0');
  return new;
end;
$$;

drop trigger if exists set_order_ref on public.orders;
create trigger set_order_ref
  before insert on public.orders
  for each row
  when (new.ref is null)
  execute function public.generate_order_ref();


-- ── 3. MESSAGES ──────────────────────────────────────────────
create table if not exists public.messages (
  id              uuid primary key default gen_random_uuid(),
  order_id        uuid not null references public.orders(id) on delete cascade,
  sender_id       uuid not null references public.profiles(id) on delete cascade,
  sender_role     text not null check (sender_role in ('client', 'admin')),
  content         text not null,
  attachment_url  text,
  attachment_name text,
  read            boolean not null default false,
  created_at      timestamptz not null default now()
);

comment on table public.messages is 'Chat messages per order';

-- Index for fast message lookups
create index if not exists idx_messages_order_id on public.messages(order_id);
create index if not exists idx_messages_created_at on public.messages(order_id, created_at);


-- ── 4. DOCUMENTS ─────────────────────────────────────────────
create table if not exists public.documents (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid not null references public.orders(id) on delete cascade,
  name          text not null,
  size          text,
  storage_path  text not null,
  uploaded_by   uuid references public.profiles(id),
  created_at    timestamptz not null default now()
);

comment on table public.documents is 'Files attached to orders (stored in Supabase Storage)';

create index if not exists idx_documents_order_id on public.documents(order_id);


-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.profiles enable row level security;
alter table public.orders   enable row level security;
alter table public.messages  enable row level security;
alter table public.documents enable row level security;

-- ── PROFILES RLS ─────────────────────────────────────────────
-- Everyone can read their own profile
create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- Admins can read all profiles
create policy "Admins can read all profiles"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Users can update their own profile
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);


-- ── ORDERS RLS ───────────────────────────────────────────────
-- Clients see only their orders
create policy "Clients can read own orders"
  on public.orders for select
  using (client_id = auth.uid());

-- Admins see all orders
create policy "Admins can read all orders"
  on public.orders for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Clients can create orders (for themselves)
create policy "Clients can create orders"
  on public.orders for insert
  with check (client_id = auth.uid());

-- Admins can create orders (for any client)
create policy "Admins can create orders"
  on public.orders for insert
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Admins can update any order
create policy "Admins can update orders"
  on public.orders for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Admins can delete orders
create policy "Admins can delete orders"
  on public.orders for delete
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );


-- ── MESSAGES RLS ─────────────────────────────────────────────
-- Users can read messages on their own orders
create policy "Clients can read own order messages"
  on public.messages for select
  using (
    exists (
      select 1 from public.orders
      where orders.id = messages.order_id
        and orders.client_id = auth.uid()
    )
  );

-- Admins can read all messages
create policy "Admins can read all messages"
  on public.messages for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Users can send messages on their own orders
create policy "Clients can send messages on own orders"
  on public.messages for insert
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.orders
      where orders.id = order_id
        and orders.client_id = auth.uid()
    )
  );

-- Admins can send messages on any order
create policy "Admins can send messages"
  on public.messages for insert
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Admins can mark messages as read
create policy "Admins can update messages"
  on public.messages for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Clients can mark messages as read on own orders
create policy "Clients can update own order messages"
  on public.messages for update
  using (
    exists (
      select 1 from public.orders
      where orders.id = messages.order_id
        and orders.client_id = auth.uid()
    )
  );


-- ── DOCUMENTS RLS ────────────────────────────────────────────
-- Clients can see documents on their own orders
create policy "Clients can read own order documents"
  on public.documents for select
  using (
    exists (
      select 1 from public.orders
      where orders.id = documents.order_id
        and orders.client_id = auth.uid()
    )
  );

-- Admins can see all documents
create policy "Admins can read all documents"
  on public.documents for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Admins can insert documents
create policy "Admins can upload documents"
  on public.documents for insert
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Clients can insert documents on their own orders
create policy "Clients can upload documents on own orders"
  on public.documents for insert
  with check (
    exists (
      select 1 from public.orders
      where orders.id = order_id
        and orders.client_id = auth.uid()
    )
  );


-- ============================================================
-- REALTIME — Enable for messages and orders
-- ============================================================

alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.orders;


-- ============================================================
-- STORAGE — Bucket for documents
-- ============================================================

insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

-- Storage RLS: Admins can upload/read anything
create policy "Admins full access to documents bucket"
  on storage.objects for all
  using (
    bucket_id = 'documents'
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Clients can read files in their order folders
create policy "Clients can read own order files"
  on storage.objects for select
  using (
    bucket_id = 'documents'
    and exists (
      select 1 from public.orders
      where orders.client_id = auth.uid()
        and storage.objects.name like orders.id::text || '/%'
    )
  );

-- Clients can upload to their order folders
create policy "Clients can upload to own order folders"
  on storage.objects for insert
  with check (
    bucket_id = 'documents'
    and exists (
      select 1 from public.orders
      where orders.client_id = auth.uid()
        and storage.objects.name like orders.id::text || '/%'
    )
  );


-- ============================================================
-- SEED DATA — Set your own user as admin
-- Run this AFTER you sign up with your email:
-- ============================================================
-- update public.profiles
-- set role = 'admin'
-- where email = 'zizoubensky@icloud.com';
