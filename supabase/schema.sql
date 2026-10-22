-- Core production tables for Mani Beauty

create table if not exists public.bookings (
  id text primary key,
  name text not null,
  email text not null,
  phone text not null,
  service text not null,
  service_label text not null,
  date text not null,
  time text not null,
  notes text not null default '',
  status text not null default 'pending',
  payment_status text not null default 'not-required',
  payment_reference text,
  payment_method text,
  payment_amount numeric(12,2),
  payment_currency text,
  payment_channel text,
  payment_transaction_id text,
  payment_details jsonb not null default '{}'::jsonb,
  paid_at timestamptz,
  booked_date timestamptz not null default now()
);

create index if not exists bookings_booked_date_idx
  on public.bookings (booked_date desc);

create unique index if not exists bookings_payment_reference_idx
  on public.bookings (payment_reference);

create table if not exists public.catalog (
  id integer primary key,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.product_orders (
  id text primary key,
  name text not null,
  email text not null,
  phone text not null,
  address text not null,
  note text not null default '',
  items jsonb not null,
  status text not null default 'pending',
  payment_status text not null default 'pending',
  payment_reference text,
  payment_method text,
  payment_amount numeric(12,2),
  payment_currency text,
  payment_channel text,
  payment_transaction_id text,
  payment_details jsonb not null default '{}'::jsonb,
  paid_at timestamptz,
  ordered_at timestamptz not null default now()
);

create index if not exists product_orders_ordered_at_idx
  on public.product_orders (ordered_at desc);

create index if not exists product_orders_status_idx
  on public.product_orders (status);

create unique index if not exists product_orders_payment_reference_idx
  on public.product_orders (payment_reference);

create table if not exists public.audit_logs (
  id text primary key,
  timestamp timestamptz not null default now(),
  email text not null,
  action text not null,
  details jsonb not null default '{}'::jsonb
);

create index if not exists audit_logs_timestamp_idx
  on public.audit_logs (timestamp desc);

-- Ensure a default catalog row exists for upsert logic
insert into public.catalog (id, payload)
values (
  1,
  '{"services": [], "products": []}'::jsonb
)
on conflict (id) do nothing;
