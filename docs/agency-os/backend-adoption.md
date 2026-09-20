# IslandRide backend adoption report

Pinned standards: AOS-ADOPT-001 v2.0.0 and AOS-BE-001 v1.1.0. Baseline: `fc258cd34d161201dd21cce997224672d07b32a9`.

Result: partial local preparation. The existing Manus OAuth, MySQL/Drizzle, Express/tRPC, Expo routes, rider/driver experience, and payment authority remain unchanged and authoritative. Supabase is an explicit staged provider. No cloud project, credential, email, deployment, commit, or push occurred.

## Security and data boundaries

- Platform roles stay separate from rider/driver capabilities.
- Composite site foreign keys prevent cross-tenant driver, vehicle, ride, fare, payment, rating, email, notification, and impersonation relationships.
- Transaction-locked triggers preserve the final platform superadmin and final active site superadmin, including concurrent changes. An ordinary admin cannot demote, suspend, or delete a superadmin.
- Customers see their own ride data. Driver license references and unrestricted active-vehicle records are no longer customer-readable. Ride-status events require a participating rider/driver or admin. Notification delivery state is admin/service controlled.
- The guarded, idempotent seed creates only the three fictional `example.invalid` roles in an explicitly selected non-production project and refuses to adopt unmarked Auth users.

## Email boundary

Preview and production have separate Resend settings. Delivery is off by default. Auth confirmation/recovery plus ride-requested, driver-assigned, and ride-completed templates are checked in. The raw-body webhook verifies the Svix signature and timestamp before recording a duplicate-safe metadata-only event. The outbox has a site-scoped idempotency key. No domain, key, webhook, DNS record, or message was created.

## Validation

- `corepack pnpm check`: pass.
- `corepack pnpm test`: 11 files and 91 tests pass outside the process sandbox.
- `corepack pnpm build`: pass.
- `corepack pnpm supabase:check`: one migration, 20 required tables, RLS, roles, storage, audit, same-site constraints, superadmin locks, and email tables pass static validation.
- Focused ESLint for the email, webhook, seed, and new tests: pass; only the repository's existing module-type process warning appears.
- Secret-pattern scan and `git diff --check`: pass.
- Supabase migration execution and live positive/negative RLS tests: not run because no local CLI/runtime or authorized cloud project exists.

The detailed acceptance matrix remains in `docs/agency-os/backend-adoption.json`, with the newest immutable record under `docs/agency-os/adoptions`.
