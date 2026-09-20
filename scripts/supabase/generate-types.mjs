import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const result = spawnSync("supabase", ["gen", "types", "typescript", "--local"], {
  encoding: "utf8",
  shell: process.platform === "win32",
});

if (result.error || result.status !== 0 || !result.stdout.includes("export type Database")) {
  const detail = result.stderr?.trim() || result.error?.message || `exit ${result.status}`;
  throw new Error(`Unable to generate Supabase types from the local database: ${detail}`);
}

const destination = path.join(process.cwd(), "shared", "supabase.types.ts");
fs.writeFileSync(
  destination,
  `// Generated from the local Supabase schema. Do not edit by hand.\n${result.stdout}`,
  "utf8",
);
console.log(`Wrote ${path.relative(process.cwd(), destination)}`);
