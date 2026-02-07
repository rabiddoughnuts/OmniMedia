import "dotenv/config";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { getDb, closeDb } from "./db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigrations() {
  const db = getDb();
  
  // Create migrations table if it doesn't exist
  await db.query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) UNIQUE NOT NULL,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  const migrationsDir = path.join(__dirname, "../migrations");
  const files = await fs.readdir(migrationsDir);
  const sqlFiles = files.filter((f) => f.endsWith(".sql")).sort();

  for (const file of sqlFiles) {
    const { rows } = await db.query(
      "SELECT 1 FROM migrations WHERE name = $1",
      [file]
    );

    if (rows.length === 0) {
      console.log(`Running migration: ${file}`);
      const content = await fs.readFile(
        path.join(migrationsDir, file),
        "utf-8"
      );
      
      // Extract up migration (before "-- Down Migration")
      const upMigration = content.split("-- Down Migration")[0];

      await db.query("BEGIN");
      try {
        await db.query(upMigration);
        await db.query("INSERT INTO migrations (name) VALUES ($1)", [file]);
        await db.query("COMMIT");
      } catch (migrationError) {
        await db.query("ROLLBACK");
        throw migrationError;
      }
      console.log(`✓ Applied ${file}`);
    } else {
      console.log(`✓ Already applied: ${file}`);
    }
  }

  await closeDb();
  console.log("\n✓ All migrations complete!");
}

runMigrations().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
