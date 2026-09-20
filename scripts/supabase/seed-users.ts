import { pathToFileURL } from "node:url";
import path from "node:path";

type Environment = Record<string, string | undefined>;
type PlatformRole = "superadmin" | "admin" | "customer";

type SeedIdentity = {
  role: PlatformRole;
  email: string;
  password: string;
  displayName: string;
};

export type SeedConfiguration = {
  supabaseUrl: string;
  serviceRoleKey: string;
  siteSlug: string;
  identities: SeedIdentity[];
};

const NON_PRODUCTION_ENVIRONMENTS = new Set(["local", "development", "test", "staging"]);

function required(env: Environment, key: string): string {
  const value = env[key]?.trim();
  if (!value) throw new Error(`${key} is required`);
  return value;
}

function validateDemoEmail(value: string, key: string): string {
  const email = value.trim().toLowerCase();
  if (!email.endsWith("@example.invalid")) {
    throw new Error(`${key} must use the non-deliverable example.invalid domain`);
  }
  return email;
}

function validatePassword(value: string, key: string): string {
  if (value.length < 16 || !/[A-Z]/.test(value) || !/[a-z]/.test(value) || !/\d/.test(value)) {
    throw new Error(`${key} must be at least 16 characters with upper, lower, and numeric characters`);
  }
  if (/password|changeme|example/i.test(value)) {
    throw new Error(`${key} contains a blocked placeholder phrase`);
  }
  return value;
}

export function validateSeedEnvironment(env: Environment = process.env): SeedConfiguration {
  const projectEnvironment = required(env, "SUPABASE_PROJECT_ENV").toLowerCase();
  if (!NON_PRODUCTION_ENVIRONMENTS.has(projectEnvironment)) {
    throw new Error("Demo seeding is restricted to local, development, test, or staging projects");
  }
  if (env.NODE_ENV === "production" || env.CONTEXT === "production") {
    throw new Error("Demo seeding is blocked in production");
  }
  if (env.ALLOW_DEMO_SEEDING !== "true") {
    throw new Error("Set ALLOW_DEMO_SEEDING=true for this explicit non-production seed run");
  }

  const identities: SeedIdentity[] = [
    {
      role: "superadmin",
      displayName: "Avery Demo — Agency Admin",
      email: validateDemoEmail(
        required(env, "ISLAND_RIDE_SEED_SUPERADMIN_EMAIL"),
        "ISLAND_RIDE_SEED_SUPERADMIN_EMAIL",
      ),
      password: validatePassword(
        required(env, "ISLAND_RIDE_SEED_SUPERADMIN_PASSWORD"),
        "ISLAND_RIDE_SEED_SUPERADMIN_PASSWORD",
      ),
    },
    {
      role: "admin",
      displayName: "Jordan Demo — Business Owner",
      email: validateDemoEmail(
        required(env, "ISLAND_RIDE_SEED_ADMIN_EMAIL"),
        "ISLAND_RIDE_SEED_ADMIN_EMAIL",
      ),
      password: validatePassword(
        required(env, "ISLAND_RIDE_SEED_ADMIN_PASSWORD"),
        "ISLAND_RIDE_SEED_ADMIN_PASSWORD",
      ),
    },
    {
      role: "customer",
      displayName: "Casey Demo — Customer",
      email: validateDemoEmail(
        required(env, "ISLAND_RIDE_SEED_CUSTOMER_EMAIL"),
        "ISLAND_RIDE_SEED_CUSTOMER_EMAIL",
      ),
      password: validatePassword(
        required(env, "ISLAND_RIDE_SEED_CUSTOMER_PASSWORD"),
        "ISLAND_RIDE_SEED_CUSTOMER_PASSWORD",
      ),
    },
  ];

  if (new Set(identities.map(({ email }) => email)).size !== identities.length) {
    throw new Error("Seed emails must be unique");
  }
  if (new Set(identities.map(({ password }) => password)).size !== identities.length) {
    throw new Error("Every seeded role requires a unique per-site password");
  }

  const supabaseUrl = new URL(required(env, "SUPABASE_URL"));
  if (!/^https?:$/.test(supabaseUrl.protocol)) {
    throw new Error("SUPABASE_URL must use http or https");
  }
  const isLocal = supabaseUrl.hostname === "localhost" || supabaseUrl.hostname === "127.0.0.1";
  if (!isLocal) {
    const allowedProjectRef = required(env, "SEED_ALLOWED_PROJECT_REF");
    if (supabaseUrl.hostname !== `${allowedProjectRef}.supabase.co`) {
      throw new Error("SUPABASE_URL does not match SEED_ALLOWED_PROJECT_REF");
    }
  }
  const siteSlug = required(env, "SUPABASE_SITE_SLUG");
  if (siteSlug !== "island-ride") throw new Error("SUPABASE_SITE_SLUG must be island-ride for this seed");

  return {
    supabaseUrl: supabaseUrl.toString().replace(/\/$/, ""),
    serviceRoleKey: required(env, "SUPABASE_SERVICE_ROLE_KEY"),
    siteSlug,
    identities,
  };
}

async function adminRequest<T>(
  config: SeedConfiguration,
  pathName: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${config.supabaseUrl}${pathName}`, {
    ...init,
    headers: {
      apikey: config.serviceRoleKey,
      Authorization: `Bearer ${config.serviceRoleKey}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Supabase seed request failed (${response.status}): ${detail || response.statusText}`);
  }
  if (response.status === 204) return undefined as T;
  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

async function ensureAuthUser(config: SeedConfiguration, identity: SeedIdentity) {
  const listing = await adminRequest<{ users: { id: string; email?: string; app_metadata?: Record<string, unknown> }[] }>(
    config,
    "/auth/v1/admin/users?page=1&per_page=1000",
  );
  const existing = listing.users.find((user) => user.email?.toLowerCase() === identity.email);
  if (existing && (
    existing.app_metadata?.seed_identity !== true
    || existing.app_metadata?.site_slug !== config.siteSlug
  )) {
    throw new Error(`Refusing to adopt existing non-demo identity ${identity.email}`);
  }
  const body = {
    email: identity.email,
    password: identity.password,
    email_confirm: true,
    user_metadata: { display_name: identity.displayName, demo: true },
    app_metadata: {
      platform_role: identity.role,
      demo: true,
      seed_identity: true,
      site_slug: config.siteSlug,
    },
  };

  if (existing) {
    await adminRequest(config, `/auth/v1/admin/users/${existing.id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
    return { id: existing.id, action: "updated" as const };
  }

  const created = await adminRequest<{ id: string }>(config, "/auth/v1/admin/users", {
    method: "POST",
    body: JSON.stringify(body),
  });
  return { id: created.id, action: "created" as const };
}

export async function seedDemoUsers(env: Environment = process.env): Promise<void> {
  const config = validateSeedEnvironment(env);
  const sites = await adminRequest<{ id: string }[]>(
    config,
    `/rest/v1/sites?slug=eq.${encodeURIComponent(config.siteSlug)}&select=id&limit=1`,
  );
  const siteId = sites[0]?.id;
  if (!siteId) throw new Error(`No site row exists for slug ${config.siteSlug}; run migrations first`);

  for (const identity of config.identities) {
    const user = await ensureAuthUser(config, identity);
    await adminRequest(
      config,
      "/rest/v1/profiles?on_conflict=id",
      {
        method: "POST",
        headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
        body: JSON.stringify({
          id: user.id,
          email: identity.email,
          display_name: identity.displayName,
          platform_role: identity.role,
          is_demo: true,
        }),
      },
    );
    await adminRequest(
      config,
      "/rest/v1/site_memberships?on_conflict=site_id,user_id",
      {
        method: "POST",
        headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
        body: JSON.stringify({
          site_id: siteId,
          user_id: user.id,
          site_role: identity.role,
          status: "active",
        }),
      },
    );
    console.log(`[seed] ${identity.role}: ${user.action}`);
  }
}

const invokedPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : "";
if (invokedPath === import.meta.url) {
  seedDemoUsers().catch((error) => {
    console.error(`[seed] ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  });
}
