import { describe, expect, it } from "vitest";
import { poolConfig } from "../src/lib/db";

describe("poolConfig", () => {
  it("strips Supabase SSL query params so pg uses the explicit TLS config", () => {
    const config = poolConfig(
      "postgres://postgres:pass@db.example.supabase.co:5432/postgres?sslmode=require&sslrootcert=/tmp/ca.pem"
    );

    expect(config.connectionString).toBe(
      "postgres://postgres:pass@db.example.supabase.co:5432/postgres"
    );
    expect(config.ssl).toEqual({ rejectUnauthorized: false });
  });

  it("preserves sslmode=disable for local Postgres", () => {
    const config = poolConfig("postgres://user:pass@localhost:5432/app?sslmode=disable");

    expect(config.connectionString).toBe("postgres://user:pass@localhost:5432/app");
    expect(config.ssl).toBe(false);
  });
});
