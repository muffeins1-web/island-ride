import { createHmac, timingSafeEqual } from "node:crypto";

type Environment = Record<string, string | undefined>;
export type EmailEnvironment = "preview" | "production";

export type ResendMessage = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  idempotencyKey: string;
};

export type VerifiedResendEvent = {
  providerEventId: string;
  providerMessageId?: string;
  eventType: string;
  occurredAt?: string;
};

function required(source: Environment, name: string): string {
  const value = source[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

export function resolveEmailEnvironment(source: Environment = process.env): EmailEnvironment {
  const configured = source.EMAIL_ENVIRONMENT?.trim().toLowerCase();
  if (configured === "preview" || configured === "production") return configured;
  return source.CONTEXT === "production" ? "production" : "preview";
}

function contextualValue(source: Environment, name: string): string {
  return required(source, `${name}_${resolveEmailEnvironment(source).toUpperCase()}`);
}

export function readResendWebhookSecret(source: Environment = process.env): string {
  const secret = contextualValue(source, "RESEND_WEBHOOK_SECRET");
  if (!secret.startsWith("whsec_")) throw new Error("Resend webhook secret must begin with whsec_");
  return secret;
}

export function readResendSendConfig(source: Environment = process.env) {
  if (source.EMAIL_DELIVERY_ENABLED !== "true") throw new Error("Transactional email delivery is disabled");
  const apiKey = contextualValue(source, "RESEND_API_KEY");
  if (!apiKey.startsWith("re_")) throw new Error("Resend API key must begin with re_");
  const from = contextualValue(source, "RESEND_FROM");
  if (!/@[^@\s>]+/.test(from)) throw new Error("RESEND_FROM must contain a valid sender address");
  return { apiKey, from, environment: resolveEmailEnvironment(source) };
}

export async function sendResendEmail(
  message: ResendMessage,
  source: Environment = process.env,
  fetcher: typeof fetch = fetch,
): Promise<{ id: string }> {
  if (!message.idempotencyKey || message.idempotencyKey.length > 256) {
    throw new Error("Resend idempotency key must contain 1 to 256 characters");
  }
  const config = readResendSendConfig(source);
  const response = await fetcher("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": message.idempotencyKey,
    },
    body: JSON.stringify({
      from: config.from,
      to: message.to,
      subject: message.subject,
      html: message.html,
      ...(message.text ? { text: message.text } : {}),
      ...(message.replyTo ? { reply_to: message.replyTo } : {}),
    }),
  });
  if (!response.ok) throw new Error(`Resend request failed (${response.status})`);
  const result = (await response.json()) as { id?: string };
  if (!result.id) throw new Error("Resend response did not include a message id");
  return { id: result.id };
}

function decodeSecret(secret: string): Buffer {
  const decoded = Buffer.from(secret.startsWith("whsec_") ? secret.slice(6) : secret, "base64");
  if (decoded.length === 0) throw new Error("Invalid Resend webhook secret");
  return decoded;
}

function matches(expected: Buffer, value: string): boolean {
  const actual = Buffer.from(value, "base64");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function verifyResendWebhook(
  rawBody: Buffer,
  headers: { id?: string; timestamp?: string; signature?: string },
  secret: string,
  nowSeconds = Math.floor(Date.now() / 1000),
): VerifiedResendEvent {
  if (!headers.id || !headers.timestamp || !headers.signature) {
    throw new Error("Missing Resend webhook signature headers");
  }
  const timestamp = Number(headers.timestamp);
  if (!Number.isInteger(timestamp) || Math.abs(nowSeconds - timestamp) > 300) {
    throw new Error("Resend webhook timestamp is outside the allowed window");
  }
  const content = `${headers.id}.${headers.timestamp}.${rawBody.toString("utf8")}`;
  const expected = createHmac("sha256", decodeSecret(secret)).update(content).digest();
  const valid = headers.signature
    .split(/\s+/)
    .map((value) => value.split(",", 2))
    .some(([version, signature]) => version === "v1" && Boolean(signature) && matches(expected, signature));
  if (!valid) throw new Error("Invalid Resend webhook signature");

  const payload = JSON.parse(rawBody.toString("utf8")) as {
    id?: string;
    type?: string;
    created_at?: string;
    data?: { email_id?: string };
  };
  if (!payload.id || !payload.type) throw new Error("Invalid Resend webhook payload");
  return {
    providerEventId: payload.id,
    eventType: payload.type,
    ...(payload.data?.email_id ? { providerMessageId: payload.data.email_id } : {}),
    ...(payload.created_at ? { occurredAt: payload.created_at } : {}),
  };
}
