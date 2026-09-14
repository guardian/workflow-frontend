import { resolve } from "node:path";
import { existsSync } from "node:fs";
import type { StartedTestContainer } from "testcontainers";
import { E2E_ROOT, DB } from "../constants.js";

/**
 * CSV fixtures loaded into the datastore's Postgres, parent tables before FK
 * children. Column lists match the workflow datastore schema. Files that don't
 * exist are skipped, so you can seed only what a scenario needs.
 *
 * Note: the datastore's own evolutions already seed reference data (sections,
 * etc.), so there is nothing to load by default. Add a CSV + entry here only for
 * extra rows a scenario needs (e.g. pre-existing stubs).
 */
const DB_SEED_TABLES: { table: string; columns: string; file: string }[] = [];

const dbUrl = `postgresql://${DB.user}:${DB.password}@localhost:5432/${DB.database}`;

/**
 * Seed the datastore's Postgres from the host. Run only AFTER the datastore's own
 * migrations have created the schema (its healthcheck triggers them on first hit).
 */
export async function seedDatabase(db: StartedTestContainer): Promise<void> {
  for (const { table, columns, file } of DB_SEED_TABLES) {
    const source = resolve(E2E_ROOT, "fixtures/db", file);
    if (!existsSync(source)) continue;

    await db.copyFilesToContainer([{ source, target: `/tmp/${file}` }]);

    const { exitCode, output } = await db.exec([
      "psql",
      dbUrl,
      "-v",
      "ON_ERROR_STOP=1",
      "-c",
      `\\copy ${table}(${columns}) from '/tmp/${file}' with (format csv, header true, null 'NULL')`,
    ]);
    if (exitCode !== 0) {
      throw new Error(`seeding ${table} failed (${exitCode}):\n${output}`);
    }
  }
}
