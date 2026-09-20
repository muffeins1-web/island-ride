begin;

create extension if not exists pgcrypto;

create type public.platform_role as enum ('superadmin', 'admin', 'customer');
create type public.membership_status as enum ('active', 'invited', 'suspended');
create type public.driver_review_status as enum ('pending', 'approved', 'rejected', 'suspended');
create type public.verification_status as enum ('pending', 'approved', 'rejected', 'expired');
create type public.ride_status as enum (
  'requested',
  'matched',
  'driver_en_route',
  'arrived',
  'in_progress',
  'completed',
  'cancelled'
);
create type public.payment_reference_status as enum (
  'not_required',
  'pending',
  'authorized',
  'captured',
  'failed',
  'refunded'
);
create type public.payout_status as enum ('pending', 'approved', 'paid', 'void');
create type public.notification_status as enum ('queued', 'sent', 'failed', 'cancelled');
create type public.impersonation_status as enum ('approved', 'active', 'expired', 'revoked');

create table public.sites (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name text not null,
  public_url text,
  admin_path text not null default '/admin',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.sites (id, slug, name)
values ('00000000-0000-4000-8000-000000000101', 'island-ride', 'IslandRide')
on conflict (slug) do nothing;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text not null default '',
  avatar_path text,
  platform_role public.platform_role not null default 'customer',
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.site_memberships (
  site_id uuid not null references public.sites(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  site_role public.platform_role not null default 'customer',
  status public.membership_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (site_id, user_id)
);

create or replace function public.is_service_role()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(current_setting('request.jwt.claim.role', true), '') = 'service_role';
$$;

create or replace function public.current_platform_role()
returns public.platform_role
language sql
stable
security definer
set search_path = public
as $$
  select p.platform_role from public.profiles p where p.id = auth.uid();
$$;

create or replace function public.is_superadmin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_service_role() or public.current_platform_role() = 'superadmin';
$$;

create or replace function public.is_site_member(target_site_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_superadmin() or exists (
    select 1
    from public.site_memberships membership
    where membership.site_id = target_site_id
      and membership.user_id = auth.uid()
      and membership.status = 'active'
  );
$$;

create or replace function public.is_site_admin(target_site_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_superadmin() or exists (
    select 1
    from public.site_memberships membership
    where membership.site_id = target_site_id
      and membership.user_id = auth.uid()
      and membership.status = 'active'
      and membership.site_role in ('superadmin', 'admin')
  );
$$;

create or replace function public.can_manage_user(target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_superadmin() or exists (
    select 1
    from public.site_memberships actor_membership
    join public.site_memberships target_membership
      on target_membership.site_id = actor_membership.site_id
    where actor_membership.user_id = auth.uid()
      and actor_membership.status = 'active'
      and actor_membership.site_role in ('superadmin', 'admin')
      and target_membership.user_id = target_user_id
  );
$$;

create table public.rider_profiles (
  site_id uuid not null references public.sites(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  phone text,
  preferred_island text,
  emergency_contact_name text,
  emergency_contact_phone text,
  accessibility_notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (site_id, user_id)
);

create table public.driver_profiles (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  review_status public.driver_review_status not null default 'pending',
  driver_type text not null default 'rideshare' check (driver_type in ('taxi', 'rideshare')),
  public_display_name text,
  license_reference text,
  rating_average numeric(3,2) not null default 5.00 check (rating_average between 0 and 5),
  is_online boolean not null default false,
  approved_at timestamptz,
  approved_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (site_id, user_id)
);

create table public.driver_verifications (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites(id) on delete cascade,
  driver_id uuid not null references public.driver_profiles(id) on delete cascade,
  verification_type text not null check (verification_type in ('identity', 'driver_license', 'insurance', 'vehicle_registration', 'background_check')),
  status public.verification_status not null default 'pending',
  document_path text,
  expires_on date,
  reviewer_id uuid references public.profiles(id) on delete set null,
  reviewer_note text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (driver_id, verification_type)
);

create table public.vehicles (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites(id) on delete cascade,
  driver_id uuid not null references public.driver_profiles(id) on delete cascade,
  make text not null,
  model text not null,
  model_year integer not null check (model_year between 1980 and 2100),
  color text not null,
  plate_number text not null,
  seats smallint not null check (seats between 1 and 20),
  photo_path text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (site_id, plate_number)
);

create table public.service_areas (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites(id) on delete cascade,
  slug text not null,
  name text not null,
  island_code text not null,
  timezone text not null default 'America/Nassau',
  currency_code text not null default 'BSD' check (char_length(currency_code) = 3),
  boundary jsonb not null default '{}'::jsonb,
  fare_rules jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (site_id, slug)
);

create table public.fare_quotes (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites(id) on delete cascade,
  rider_id uuid not null references public.profiles(id) on delete cascade,
  service_area_id uuid not null references public.service_areas(id) on delete restrict,
  ride_type text not null check (ride_type in ('standard', 'premium', 'shared')),
  currency_code text not null default 'BSD' check (char_length(currency_code) = 3),
  amount numeric(12,2) not null check (amount >= 0),
  distance_km numeric(10,3) check (distance_km >= 0),
  duration_minutes integer check (duration_minutes >= 0),
  pricing_snapshot jsonb not null default '{}'::jsonb,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table public.ride_requests (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites(id) on delete cascade,
  rider_id uuid not null references public.profiles(id) on delete restrict,
  service_area_id uuid not null references public.service_areas(id) on delete restrict,
  fare_quote_id uuid references public.fare_quotes(id) on delete set null,
  ride_type text not null check (ride_type in ('standard', 'premium', 'shared')),
  status public.ride_status not null default 'requested',
  pickup_address text not null,
  pickup_latitude numeric(9,6) not null check (pickup_latitude between -90 and 90),
  pickup_longitude numeric(9,6) not null check (pickup_longitude between -180 and 180),
  dropoff_address text not null,
  dropoff_latitude numeric(9,6) not null check (dropoff_latitude between -90 and 90),
  dropoff_longitude numeric(9,6) not null check (dropoff_longitude between -180 and 180),
  rider_note text,
  requested_at timestamptz not null default now(),
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.rides (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites(id) on delete cascade,
  request_id uuid not null unique references public.ride_requests(id) on delete restrict,
  rider_id uuid not null references public.profiles(id) on delete restrict,
  driver_id uuid not null references public.driver_profiles(id) on delete restrict,
  vehicle_id uuid not null references public.vehicles(id) on delete restrict,
  fare_quote_id uuid references public.fare_quotes(id) on delete set null,
  status public.ride_status not null default 'matched',
  currency_code text not null default 'BSD' check (char_length(currency_code) = 3),
  fare_amount numeric(12,2) check (fare_amount >= 0),
  tip_amount numeric(12,2) not null default 0 check (tip_amount >= 0),
  matched_at timestamptz not null default now(),
  arrived_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.ride_status_events (
  id bigint generated by default as identity primary key,
  site_id uuid not null references public.sites(id) on delete cascade,
  ride_id uuid not null references public.rides(id) on delete cascade,
  status public.ride_status not null,
  actor_user_id uuid references public.profiles(id) on delete set null,
  note text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.payment_references (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites(id) on delete cascade,
  ride_id uuid not null references public.rides(id) on delete restrict,
  rider_id uuid not null references public.profiles(id) on delete restrict,
  provider text not null,
  provider_reference text not null,
  status public.payment_reference_status not null default 'pending',
  currency_code text not null default 'BSD' check (char_length(currency_code) = 3),
  amount numeric(12,2) not null check (amount >= 0),
  provider_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, provider_reference)
);

comment on table public.payment_references is 'Provider references and state only. Never store card, bank, CVV, or raw payment credentials.';

create table public.ratings (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites(id) on delete cascade,
  ride_id uuid not null references public.rides(id) on delete cascade,
  reviewer_id uuid not null references public.profiles(id) on delete cascade,
  reviewee_id uuid not null references public.profiles(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  unique (ride_id, reviewer_id)
);

create table public.saved_places (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  label text not null,
  address text not null,
  latitude numeric(9,6) not null check (latitude between -90 and 90),
  longitude numeric(9,6) not null check (longitude between -180 and 180),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (site_id, user_id, label)
);

create table public.favorite_drivers (
  site_id uuid not null references public.sites(id) on delete cascade,
  rider_id uuid not null references public.profiles(id) on delete cascade,
  driver_id uuid not null references public.driver_profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (site_id, rider_id, driver_id)
);

create table public.earning_entries (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites(id) on delete cascade,
  driver_id uuid not null references public.driver_profiles(id) on delete restrict,
  ride_id uuid references public.rides(id) on delete restrict,
  entry_type text not null check (entry_type in ('fare', 'tip', 'bonus', 'adjustment', 'fee')),
  amount numeric(12,2) not null,
  currency_code text not null default 'BSD' check (char_length(currency_code) = 3),
  description text,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table public.payout_ledger (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites(id) on delete cascade,
  driver_id uuid not null references public.driver_profiles(id) on delete restrict,
  status public.payout_status not null default 'pending',
  amount numeric(12,2) not null check (amount >= 0),
  currency_code text not null default 'BSD' check (char_length(currency_code) = 3),
  period_start date not null,
  period_end date not null,
  provider_reference text,
  approved_by uuid references public.profiles(id) on delete set null,
  approved_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (period_end >= period_start)
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  channel text not null check (channel in ('in_app', 'email', 'sms', 'push')),
  status public.notification_status not null default 'queued',
  template_key text,
  subject text,
  body text not null,
  provider_reference text,
  deduplication_key text,
  scheduled_at timestamptz,
  sent_at timestamptz,
  failed_at timestamptz,
  failure_reason text,
  created_at timestamptz not null default now(),
  unique (site_id, deduplication_key)
);

create table public.site_settings (
  site_id uuid primary key references public.sites(id) on delete cascade,
  locale text not null default 'en-BS',
  timezone text not null default 'America/Nassau',
  currency_code text not null default 'BSD' check (char_length(currency_code) = 3),
  support_email text,
  support_phone text,
  public_settings jsonb not null default '{}'::jsonb,
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);

create table public.seo_settings (
  site_id uuid primary key references public.sites(id) on delete cascade,
  title text,
  description text,
  canonical_url text,
  social_image_path text,
  robots text not null default 'index,follow',
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);

create table public.email_settings (
  site_id uuid primary key references public.sites(id) on delete cascade,
  sender_name text,
  sender_email text,
  reply_to_email text,
  smtp_secret_ref text,
  connection_status text not null default 'unconfigured' check (connection_status in ('unconfigured', 'verified', 'error')),
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);

comment on column public.email_settings.smtp_secret_ref is 'Reference to an approved secret store entry; never a plaintext SMTP password.';

create table public.email_templates (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites(id) on delete cascade,
  template_key text not null,
  subject_template text not null,
  body_template text not null,
  allowed_variables text[] not null default '{}',
  is_published boolean not null default false,
  version integer not null default 1 check (version > 0),
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (site_id, template_key, version)
);

create table public.automated_responses (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites(id) on delete cascade,
  event_key text not null,
  email_template_id uuid references public.email_templates(id) on delete restrict,
  is_enabled boolean not null default false,
  recipient_rule jsonb not null default '{}'::jsonb,
  retry_policy jsonb not null default '{"max_attempts": 3}'::jsonb,
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (site_id, event_key)
);

create table public.email_outbox (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites(id) on delete cascade,
  idempotency_key text not null check (char_length(idempotency_key) between 1 and 256),
  template_key text not null,
  recipient_address text not null,
  subject text not null,
  status text not null default 'queued' check (status in ('queued', 'sending', 'sent', 'failed', 'cancelled')),
  provider_message_id text,
  attempt_count integer not null default 0 check (attempt_count >= 0),
  last_error_code text,
  next_attempt_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (site_id, idempotency_key)
);

create table public.email_delivery_events (
  id bigint generated by default as identity primary key,
  site_id uuid not null references public.sites(id) on delete cascade,
  provider text not null default 'resend',
  provider_event_id text not null unique,
  provider_message_id text,
  event_type text not null,
  event_metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz,
  received_at timestamptz not null default now()
);

create table public.impersonation_grants (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites(id) on delete cascade,
  actor_id uuid not null references public.profiles(id) on delete restrict,
  target_user_id uuid not null references public.profiles(id) on delete restrict,
  purpose text not null check (char_length(purpose) >= 10),
  authorization_reference text not null,
  status public.impersonation_status not null default 'approved',
  expires_at timestamptz not null,
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  check (actor_id <> target_user_id),
  check (expires_at > created_at)
);

create table public.audit_log (
  id bigint generated by default as identity primary key,
  site_id uuid references public.sites(id) on delete set null,
  actor_user_id uuid references public.profiles(id) on delete set null,
  action text not null,
  target_table text not null,
  target_id text,
  outcome text not null default 'success',
  authorization_reference text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index ride_requests_site_status_idx on public.ride_requests(site_id, status, requested_at desc);
create index rides_rider_idx on public.rides(rider_id, created_at desc);
create index rides_driver_idx on public.rides(driver_id, created_at desc);
create index ride_status_events_ride_idx on public.ride_status_events(ride_id, created_at);
create index driver_verifications_driver_idx on public.driver_verifications(driver_id, status);
create index notifications_recipient_idx on public.notifications(recipient_id, created_at desc);
create index email_outbox_site_status_idx on public.email_outbox(site_id, status, next_attempt_at, created_at);
create index email_delivery_events_message_idx on public.email_delivery_events(site_id, provider_message_id, received_at desc);
create index audit_log_site_created_idx on public.audit_log(site_id, created_at desc);

-- Every business relationship is anchored to the same site. These composite
-- constraints prevent a valid UUID from another tenant being attached through
-- an otherwise valid single-column foreign key.
alter table public.driver_profiles add constraint driver_profiles_site_id_id_key unique (site_id, id);
alter table public.driver_profiles add constraint driver_profiles_membership_fk
  foreign key (site_id, user_id) references public.site_memberships(site_id, user_id) on delete cascade;
alter table public.rider_profiles add constraint rider_profiles_membership_fk
  foreign key (site_id, user_id) references public.site_memberships(site_id, user_id) on delete cascade;
alter table public.driver_verifications add constraint driver_verifications_site_id_id_key unique (site_id, id);
alter table public.driver_verifications add constraint driver_verifications_driver_site_fk
  foreign key (site_id, driver_id) references public.driver_profiles(site_id, id) on delete cascade;
alter table public.vehicles add constraint vehicles_site_id_id_key unique (site_id, id);
alter table public.vehicles add constraint vehicles_driver_site_fk
  foreign key (site_id, driver_id) references public.driver_profiles(site_id, id) on delete cascade;
alter table public.service_areas add constraint service_areas_site_id_id_key unique (site_id, id);
alter table public.fare_quotes add constraint fare_quotes_site_id_id_key unique (site_id, id);
alter table public.fare_quotes add constraint fare_quotes_rider_membership_fk
  foreign key (site_id, rider_id) references public.site_memberships(site_id, user_id) on delete restrict;
alter table public.fare_quotes add constraint fare_quotes_service_area_site_fk
  foreign key (site_id, service_area_id) references public.service_areas(site_id, id) on delete restrict;
alter table public.ride_requests add constraint ride_requests_site_id_id_key unique (site_id, id);
alter table public.ride_requests add constraint ride_requests_rider_membership_fk
  foreign key (site_id, rider_id) references public.site_memberships(site_id, user_id) on delete restrict;
alter table public.ride_requests add constraint ride_requests_service_area_site_fk
  foreign key (site_id, service_area_id) references public.service_areas(site_id, id) on delete restrict;
alter table public.ride_requests add constraint ride_requests_fare_quote_site_fk
  foreign key (site_id, fare_quote_id) references public.fare_quotes(site_id, id) on delete restrict;
alter table public.rides add constraint rides_site_id_id_key unique (site_id, id);
alter table public.rides add constraint rides_request_site_fk
  foreign key (site_id, request_id) references public.ride_requests(site_id, id) on delete restrict;
alter table public.rides add constraint rides_rider_membership_fk
  foreign key (site_id, rider_id) references public.site_memberships(site_id, user_id) on delete restrict;
alter table public.rides add constraint rides_driver_site_fk
  foreign key (site_id, driver_id) references public.driver_profiles(site_id, id) on delete restrict;
alter table public.rides add constraint rides_vehicle_site_fk
  foreign key (site_id, vehicle_id) references public.vehicles(site_id, id) on delete restrict;
alter table public.rides add constraint rides_fare_quote_site_fk
  foreign key (site_id, fare_quote_id) references public.fare_quotes(site_id, id) on delete restrict;
alter table public.ride_status_events add constraint ride_status_events_ride_site_fk
  foreign key (site_id, ride_id) references public.rides(site_id, id) on delete cascade;
alter table public.payment_references add constraint payment_references_ride_site_fk
  foreign key (site_id, ride_id) references public.rides(site_id, id) on delete restrict;
alter table public.payment_references add constraint payment_references_rider_membership_fk
  foreign key (site_id, rider_id) references public.site_memberships(site_id, user_id) on delete restrict;
alter table public.ratings add constraint ratings_ride_site_fk
  foreign key (site_id, ride_id) references public.rides(site_id, id) on delete cascade;
alter table public.ratings add constraint ratings_reviewer_membership_fk
  foreign key (site_id, reviewer_id) references public.site_memberships(site_id, user_id) on delete restrict;
alter table public.ratings add constraint ratings_reviewee_membership_fk
  foreign key (site_id, reviewee_id) references public.site_memberships(site_id, user_id) on delete restrict;
alter table public.saved_places add constraint saved_places_user_membership_fk
  foreign key (site_id, user_id) references public.site_memberships(site_id, user_id) on delete cascade;
alter table public.favorite_drivers add constraint favorite_drivers_rider_membership_fk
  foreign key (site_id, rider_id) references public.site_memberships(site_id, user_id) on delete cascade;
alter table public.favorite_drivers add constraint favorite_drivers_driver_site_fk
  foreign key (site_id, driver_id) references public.driver_profiles(site_id, id) on delete cascade;
alter table public.earning_entries add constraint earning_entries_driver_site_fk
  foreign key (site_id, driver_id) references public.driver_profiles(site_id, id) on delete restrict;
alter table public.earning_entries add constraint earning_entries_ride_site_fk
  foreign key (site_id, ride_id) references public.rides(site_id, id) on delete restrict;
alter table public.payout_ledger add constraint payout_ledger_driver_site_fk
  foreign key (site_id, driver_id) references public.driver_profiles(site_id, id) on delete restrict;
alter table public.notifications add constraint notifications_recipient_membership_fk
  foreign key (site_id, recipient_id) references public.site_memberships(site_id, user_id) on delete restrict;
alter table public.email_templates add constraint email_templates_site_id_id_key unique (site_id, id);
alter table public.automated_responses add constraint automated_responses_template_site_fk
  foreign key (site_id, email_template_id) references public.email_templates(site_id, id) on delete restrict;
alter table public.impersonation_grants add constraint impersonation_actor_membership_fk
  foreign key (site_id, actor_id) references public.site_memberships(site_id, user_id) on delete restrict;
alter table public.impersonation_grants add constraint impersonation_target_membership_fk
  foreign key (site_id, target_user_id) references public.site_memberships(site_id, user_id) on delete restrict;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name, platform_role, is_demo)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'display_name', ''),
    'customer',
    coalesce((new.raw_user_meta_data ->> 'demo')::boolean, false)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

create or replace function public.guard_profile_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  removes_superadmin boolean := false;
begin
  if tg_op = 'DELETE' then
    removes_superadmin := old.platform_role = 'superadmin';
  else
    removes_superadmin := old.platform_role = 'superadmin' and new.platform_role <> 'superadmin';
    if new.platform_role is distinct from old.platform_role
       and not public.is_service_role()
       and not public.is_superadmin() then
      raise exception 'Only a superadmin may change platform roles';
    end if;
  end if;

  if removes_superadmin then
    perform pg_advisory_xact_lock(hashtextextended('island-ride:platform-superadmin', 0));
    if not exists (
      select 1 from public.profiles profile
      where profile.id <> old.id and profile.platform_role = 'superadmin'
    ) then
      raise exception 'The platform must retain at least one superadmin';
    end if;
  end if;

  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

create trigger guard_profile_role_change
before update or delete on public.profiles
for each row execute function public.guard_profile_role_change();

create or replace function public.guard_membership_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  removes_superadmin boolean := false;
  protected_site_id uuid;
begin
  if tg_op = 'DELETE' then
    protected_site_id := old.site_id;
    removes_superadmin := old.site_role = 'superadmin' and old.status = 'active';
    if removes_superadmin and not public.is_service_role() and not public.is_superadmin() then
      raise exception 'Only a superadmin may remove superadmin membership';
    end if;
  else
    protected_site_id := new.site_id;
    if new.site_role = 'superadmin'
       and not public.is_service_role()
       and not public.is_superadmin() then
      raise exception 'Only a superadmin may grant superadmin membership';
    end if;
    if tg_op = 'UPDATE' then
      removes_superadmin := old.site_role = 'superadmin'
        and old.status = 'active'
        and (
          new.site_role <> 'superadmin'
          or new.status <> 'active'
          or new.site_id <> old.site_id
          or new.user_id <> old.user_id
        );
      if removes_superadmin and not public.is_service_role() and not public.is_superadmin() then
        raise exception 'Only a superadmin may demote or suspend superadmin membership';
      end if;
    end if;
  end if;

  if removes_superadmin then
    if tg_op = 'DELETE' and not exists (
      select 1 from public.sites site where site.id = old.site_id
    ) then
      return old;
    end if;
    perform pg_advisory_xact_lock(hashtextextended(protected_site_id::text, 0));
    if not exists (
      select 1 from public.site_memberships membership
      where membership.site_id = old.site_id
        and membership.user_id <> old.user_id
        and membership.site_role = 'superadmin'
        and membership.status = 'active'
    ) then
      raise exception 'A site must retain at least one active superadmin';
    end if;
  end if;

  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

create trigger guard_membership_role_change
before insert or update or delete on public.site_memberships
for each row execute function public.guard_membership_role_change();

create or replace function public.guard_driver_review_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_site_admin(new.site_id)
     and not public.is_service_role()
     and (
       new.site_id is distinct from old.site_id
       or new.user_id is distinct from old.user_id
     ) then
    raise exception 'Driver identity and site fields cannot be reassigned';
  end if;
  if not public.is_site_admin(new.site_id)
     and not public.is_service_role()
     and (
       new.review_status is distinct from old.review_status
       or new.approved_at is distinct from old.approved_at
       or new.approved_by is distinct from old.approved_by
     ) then
    raise exception 'Driver review fields require site-admin authority';
  end if;
  return new;
end;
$$;

create trigger guard_driver_review_fields
before update on public.driver_profiles
for each row execute function public.guard_driver_review_fields();

create or replace function public.enforce_ride_status_transition()
returns trigger
language plpgsql
as $$
begin
  if new.status = old.status then return new; end if;
  if not (
    (old.status = 'requested' and new.status in ('matched', 'cancelled')) or
    (old.status = 'matched' and new.status in ('driver_en_route', 'cancelled')) or
    (old.status = 'driver_en_route' and new.status in ('arrived', 'cancelled')) or
    (old.status = 'arrived' and new.status in ('in_progress', 'cancelled')) or
    (old.status = 'in_progress' and new.status in ('completed', 'cancelled'))
  ) then
    raise exception 'Invalid ride status transition: % -> %', old.status, new.status;
  end if;
  return new;
end;
$$;

create trigger enforce_ride_status_transition
before update of status on public.rides
for each row execute function public.enforce_ride_status_transition();

create or replace function public.guard_rider_request_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() = old.rider_id
     and not public.is_site_admin(old.site_id)
     and not public.is_service_role() then
    if new.status is distinct from old.status and new.status <> 'cancelled' then
      raise exception 'Riders may only cancel their own pending request';
    end if;
    if new.rider_id is distinct from old.rider_id
       or new.site_id is distinct from old.site_id
       or new.fare_quote_id is distinct from old.fare_quote_id then
      raise exception 'Protected ride-request fields cannot be reassigned';
    end if;
  end if;
  return new;
end;
$$;

create trigger guard_rider_request_update
before update on public.ride_requests
for each row execute function public.guard_rider_request_update();

create or replace function public.audit_row_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  row_data jsonb := case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end;
  resolved_site_id uuid;
  resolved_actor_id uuid;
begin
  begin
    resolved_site_id := nullif(row_data ->> 'site_id', '')::uuid;
  exception when invalid_text_representation then
    resolved_site_id := null;
  end;

  select p.id into resolved_actor_id
  from public.profiles p
  where p.id = auth.uid();

  insert into public.audit_log (
    site_id,
    actor_user_id,
    action,
    target_table,
    target_id,
    metadata
  ) values (
    resolved_site_id,
    resolved_actor_id,
    lower(tg_op),
    tg_table_name,
    coalesce(row_data ->> 'id', row_data ->> 'user_id'),
    jsonb_build_object('operation', tg_op)
  );
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

create trigger audit_profiles after insert or update or delete on public.profiles for each row execute function public.audit_row_change();
create trigger audit_memberships after insert or update or delete on public.site_memberships for each row execute function public.audit_row_change();
create trigger audit_driver_verifications after insert or update or delete on public.driver_verifications for each row execute function public.audit_row_change();
create trigger audit_rides after insert or update or delete on public.rides for each row execute function public.audit_row_change();
create trigger audit_payment_references after insert or update or delete on public.payment_references for each row execute function public.audit_row_change();
create trigger audit_site_settings after insert or update or delete on public.site_settings for each row execute function public.audit_row_change();
create trigger audit_email_settings after insert or update or delete on public.email_settings for each row execute function public.audit_row_change();
create trigger audit_impersonation_grants after insert or update or delete on public.impersonation_grants for each row execute function public.audit_row_change();

create trigger set_sites_updated_at before update on public.sites for each row execute function public.set_updated_at();
create trigger set_profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger set_memberships_updated_at before update on public.site_memberships for each row execute function public.set_updated_at();
create trigger set_riders_updated_at before update on public.rider_profiles for each row execute function public.set_updated_at();
create trigger set_drivers_updated_at before update on public.driver_profiles for each row execute function public.set_updated_at();
create trigger set_verifications_updated_at before update on public.driver_verifications for each row execute function public.set_updated_at();
create trigger set_vehicles_updated_at before update on public.vehicles for each row execute function public.set_updated_at();
create trigger set_service_areas_updated_at before update on public.service_areas for each row execute function public.set_updated_at();
create trigger set_ride_requests_updated_at before update on public.ride_requests for each row execute function public.set_updated_at();
create trigger set_rides_updated_at before update on public.rides for each row execute function public.set_updated_at();
create trigger set_payment_references_updated_at before update on public.payment_references for each row execute function public.set_updated_at();
create trigger set_saved_places_updated_at before update on public.saved_places for each row execute function public.set_updated_at();
create trigger set_payout_ledger_updated_at before update on public.payout_ledger for each row execute function public.set_updated_at();
create trigger set_email_templates_updated_at before update on public.email_templates for each row execute function public.set_updated_at();
create trigger set_automated_responses_updated_at before update on public.automated_responses for each row execute function public.set_updated_at();
create trigger set_email_outbox_updated_at before update on public.email_outbox for each row execute function public.set_updated_at();

alter table public.sites enable row level security;
alter table public.profiles enable row level security;
alter table public.site_memberships enable row level security;
alter table public.rider_profiles enable row level security;
alter table public.driver_profiles enable row level security;
alter table public.driver_verifications enable row level security;
alter table public.vehicles enable row level security;
alter table public.service_areas enable row level security;
alter table public.fare_quotes enable row level security;
alter table public.ride_requests enable row level security;
alter table public.rides enable row level security;
alter table public.ride_status_events enable row level security;
alter table public.payment_references enable row level security;
alter table public.ratings enable row level security;
alter table public.saved_places enable row level security;
alter table public.favorite_drivers enable row level security;
alter table public.earning_entries enable row level security;
alter table public.payout_ledger enable row level security;
alter table public.notifications enable row level security;
alter table public.site_settings enable row level security;
alter table public.seo_settings enable row level security;
alter table public.email_settings enable row level security;
alter table public.email_templates enable row level security;
alter table public.automated_responses enable row level security;
alter table public.email_outbox enable row level security;
alter table public.email_delivery_events enable row level security;
alter table public.impersonation_grants enable row level security;
alter table public.audit_log enable row level security;

create policy sites_public_read on public.sites for select using (is_active or public.is_site_member(id));
create policy sites_superadmin_write on public.sites for all using (public.is_superadmin()) with check (public.is_superadmin());

create policy profiles_read on public.profiles for select using (id = auth.uid() or public.can_manage_user(id));
create policy profiles_insert_self on public.profiles for insert with check (id = auth.uid() and platform_role = 'customer');
create policy profiles_update on public.profiles for update using (id = auth.uid() or public.can_manage_user(id)) with check (id = auth.uid() or public.can_manage_user(id));

create policy memberships_read on public.site_memberships for select using (user_id = auth.uid() or public.is_site_admin(site_id));
create policy memberships_admin_insert on public.site_memberships for insert with check (public.is_site_admin(site_id));
create policy memberships_admin_update on public.site_memberships for update using (public.is_site_admin(site_id)) with check (public.is_site_admin(site_id));
create policy memberships_admin_delete on public.site_memberships for delete using (public.is_site_admin(site_id));

create policy rider_profiles_read on public.rider_profiles for select using (user_id = auth.uid() or public.is_site_admin(site_id));
create policy rider_profiles_insert on public.rider_profiles for insert with check (
  (user_id = auth.uid() and public.is_site_member(site_id)) or public.is_site_admin(site_id)
);
create policy rider_profiles_update on public.rider_profiles for update using (user_id = auth.uid() or public.is_site_admin(site_id)) with check (
  (user_id = auth.uid() and public.is_site_member(site_id)) or public.is_site_admin(site_id)
);
create policy rider_profiles_delete on public.rider_profiles for delete using (public.is_site_admin(site_id));

create policy driver_profiles_read on public.driver_profiles for select using (user_id = auth.uid() or public.is_site_admin(site_id));
create policy driver_profiles_insert on public.driver_profiles for insert with check (
  public.is_site_admin(site_id)
  or (
    user_id = auth.uid()
    and public.is_site_member(site_id)
    and review_status = 'pending'
    and approved_at is null
    and approved_by is null
  )
);
create policy driver_profiles_update on public.driver_profiles for update using (user_id = auth.uid() or public.is_site_admin(site_id)) with check (user_id = auth.uid() or public.is_site_admin(site_id));
create policy driver_profiles_delete on public.driver_profiles for delete using (public.is_site_admin(site_id));

create policy driver_verifications_read on public.driver_verifications for select using (
  public.is_site_admin(site_id) or exists (select 1 from public.driver_profiles d where d.id = driver_id and d.user_id = auth.uid())
);
create policy driver_verifications_insert on public.driver_verifications for insert with check (
  public.is_site_admin(site_id)
  or (
    status = 'pending'
    and reviewer_id is null
    and reviewed_at is null
    and exists (select 1 from public.driver_profiles d where d.id = driver_id and d.user_id = auth.uid())
  )
);
create policy driver_verifications_admin_update on public.driver_verifications for update using (public.is_site_admin(site_id)) with check (public.is_site_admin(site_id));
create policy driver_verifications_admin_delete on public.driver_verifications for delete using (public.is_site_admin(site_id));

create policy vehicles_read on public.vehicles for select using (
  public.is_site_admin(site_id)
  or exists (select 1 from public.driver_profiles d where d.id = driver_id and d.user_id = auth.uid())
  or exists (select 1 from public.rides r where r.site_id = vehicles.site_id and r.vehicle_id = vehicles.id and r.rider_id = auth.uid())
);
create policy vehicles_insert on public.vehicles for insert with check (
  public.is_site_admin(site_id) or exists (select 1 from public.driver_profiles d where d.id = driver_id and d.user_id = auth.uid())
);
create policy vehicles_update on public.vehicles for update using (
  public.is_site_admin(site_id) or exists (select 1 from public.driver_profiles d where d.id = driver_id and d.user_id = auth.uid())
) with check (
  public.is_site_admin(site_id) or exists (select 1 from public.driver_profiles d where d.id = driver_id and d.user_id = auth.uid())
);
create policy vehicles_admin_delete on public.vehicles for delete using (public.is_site_admin(site_id));

create policy service_areas_public_read on public.service_areas for select using (is_active or public.is_site_admin(site_id));
create policy service_areas_admin_write on public.service_areas for all using (public.is_site_admin(site_id)) with check (public.is_site_admin(site_id));

create policy fare_quotes_read on public.fare_quotes for select using (rider_id = auth.uid() or public.is_site_admin(site_id));
create policy fare_quotes_admin_insert on public.fare_quotes for insert with check (public.is_site_admin(site_id));
create policy fare_quotes_admin_update on public.fare_quotes for update using (public.is_site_admin(site_id)) with check (public.is_site_admin(site_id));

create policy ride_requests_read on public.ride_requests for select using (
  rider_id = auth.uid()
  or public.is_site_admin(site_id)
  or (
    status = 'requested'
    and exists (select 1 from public.driver_profiles d where d.site_id = ride_requests.site_id and d.user_id = auth.uid() and d.review_status = 'approved')
  )
);
create policy ride_requests_insert on public.ride_requests for insert with check (rider_id = auth.uid() and public.is_site_member(site_id));
create policy ride_requests_update on public.ride_requests for update using (rider_id = auth.uid() or public.is_site_admin(site_id)) with check (rider_id = auth.uid() or public.is_site_admin(site_id));
create policy ride_requests_admin_delete on public.ride_requests for delete using (public.is_site_admin(site_id));

create policy rides_read on public.rides for select using (
  rider_id = auth.uid()
  or public.is_site_admin(site_id)
  or exists (select 1 from public.driver_profiles d where d.id = driver_id and d.user_id = auth.uid())
);
create policy rides_admin_insert on public.rides for insert with check (public.is_site_admin(site_id));
create policy rides_admin_update on public.rides for update using (public.is_site_admin(site_id)) with check (public.is_site_admin(site_id));

create policy ride_events_read on public.ride_status_events for select using (
  public.is_site_admin(site_id)
  or exists (
    select 1 from public.rides r
    left join public.driver_profiles d on d.id = r.driver_id
    where r.id = ride_id and (r.rider_id = auth.uid() or d.user_id = auth.uid())
  )
);
create policy ride_events_insert on public.ride_status_events for insert with check (
  public.is_site_admin(site_id)
  or (
    actor_user_id = auth.uid()
    and exists (
      select 1
      from public.rides r
      left join public.driver_profiles d on d.id = r.driver_id and d.site_id = r.site_id
      where r.id = ride_id
        and r.site_id = ride_status_events.site_id
        and (r.rider_id = auth.uid() or d.user_id = auth.uid())
    )
  )
);

create policy payment_references_read on public.payment_references for select using (rider_id = auth.uid() or public.is_site_admin(site_id));
create policy payment_references_admin_write on public.payment_references for all using (public.is_site_admin(site_id)) with check (public.is_site_admin(site_id));

create policy ratings_read on public.ratings for select using (reviewer_id = auth.uid() or reviewee_id = auth.uid() or public.is_site_admin(site_id));
create policy ratings_insert on public.ratings for insert with check (
  reviewer_id = auth.uid()
  and exists (
    select 1
    from public.rides r
    join public.driver_profiles d on d.id = r.driver_id
    where r.id = ride_id
      and r.status = 'completed'
      and (r.rider_id = auth.uid() or d.user_id = auth.uid())
  )
);
create policy ratings_update on public.ratings for update using (reviewer_id = auth.uid()) with check (
  reviewer_id = auth.uid()
  and exists (
    select 1
    from public.rides r
    join public.driver_profiles d on d.id = r.driver_id and d.site_id = r.site_id
    where r.id = ride_id
      and r.site_id = ratings.site_id
      and r.status = 'completed'
      and (r.rider_id = auth.uid() or d.user_id = auth.uid())
  )
);

create policy saved_places_owner on public.saved_places for all using (user_id = auth.uid() or public.is_site_admin(site_id)) with check (
  (user_id = auth.uid() and public.is_site_member(site_id)) or public.is_site_admin(site_id)
);
create policy favorite_drivers_owner on public.favorite_drivers for all using (rider_id = auth.uid() or public.is_site_admin(site_id)) with check (
  (rider_id = auth.uid() and public.is_site_member(site_id)) or public.is_site_admin(site_id)
);

create policy earning_entries_read on public.earning_entries for select using (
  public.is_site_admin(site_id) or exists (select 1 from public.driver_profiles d where d.id = driver_id and d.user_id = auth.uid())
);
create policy earning_entries_admin_write on public.earning_entries for all using (public.is_site_admin(site_id)) with check (public.is_site_admin(site_id));

create policy payout_ledger_read on public.payout_ledger for select using (
  public.is_site_admin(site_id) or exists (select 1 from public.driver_profiles d where d.id = driver_id and d.user_id = auth.uid())
);
create policy payout_ledger_admin_write on public.payout_ledger for all using (public.is_site_admin(site_id)) with check (public.is_site_admin(site_id));

create policy notifications_recipient_read on public.notifications for select using (recipient_id = auth.uid() or public.is_site_admin(site_id));
create policy notifications_admin_update on public.notifications for update using (public.is_site_admin(site_id)) with check (public.is_site_admin(site_id));
create policy notifications_admin_insert on public.notifications for insert with check (public.is_site_admin(site_id));

create policy site_settings_public_read on public.site_settings for select using (true);
create policy site_settings_admin_write on public.site_settings for all using (public.is_site_admin(site_id)) with check (public.is_site_admin(site_id));
create policy seo_settings_public_read on public.seo_settings for select using (true);
create policy seo_settings_admin_write on public.seo_settings for all using (public.is_site_admin(site_id)) with check (public.is_site_admin(site_id));
create policy email_settings_admin on public.email_settings for all using (public.is_site_admin(site_id)) with check (public.is_site_admin(site_id));
create policy email_templates_admin on public.email_templates for all using (public.is_site_admin(site_id)) with check (public.is_site_admin(site_id));
create policy automated_responses_admin on public.automated_responses for all using (public.is_site_admin(site_id)) with check (public.is_site_admin(site_id));
create policy email_outbox_admin_read on public.email_outbox for select using (public.is_site_admin(site_id));
create policy email_delivery_events_admin_read on public.email_delivery_events for select using (public.is_site_admin(site_id));

create policy impersonation_read on public.impersonation_grants for select using (
  actor_id = auth.uid() or target_user_id = auth.uid() or public.is_superadmin()
);
create policy impersonation_superadmin_insert on public.impersonation_grants for insert with check (
  public.is_superadmin() and actor_id = auth.uid()
);
create policy impersonation_superadmin_update on public.impersonation_grants for update using (public.is_superadmin()) with check (public.is_superadmin());

create policy audit_admin_read on public.audit_log for select using (
  public.is_superadmin() or (site_id is not null and public.is_site_admin(site_id))
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('driver-documents', 'driver-documents', false, 26214400, array['image/jpeg', 'image/png', 'application/pdf']),
  ('avatars', 'avatars', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy driver_documents_read on storage.objects for select using (
  bucket_id = 'driver-documents'
  and (
    split_part(name, '/', 2) = auth.uid()::text
    or exists (
      select 1 from public.sites s
      where s.slug = split_part(name, '/', 1) and public.is_site_admin(s.id)
    )
  )
);
create policy driver_documents_insert on storage.objects for insert with check (
  bucket_id = 'driver-documents'
  and (
    exists (
      select 1
      from public.sites s
      join public.driver_profiles d on d.site_id = s.id
      where s.slug = split_part(name, '/', 1)
        and split_part(name, '/', 2) = auth.uid()::text
        and d.user_id = auth.uid()
    )
    or exists (
      select 1 from public.sites s
      where s.slug = split_part(name, '/', 1) and public.is_site_admin(s.id)
    )
  )
);
create policy driver_documents_update on storage.objects for update using (
  bucket_id = 'driver-documents'
  and (
    split_part(name, '/', 2) = auth.uid()::text
    or exists (
      select 1 from public.sites s
      where s.slug = split_part(name, '/', 1) and public.is_site_admin(s.id)
    )
  )
) with check (
  bucket_id = 'driver-documents'
  and (
    exists (
      select 1
      from public.sites s
      join public.driver_profiles d on d.site_id = s.id
      where s.slug = split_part(name, '/', 1)
        and split_part(name, '/', 2) = auth.uid()::text
        and d.user_id = auth.uid()
    )
    or exists (
      select 1 from public.sites s
      where s.slug = split_part(name, '/', 1) and public.is_site_admin(s.id)
    )
  )
);
create policy driver_documents_delete on storage.objects for delete using (
  bucket_id = 'driver-documents'
  and (
    split_part(name, '/', 2) = auth.uid()::text
    or exists (
      select 1 from public.sites s
      where s.slug = split_part(name, '/', 1) and public.is_site_admin(s.id)
    )
  )
);

create policy avatars_read on storage.objects for select using (
  bucket_id = 'avatars' and (split_part(name, '/', 1) = auth.uid()::text or public.is_superadmin())
);
create policy avatars_insert on storage.objects for insert with check (
  bucket_id = 'avatars' and split_part(name, '/', 1) = auth.uid()::text
);
create policy avatars_update on storage.objects for update using (
  bucket_id = 'avatars' and split_part(name, '/', 1) = auth.uid()::text
) with check (
  bucket_id = 'avatars' and split_part(name, '/', 1) = auth.uid()::text
);
create policy avatars_delete on storage.objects for delete using (
  bucket_id = 'avatars' and split_part(name, '/', 1) = auth.uid()::text
);

grant usage on schema public to anon, authenticated;
grant select on public.sites, public.service_areas, public.site_settings, public.seo_settings to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;
grant all on public.email_outbox, public.email_delivery_events to service_role;
grant usage, select on all sequences in schema public to service_role;

commit;
