import { existsSync } from "node:fs";
import { confirm } from "@clack/prompts";
import { getDb } from "../db.js";
import type { PortEntry } from "../types.js";

/** Options for the cleanup command - matches what Commander provides */
interface CleanupCommandOptions {
  dryRun?: boolean;
  interactive?: boolean;
}

/**
 * Get all port entries from the database.
 *
 * @returns Array of all port entries
 */
export function getAllPortEntries(): PortEntry[] {
  const db = getDb();
  const entries = db
    .prepare("SELECT * FROM ports ORDER BY directory, port_type")
    .all() as PortEntry[];
  return entries;
}

/**
 * Find entries where the directory no longer exists on the filesystem.
 *
 * @returns Array of stale port entries
 */
export function findStaleEntries(): PortEntry[] {
  const entries = getAllPortEntries();
  return entries.filter((entry) => !existsSync(entry.directory));
}

/**
 * Remove stale entries from the database.
 *
 * @param entries - Array of entries to remove
 * @returns Number of entries removed
 */
export function removeStaleEntries(entries: PortEntry[]): number {
  const db = getDb();
  const deleteStmt = db.prepare("DELETE FROM ports WHERE id = ?");

  let count = 0;
  for (const entry of entries) {
    deleteStmt.run(entry.id);
    count++;
  }

  return count;
}

/**
 * Execute the cleanup command - removes entries for deleted project directories.
 *
 * @param options - Command options (dryRun, interactive)
 */
export async function executeCleanup(
  options: CleanupCommandOptions = {}
): Promise<void> {
  const staleEntries = findStaleEntries();

  if (staleEntries.length === 0) {
    console.log("No stale entries found. All directories exist.");
    return;
  }

  // Display what would be (or will be) removed
  console.log(
    `Found ${staleEntries.length} stale ${staleEntries.length === 1 ? "entry" : "entries"}:`
  );
  console.log("");

  for (const entry of staleEntries) {
    console.log(`  - ${entry.directory} (${entry.port_type}: ${entry.port})`);
  }
  console.log("");

  // If dry-run mode, just show what would be removed
  if (options.dryRun) {
    console.log(
      `Would remove ${staleEntries.length} ${staleEntries.length === 1 ? "entry" : "entries"}.`
    );
    return;
  }

  // If interactive mode, prompt for confirmation
  if (options.interactive) {
    const shouldRemove = await confirm({
      message: `Remove ${staleEntries.length} stale ${staleEntries.length === 1 ? "entry" : "entries"}?`,
    });

    // User cancelled or said no
    if (shouldRemove !== true) {
      console.log("Cancelled.");
      return;
    }
  }

  // Actually remove the entries
  const removedCount = removeStaleEntries(staleEntries);
  console.log(
    `Removed ${removedCount} stale ${removedCount === 1 ? "entry" : "entries"}.`
  );
}

