import { getSupabaseServerClient } from "../supabase";
import type { VerifiedResendEvent } from "./resend";

export async function recordResendDeliveryEvent(
  event: VerifiedResendEvent,
  env: Record<string, string | undefined> = process.env,
): Promise<void> {
  const client = getSupabaseServerClient(env);
  if (!client) throw new Error("Supabase email persistence is not configured");
  const siteSlug = env.SUPABASE_SITE_SLUG?.trim();
  if (!siteSlug) throw new Error("SUPABASE_SITE_SLUG is required for email persistence");
  const sites = await client.request<{ id: string }[]>(
    `/rest/v1/sites?slug=eq.${encodeURIComponent(siteSlug)}&select=id&limit=1`,
    {},
    { serviceRole: true },
  );
  if (!sites[0]) throw new Error("Email webhook site is not provisioned");
  await client.request(
    "/rest/v1/email_delivery_events?on_conflict=provider_event_id",
    {
      method: "POST",
      headers: { Prefer: "resolution=ignore-duplicates,return=minimal" },
      body: JSON.stringify({
        site_id: sites[0].id,
        provider: "resend",
        provider_event_id: event.providerEventId,
        provider_message_id: event.providerMessageId ?? null,
        event_type: event.eventType,
        event_metadata: {},
        occurred_at: event.occurredAt ?? null,
      }),
    },
    { serviceRole: true },
  );
}
