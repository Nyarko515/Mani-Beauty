-- Run once in Supabase Dashboard -> SQL Editor before deploying the payment-tracking backend.
alter table public.bookings
  add column if not exists payment_status text not null default 'not-required',
  add column if not exists payment_reference text,
  add column if not exists payment_method text,
  add column if not exists payment_amount numeric(12,2),
  add column if not exists payment_currency text,
  add column if not exists payment_channel text,
  add column if not exists payment_transaction_id text,
  add column if not exists payment_details jsonb not null default '{}'::jsonb,
  add column if not exists paid_at timestamptz;

alter table public.product_orders
  add column if not exists payment_status text not null default 'pending',
  add column if not exists payment_reference text,
  add column if not exists payment_method text,
  add column if not exists payment_amount numeric(12,2),
  add column if not exists payment_currency text,
  add column if not exists payment_channel text,
  add column if not exists payment_transaction_id text,
  add column if not exists payment_details jsonb not null default '{}'::jsonb,
  add column if not exists paid_at timestamptz;

create unique index if not exists bookings_payment_reference_idx
  on public.bookings (payment_reference);

create unique index if not exists product_orders_payment_reference_idx
  on public.product_orders (payment_reference);
