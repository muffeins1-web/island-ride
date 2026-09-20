import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const migrationDirectory = path.join(root, "supabase", "migrations");
const migrations = fs.existsSync(migrationDirectory)
  ? fs.readdirSync(migrationDirectory).filter((name) => name.endsWith(".sql")).sort()
  : [];

if (migrations.length === 0) throw new Error("No Supabase migration was found");

const sql = migrations.map((name) => fs.readFileSync(path.join(migrationDirectory, name), "utf8")).join("\n");
const requiredTables = [
  "profiles",
  "site_memberships",
  "rider_profiles",
  "driver_profiles",
  "driver_verifications",
  "vehicles",
  "service_areas",
  "ride_requests",
  "rides",
  "ride_status_events",
  "fare_quotes",
  "payment_references",
  "ratings",
  "saved_places",
  "earning_entries",
  "payout_ledger",
  "notifications",
  "email_outbox",
  "email_delivery_events",
  "audit_log",
];

for (const table of requiredTables) {
  if (!sql.includes(`create table public.${table}`)) throw new Error(`Missing table: ${table}`);
  if (!sql.includes(`alter table public.${table} enable row level security`)) {
    throw new Error(`RLS is not enabled for: ${table}`);
  }
}

for (const role of ["superadmin", "admin", "customer"]) {
  if (!sql.includes(`'${role}'`)) throw new Error(`Missing platform role: ${role}`);
}
for (const bucket of ["driver-documents", "avatars"]) {
  if (!sql.includes(`'${bucket}'`)) throw new Error(`Missing storage bucket or policy: ${bucket}`);
}
if (!sql.includes("create policy") || !sql.includes("audit_row_change")) {
  throw new Error("RLS policies or audit triggers are missing");
}
for (const contract of [
  "pg_advisory_xact_lock",
  "A site must retain at least one active superadmin",
  "driver_profiles_membership_fk",
  "rides_driver_site_fk",
  "email_delivery_events_admin_read",
]) {
  if (!sql.includes(contract)) throw new Error(`Missing security contract: ${contract}`);
}

console.log(`Validated ${migrations.length} migration(s), ${requiredTables.length} required tables, RLS, roles, storage, and audit hooks.`);
