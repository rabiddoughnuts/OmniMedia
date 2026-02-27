import { Pool } from "pg";

// Note: Raw pg access is retained for complex queries alongside Sequelize usage.

export type DbConfig = {
  connectionString: string;
  max: number;
  idleTimeoutMillis: number;
  connectionTimeoutMillis: number;
};

let pool: Pool | null = null;

function getDbConfig(): DbConfig {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is required");
  }
  const max = Number(process.env.DB_POOL_MAX ?? 10);
  const idleTimeoutMillis = Number(process.env.DB_IDLE_TIMEOUT_MS ?? 30000);
  const connectionTimeoutMillis = Number(process.env.DB_CONN_TIMEOUT_MS ?? 5000);

  return {
    connectionString,
    max,
    idleTimeoutMillis,
    connectionTimeoutMillis,
  };
}

export function getDb(): Pool {
  if (!pool) {
    const config = getDbConfig();
    pool = new Pool({
      connectionString: config.connectionString,
      max: config.max,
      idleTimeoutMillis: config.idleTimeoutMillis,
      connectionTimeoutMillis: config.connectionTimeoutMillis,
    });
  }
  return pool;
}

export async function closeDb(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
