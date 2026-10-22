-- Fix Supabase schema to include payment fields
-- Run this in the Supabase SQL Editor

-- Drop existing bookings table and recreate with payment fields
drop table if exists public.bookings cascade;

create table public.bookings (
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

create index bookings_booked_date_idx on public.bookings (booked_date desc);

-- Drop existing product_orders table and recreate with payment fields
drop table if exists public.product_orders cascade;

create table public.product_orders (
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

create index product_orders_ordered_at_idx on public.product_orders (ordered_at desc);
create index product_orders_status_idx on public.product_orders (status);

-- Grant permissions to service role (admin client)
grant all on public.bookings to service_role;
grant all on public.product_orders to service_role;
