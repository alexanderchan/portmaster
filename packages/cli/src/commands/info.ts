import { basename, resolve } from "node:path";
import { getDb } from "../db.js";
import type { PortEntry } from "../types.js";

/** Options for the info command - matches what Commander provides */
interface InfoCommandOptions {
  dir?: string;
  json?: boolean;
}

/**
 * Get all port entries for a specific directory from the database.
 *
 * @param directory - The absolute path to the directory
 * @returns Array of port entries for the directory
 */
export function getPortsForDirectory(directory: string): PortEntry[] {
  const db = getDb();
  const rows = db
    .prepare("SELECT * FROM ports WHERE directory = ? ORDER BY port ASC")
    .all(directory) as PortEntry[];
  return rows;
}

/**
 * Format port entries for the info display.
 *
 * @param entries - Array of port entries from the database
 * @returns Array of formatted entries for display
 */
function formatInfoEntries(
  entries: PortEntry[]
): { type: string; port: number; description: string | null }[] {
  return entries.map((entry) => ({
    type: entry.port_type,
    port: entry.port,
    description: entry.description,
  }));
}

/**
 * Output info for a project directory.
 */
interface InfoOutput {
  directory: string;
  fullPath: string;
  ports: { type: string; port: number; description: string | null }[];
}

/**
 * Get info for a project directory.
 *
 * @param options - Command options including optional --dir
 * @returns Info output object with directory details and ports
 */
export function getInfo(options: InfoCommandOptions = {}): InfoOutput {
  const directory = resolve(options.dir ?? process.cwd());
  const dirName = basename(directory);
  const entries = getPortsForDirectory(directory);

  return {
    directory: dirName,
    fullPath: directory,
    ports: formatInfoEntries(entries),
  };
}

/**
 * Print formatted info for a project directory.
 *
 * @param info - The info output object
 */
function printInfo(info: InfoOutput): void {
  if (info.ports.length === 0) {
    console.log(`No ports have been assigned to ${info.directory}.`);
    console.log(`  Path: ${info.fullPath}`);
    console.log("");
    console.log('Use "portmaster get <type>" to assign a port.');
    return;
  }

  console.log(`Project: ${info.directory}`);
  console.log(`Path: ${info.fullPath}`);
  console.log("");

  // Calculate column widths
  const widths = {
    type: "TYPE".length,
    port: "PORT".length,
    description: "DESCRIPTION".length,
  };

  for (const entry of info.ports) {
    widths.type = Math.max(widths.type, entry.type.length);
    widths.port = Math.max(widths.port, String(entry.port).length);
    widths.description = Math.max(
      widths.description,
      (entry.description ?? "").length
    );
  }

  // Print header
  const header = [
    "TYPE".padEnd(widths.type),
    "PORT".padEnd(widths.port),
    "DESCRIPTION".padEnd(widths.description),
  ].join("  ");
  console.log(header);
  console.log("-".repeat(header.length));

  // Print rows
  for (const entry of info.ports) {
    console.log(
      [
        entry.type.padEnd(widths.type),
        String(entry.port).padEnd(widths.port),
        (entry.description ?? "").padEnd(widths.description),
      ].join("  ")
    );
  }
}

/**
 * Execute the info command - shows all ports for the current project.
 *
 * @param options - Command options (dir, json)
 */
export function executeInfo(options: InfoCommandOptions = {}): void {
  const info = getInfo(options);

  if (options.json) {
    console.log(JSON.stringify(info, null, 2));
  } else {
    printInfo(info);
  }
}

