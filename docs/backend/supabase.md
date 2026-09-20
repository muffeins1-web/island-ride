# IslandRide Supabase backend preparation

This repository keeps its existing Manus OAuth, MySQL/Drizzle, Express, and tRPC path working while a Supabase/Postgres backend is prepared alongside it. `BACKEND_PROVIDER` defaults to `mysql`; setting it to `supabase` only selects the staged adapter for code that explicitly calls `server/supabase.ts`. No cloud project, user, credential, or production data is created by these files.

## Local setup

1. Copy `.env.example` to an ignored local environment file and supply local Supabase values. Keep `SUPABASE_SERVICE_ROLE_KEY` server-only; only the URL and anon key may use the `EXPO_PUBLIC_` prefix.
2. Start a local Supabase stack with the project CLI, then apply `supabase/migrations` in order.
3. Run `pnpm supabase:check` to verify the required schema, RLS, storage, and audit controls are present.
4. Run `pnpm supabase:types` after the local migration to replace the bootstrap type contract with exact CLI-generated database types.
5. Keep `BACKEND_PROVIDER=mysql` while existing Manus sessions and MySQL data remain authoritative. Migrate one module at a time, reconcile records, run positive and negative authorization tests, and only then change the provider in a reviewed environment.

The Postgres design separates agency access (`superadmin`, `admin`, `customer`) from ride capabilities. A customer may have a rider profile, a driver profile, or both; becoming a driver never grants dashboard administration. Ride transitions remain server-authoritative. Payment rows store provider references and status only—never card or bank credentials.

## Fictional demo identities

`pnpm supabase:seed:demo` calls the Supabase Admin API only after all of these checks pass:

- `SUPABASE_PROJECT_ENV` is local, development, test, or staging;
- `ALLOW_DEMO_SEEDING=true` is explicitly set;
- each address uses `example.invalid`;
- all three per-site passwords are strong and different;
- a server-only service-role credential is present.

Passwords are read from ignored environment values and are never printed or committed. The script is idempotent for the configured addresses and marks the accounts as demo data. It normalizes environment-name case and surrounding whitespace, and is blocked when either `NODE_ENV` or the hosting `CONTEXT` is production.

For a remote run, `SUPABASE_URL` must use HTTPS and `SEED_ALLOWED_PROJECT_REF` must exactly match its project ref. Localhost may use HTTP for the local Supabase stack. The script refuses to adopt an existing Auth user unless its metadata already identifies it as this site's fictional seed identity.

## Data and storage boundaries

RLS limits customers to their own profile, saved places, rides, ratings, notifications, and payment references. Approved drivers can see assigned ride work and their earnings. Site admins manage the IslandRide tenant; only agency superadmins may grant the superadmin role. Private `driver-documents` paths use `<site-slug>/<user-id>/...`; `avatars` use `<user-id>/...`. Driver documents are never public.

Composite site foreign keys prevent ride, driver, vehicle, fare, rating, notification, and impersonation records from referencing another tenant. Transaction-locked guards prevent removal of the final active site superadmin and the final platform superadmin. Customer-readable policies exclude driver license references and unrestricted vehicle records.

The migration also prepares tenant-scoped settings, SEO, email templates/rules, explicit impersonation grants, and append-only audit history. SMTP credentials remain secret-store references and are not stored as plaintext settings.

Email preparation includes a durable outbox, metadata-only delivery events, raw-body Resend signature verification, checked-in Auth and ride lifecycle templates, and distinct preview/production environment values. Delivery remains disabled and no domain, key, webhook, DNS record, or message has been created. See `docs/email/resend-rollout.md`.

## Staged migration checkpoints

- Export and map the existing MySQL `users.openId` identities to Supabase Auth UUIDs without changing current sessions.
- Add server modules for riders, drivers, rides, and settings against `server/supabase.ts`; keep current tRPC contracts until each client flow is converted.
- Move simulated driver uploads to the private bucket and verify owner/admin denial cases.
- Backfill business data, reconcile counts and ride totals, then freeze MySQL writes for a controlled cutover.
- Verify web and native auth callbacks, RLS denial tests, local/preview builds, and rollback before enabling Supabase in any shared environment.
