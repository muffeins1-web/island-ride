import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { renderIslandRideEmail } from "../server/email/templates";
import {
  readResendSendConfig,
  resolveEmailEnvironment,
  sendResendEmail,
  verifyResendWebhook,
} from "../server/email/resend";

const previewEnv = {
  EMAIL_DELIVERY_ENABLED: "true",
  EMAIL_ENVIRONMENT: "preview",
  RESEND_API_KEY_PREVIEW: "re_preview_test_only",
  RESEND_FROM_PREVIEW: "IslandRide Preview <preview@preview.example.invalid>",
};

describe("IslandRide Resend staging", () => {
  it("keeps preview and production configuration separate", () => {
    expect(resolveEmailEnvironment({ CONTEXT: "deploy-preview" })).toBe("preview");
    expect(resolveEmailEnvironment({ CONTEXT: "production" })).toBe("production");
    expect(readResendSendConfig(previewEnv).apiKey).toBe("re_preview_test_only");
    expect(() => readResendSendConfig({ ...previewEnv, EMAIL_ENVIRONMENT: "production" })).toThrow(
      /RESEND_API_KEY_PRODUCTION/,
    );
  });

  it("sends only through the injected test transport with an idempotency key", async () => {
    let captured: RequestInit | undefined;
    const fakeFetch: typeof fetch = async (_url, init) => {
      captured = init;
      return new Response(JSON.stringify({ id: "email_ride_test" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    };
    await expect(
      sendResendEmail(
        {
          to: "casey.customer@example.invalid",
          subject: "Ride requested",
          html: "<p>Ride</p>",
          idempotencyKey: "island-ride/request/demo-123/customer",
        },
        previewEnv,
        fakeFetch,
      ),
    ).resolves.toEqual({ id: "email_ride_test" });
    expect(new Headers(captured?.headers).get("Idempotency-Key")).toBe(
      "island-ride/request/demo-123/customer",
    );
  });

  it("verifies the exact raw webhook body and rejects stale or changed payloads", () => {
    const secretBytes = Buffer.from("island-ride-webhook-test");
    const secret = `whsec_${secretBytes.toString("base64")}`;
    const timestamp = 1_800_000_000;
    const id = "evt_ride_test";
    const body = Buffer.from(JSON.stringify({
      id,
      type: "email.delivered",
      created_at: "2026-09-20T20:00:00.000Z",
      data: { email_id: "email_ride_test", to: ["redacted@example.invalid"] },
    }));
    const signature = createHmac("sha256", secretBytes)
      .update(`${id}.${timestamp}.${body.toString("utf8")}`)
      .digest("base64");
    expect(
      verifyResendWebhook(
        body,
        { id, timestamp: String(timestamp), signature: `v1,${signature}` },
        secret,
        timestamp,
      ),
    ).toEqual({
      providerEventId: id,
      providerMessageId: "email_ride_test",
      eventType: "email.delivered",
      occurredAt: "2026-09-20T20:00:00.000Z",
    });
    expect(() =>
      verifyResendWebhook(
        Buffer.from(`${body.toString("utf8")} `),
        { id, timestamp: String(timestamp), signature: `v1,${signature}` },
        secret,
        timestamp,
      ),
    ).toThrow(/Invalid Resend webhook signature/);
    expect(() =>
      verifyResendWebhook(
        body,
        { id, timestamp: String(timestamp), signature: `v1,${signature}` },
        secret,
        timestamp + 301,
      ),
    ).toThrow(/outside the allowed window/);
  });

  it("escapes dynamic ride content", () => {
    const message = renderIslandRideEmail("ride-requested", {
      customerName: "<Casey>",
      reference: "demo-ride",
      pickupAddress: "<Dock>",
      dropoffAddress: "Airport",
      appUrl: "https://ride.example",
    });
    expect(message.html).toContain("&lt;Casey&gt;");
    expect(message.html).toContain("&lt;Dock&gt;");
    expect(message.html).not.toContain("<Casey>");
  });
});
