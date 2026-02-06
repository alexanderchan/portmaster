import { resolve } from "node:path";
import { confirm } from "@clack/prompts";
import { getDb } from "../db.js";
import type { PortEntry } from "../types.js";

interface RmCommandOptions {
  dir?: string;
  interactive?: boolean;
}

export function removePort(type: string, directory: string): PortEntry | null {
  const normalizedType = type.toLowerCase();
  const db = getDb();

  const existingEntry = db
    .prepare("SELECT * FROM ports WHERE directory = ? AND port_type = ?")
    .get(directory, normalizedType) as PortEntry | undefined;

  if (!existingEntry) {
    return null;
  }

  db.prepare("DELETE FROM ports WHERE directory = ? AND port_type = ?").run(
    directory,
    normalizedType
  );

  return existingEntry;
}

export function removeAllPortsForDirectory(directory: string): PortEntry[] {
  const db = getDb();

  const entries = db
    .prepare("SELECT * FROM ports WHERE directory = ? ORDER BY port ASC")
    .all(directory) as PortEntry[];

  if (entries.length === 0) {
    return [];
  }

  db.prepare("DELETE FROM ports WHERE directory = ?").run(directory);

  return entries;
}

export async function executeRm(
  type: string | undefined,
  options: RmCommandOptions = {}
): Promise<void> {
  const directory = resolve(options.dir ?? process.cwd());
  const db = getDb();

  if (!type) {
    const entries = db
      .prepare("SELECT * FROM ports WHERE directory = ? ORDER BY port ASC")
      .all(directory) as PortEntry[];

    if (entries.length === 0) {
      console.error(`Error: No port assignments found for directory '${directory}'`);
      process.exit(1);
    }

    if (options.interactive) {
      console.log(`Ports for ${directory}:`);
      for (const e of entries) {
        console.log(`  ${e.port} (${e.port_type})`);
      }
      const shouldRemove = await confirm({
        message: `Remove all ${entries.length} port(s) for this directory?`,
      });
      if (shouldRemove !== true) {
        console.log("Cancelled.");
        return;
      }
    }

    const removed = removeAllPortsForDirectory(directory);
    console.log(`Removed ${removed.length} port(s) for ${directory}`);
    return;
  }

  const normalizedType = type.toLowerCase();

  const existingEntry = db
    .prepare("SELECT * FROM ports WHERE directory = ? AND port_type = ?")
    .get(directory, normalizedType) as PortEntry | undefined;

  if (!existingEntry) {
    console.error(
      `Error: No port assignment found for type '${normalizedType}' in directory '${directory}'`
    );
    process.exit(1);
  }

  if (options.interactive) {
    const shouldRemove = await confirm({
      message: `Remove port ${existingEntry.port} (${normalizedType}) from ${directory}?`,
    });

    if (shouldRemove !== true) {
      console.log("Cancelled.");
      return;
    }
  }

  const removed = removePort(type, directory);

  if (removed) {
    console.log(removed.port);
  }
}
