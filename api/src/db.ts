import { Pool } from "pg";

export type DbConfig = {
  connectionString: string;
};

let pool: Pool | null = null;

export function getDbConfig(): DbConfig {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is required");
  }
  return { connectionString };
}

export function getDb(): Pool {
  if (!pool) {
    const config = getDbConfig();
    pool = new Pool({ connectionString: config.connectionString });
  }
  return pool;
}

export async function closeDb(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
