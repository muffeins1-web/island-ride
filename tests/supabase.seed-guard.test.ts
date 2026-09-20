import { describe, expect, it } from "vitest";
import { validateSeedEnvironment } from "../scripts/supabase/seed-users";

const validEnvironment = {
  SUPABASE_PROJECT_ENV: "local",
  ALLOW_DEMO_SEEDING: "true",
  SUPABASE_URL: "http://127.0.0.1:54321",
  SUPABASE_SERVICE_ROLE_KEY: "local-service-role-value",
  SUPABASE_SITE_SLUG: "island-ride",
  ISLAND_RIDE_SEED_SUPERADMIN_EMAIL: "avery.agency@example.invalid",
  ISLAND_RIDE_SEED_SUPERADMIN_PASSWORD: "AveryLocal987654!",
  ISLAND_RIDE_SEED_ADMIN_EMAIL: "jordan.owner@example.invalid",
  ISLAND_RIDE_SEED_ADMIN_PASSWORD: "JordanLocal876543!",
  ISLAND_RIDE_SEED_CUSTOMER_EMAIL: "casey.customer@example.invalid",
  ISLAND_RIDE_SEED_CUSTOMER_PASSWORD: "CaseyLocal765432!",
};

describe("Supabase demo seed guard", () => {
  it("blocks production", () => {
    expect(() => validateSeedEnvironment({ ...validEnvironment, NODE_ENV: "production" })).toThrow(
      /blocked in production/,
    );
  });

  it("requires an explicit opt-in", () => {
    expect(() => validateSeedEnvironment({ ...validEnvironment, ALLOW_DEMO_SEEDING: "false" })).toThrow(
      /ALLOW_DEMO_SEEDING/,
    );
  });

  it("requires non-deliverable demo email addresses", () => {
    expect(() =>
      validateSeedEnvironment({
        ...validEnvironment,
        ISLAND_RIDE_SEED_CUSTOMER_EMAIL: "casey@example.com",
      }),
    ).toThrow(/example\.invalid/);
  });

  it("requires different passwords for all roles", () => {
    expect(() =>
      validateSeedEnvironment({
        ...validEnvironment,
        ISLAND_RIDE_SEED_CUSTOMER_PASSWORD: validEnvironment.ISLAND_RIDE_SEED_ADMIN_PASSWORD,
      }),
    ).toThrow(/unique per-site password/);
  });

  it("pins remote seeds to one explicit Supabase project ref", () => {
    expect(() =>
      validateSeedEnvironment({
        ...validEnvironment,
        SUPABASE_URL: "https://actualref.supabase.co",
        SEED_ALLOWED_PROJECT_REF: "differentref",
      }),
    ).toThrow(/does not match SEED_ALLOWED_PROJECT_REF/);
  });

  it("refuses to seed another site's slug", () => {
    expect(() =>
      validateSeedEnvironment({ ...validEnvironment, SUPABASE_SITE_SLUG: "another-site" }),
    ).toThrow(/must be island-ride/);
  });
});
