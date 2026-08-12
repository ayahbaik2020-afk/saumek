import { existsSync } from "node:fs";

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  for (const file of [".env.local", ".env", "../.env.local"]) {
    if (existsSync(file)) {
      process.loadEnvFile(file);
      break;
    }
  }
}

export function loadConfig(env = process.env) {
  for (const key of ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]) {
    if (!env[key]) throw new Error(`Missing env: ${key}`);
  }
  return {
    supabaseUrl: env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseKey: env.SUPABASE_SERVICE_ROLE_KEY,
    sqlServer: {
      server: env.SQL_SERVER_HOST || "192.168.20.10",
      port: Number(env.SQL_SERVER_PORT || 1433),
      database: env.SQL_SERVER_DATABASE || "SAUSIMIP",
      user: env.SQL_SERVER_USER || undefined,
      password: env.SQL_SERVER_PASSWORD || undefined,
      encrypt: env.SQL_SERVER_ENCRYPT === "true",
      timeout: Number(env.SQL_SERVER_TIMEOUT || 64000),
    },
    sourceSystem: env.WO_SOURCE_SYSTEM || "SAUSIMIP",
  };
}
