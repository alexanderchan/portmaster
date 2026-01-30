import { resolve } from "node:path";
import { confirm } from "@clack/prompts";
import { getDb } from "../db.js";
import type { PortEntry } from "../types.js";

/** Options for the rm command - matches what Commander provides */
interface RmCommandOptions {
  dir?: string;
  interactive?: boolean;
}

/**
 * Remove a port assignment for a directory and port type.
 *
 * @param type - The port type to remove
 * @param directory - The absolute path to the directory
 * @returns The removed port entry, or null if none existed
 */
export function removePort(type: string, directory: string): PortEntry | null {
  const normalizedType = type.toLowerCase();
  const db = getDb();

  // Check if the assignment exists
  const existingEntry = db
    .prepare("SELECT * FROM ports WHERE directory = ? AND port_type = ?")
    .get(directory, normalizedType) as PortEntry | undefined;

  if (!existingEntry) {
    return null;
  }

  // Delete the entry
  db.prepare("DELETE FROM ports WHERE directory = ? AND port_type = ?").run(
    directory,
    normalizedType
  );

  return existingEntry;
}

/**
 * Execute the rm command - removes a port assignment.
 *
 * @param type - The port type to remove
 * @param options - Command options (dir, interactive)
 */
export async function executeRm(
  type: string,
  options: RmCommandOptions = {}
): Promise<void> {
  const directory = resolve(options.dir ?? process.cwd());
  const normalizedType = type.toLowerCase();

  const db = getDb();

  // Check if the assignment exists first
  const existingEntry = db
    .prepare("SELECT * FROM ports WHERE directory = ? AND port_type = ?")
    .get(directory, normalizedType) as PortEntry | undefined;

  if (!existingEntry) {
    console.error(
      `Error: No port assignment found for type '${normalizedType}' in directory '${directory}'`
    );
    process.exit(1);
  }

  // If interactive mode, prompt for confirmation
  if (options.interactive) {
    const shouldRemove = await confirm({
      message: `Remove port ${existingEntry.port} (${normalizedType}) from ${directory}?`,
    });

    // User cancelled or said no
    if (shouldRemove !== true) {
      console.log("Cancelled.");
      return;
    }
  }

  // Remove the port
  const removed = removePort(type, directory);

  if (removed) {
    console.log(removed.port);
  }
}

