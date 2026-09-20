import { describe, expect, it } from "vitest";
import {
  createSupabaseRestClient,
  getBackendProvider,
  readSupabaseServerConfig,
} from "../server/supabase";

describe("Supabase staged backend configuration", () => {
  it("keeps MySQL as the default provider", () => {
    expect(getBackendProvider({})).toBe("mysql");
    expect(getBackendProvider({ BACKEND_PROVIDER: "supabase" })).toBe("supabase");
  });

  it("stays disabled when no Supabase variables are present", () => {
    expect(readSupabaseServerConfig({})).toBeNull();
  });

  it("requires the URL and anon key as one configuration unit", () => {
    expect(() => readSupabaseServerConfig({ SUPABASE_URL: "http://127.0.0.1:54321" })).toThrow(
      /configured together/,
    );
  });

  it("normalizes a valid server configuration without requiring a service key", () => {
    expect(
      readSupabaseServerConfig({
        SUPABASE_URL: "http://127.0.0.1:54321/",
        SUPABASE_ANON_KEY: "local-anon-key",
      }),
    ).toEqual({ url: "http://127.0.0.1:54321", anonKey: "local-anon-key" });
  });

  it("refuses service-role requests when the server key is absent", async () => {
    const client = createSupabaseRestClient({
      url: "http://127.0.0.1:54321",
      anonKey: "local-anon-key",
    });
    await expect(client.request("/rest/v1/profiles", {}, { serviceRole: true })).rejects.toThrow(
      /SERVICE_ROLE_KEY/,
    );
  });
});
