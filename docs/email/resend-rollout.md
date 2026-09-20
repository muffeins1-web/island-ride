# IslandRide Resend rollout

The codebase is prepared for Resend without creating a domain, key, webhook, DNS record, external message, or cloud project. `EMAIL_DELIVERY_ENABLED` remains false until a reviewed activation.

## Environment separation

Preview and production have separate domain-restricted sending keys, verified sender subdomains, and webhook secrets. Netlify previews select `_PREVIEW`; the production context selects `_PRODUCTION`. All Resend secrets and `SUPABASE_SERVICE_ROLE_KEY` remain on the server. The checked-in example sender uses `example.invalid` and cannot deliver mail.

## Prepared behavior

- `server/email/templates.ts` renders ride-requested, driver-assigned, and ride-completed messages with escaped rider and trip fields.
- `server/email/resend.ts` refuses sending unless delivery is enabled and requires a stable caller-provided idempotency key.
- `POST /api/webhooks/resend` receives the raw body before JSON middleware, verifies `svix-id`, `svix-timestamp`, and `svix-signature`, rejects stale requests, and idempotently records metadata-only events.
- `email_outbox` is the durable site-scoped send queue; `email_delivery_events` records provider state without storing the webhook recipient payload.
- Supabase Auth confirmation and recovery HTML is checked in under `supabase/templates` for the future custom SMTP or Send Email Hook configuration.

## Activation checklist

1. Confirm separate preview and production sender subdomains and the DNS owner.
2. Create one sending-access key per environment, restrict it to that environment's domain, and save it only in the matching Netlify context.
3. Configure Supabase Auth custom SMTP or the approved Send Email Hook and apply the checked-in Auth templates.
4. Create the Resend webhook for the deployed `/api/webhooks/resend` endpoint, subscribe to required delivery/bounce/complaint events, and store the signing secret in the matching context.
5. Apply migrations, regenerate types, run RLS denial tests, replay/tamper webhook tests, and an authorized delivery to a controlled sink.
6. Enable delivery only after verification. Disable the flag and rotate/revoke the affected key for rollback.
