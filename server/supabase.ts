export type BackendProvider = "mysql" | "supabase";

export type SupabaseServerConfig = {
  url: string;
  anonKey: string;
  serviceRoleKey?: string;
};

type Environment = Record<string, string | undefined>;

function normalizeUrl(value: string): string {
  const parsed = new URL(value);
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("SUPABASE_URL must use http or https");
  }
  return parsed.toString().replace(/\/$/, "");
}

export function getBackendProvider(env: Environment = process.env): BackendProvider {
  return env.BACKEND_PROVIDER === "supabase" ? "supabase" : "mysql";
}

export function readSupabaseServerConfig(
  env: Environment = process.env,
): SupabaseServerConfig | null {
  const rawUrl = env.SUPABASE_URL?.trim();
  const anonKey = env.SUPABASE_ANON_KEY?.trim();

  if (!rawUrl && !anonKey) return null;
  if (!rawUrl || !anonKey) {
    throw new Error("SUPABASE_URL and SUPABASE_ANON_KEY must be configured together");
  }

  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  return {
    url: normalizeUrl(rawUrl),
    anonKey,
    ...(serviceRoleKey ? { serviceRoleKey } : {}),
  };
}

export function createSupabaseRestClient(config: SupabaseServerConfig) {
  async function request<T>(
    path: string,
    init: RequestInit = {},
    options: { serviceRole?: boolean; bearerToken?: string } = {},
  ): Promise<T> {
    const key = options.serviceRole ? config.serviceRoleKey : config.anonKey;
    if (!key) {
      throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for this server operation");
    }

    const response = await fetch(`${config.url}${path.startsWith("/") ? path : `/${path}`}`, {
      ...init,
      headers: {
        apikey: key,
        Authorization: `Bearer ${options.bearerToken ?? key}`,
        "Content-Type": "application/json",
        ...init.headers,
      },
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new Error(`Supabase request failed (${response.status}): ${detail || response.statusText}`);
    }

    if (response.status === 204) return undefined as T;
    const text = await response.text();
    return (text ? JSON.parse(text) : undefined) as T;
  }

  return { request };
}

export function getSupabaseServerClient(env: Environment = process.env) {
  const config = readSupabaseServerConfig(env);
  return config ? createSupabaseRestClient(config) : null;
}
