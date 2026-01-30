import { resolve } from "node:path";
import { getDb } from "../db.js";
import { findAvailablePort } from "../ports.js";
import type { GetOptions, PortEntry } from "../types.js";

/**
 * Get or create a port for a service type in a project directory.
 *
 * If a port already exists for the (directory, type) combination, it returns the existing port.
 * If no port exists, it allocates a new port from the appropriate range and saves it.
 *
 * @param type - The port type (dev, pg, postgres, redis, mongo, db, or any custom string)
 * @param options - Command options including optional --dir and --desc
 * @returns The port number (existing or newly created)
 */
export function getPort(type: string, options: GetOptions = {}): number {
  // Resolve the target directory (use cwd if not specified)
  const directory = resolve(options.dir ?? process.cwd());

  // Normalize the type to lowercase for consistency
  const normalizedType = type.toLowerCase();

  const db = getDb();

  // Check if a port already exists for this directory and type
  const existingEntry = db
    .prepare(
      "SELECT * FROM ports WHERE directory = ? AND port_type = ?"
    )
    .get(directory, normalizedType) as PortEntry | undefined;

  if (existingEntry) {
    return existingEntry.port;
  }

  // No existing port, allocate a new one
  const port = findAvailablePort(normalizedType);

  // Insert the new port entry
  db.prepare(
    `INSERT INTO ports (directory, port_type, port, description)
     VALUES (?, ?, ?, ?)`
  ).run(directory, normalizedType, port, options.desc ?? null);

  return port;
}

/**
 * Execute the get command - this is what gets called from the CLI.
 * Outputs just the port number to stdout (for scripting).
 *
 * @param type - The port type
 * @param options - Command options
 */
export function executeGet(type: string, options: GetOptions = {}): void {
  const port = getPort(type, options);
  console.log(port);
}

