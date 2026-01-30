import { basename } from "node:path";
import { getDb } from "../db.js";
import type { PortEntry, PortDisplayInfo } from "../types.js";

/** Options for the list command - matches what commander provides */
interface ListCommandOptions {
  verbose?: boolean;
  json?: boolean;
}

/**
 * Get all port entries from the database sorted by port number.
 *
 * @returns Array of port entries sorted by port
 */
export function getAllPorts(): PortEntry[] {
  const db = getDb();
  const rows = db
    .prepare("SELECT * FROM ports ORDER BY port ASC")
    .all() as PortEntry[];
  return rows;
}

/**
 * Format port entries for display (with optional verbose mode).
 *
 * @param entries - Array of port entries from the database
 * @param verbose - If true, show full paths; if false, show basenames
 * @returns Array of display info objects
 */
export function formatPortsForDisplay(
  entries: PortEntry[],
  verbose: boolean = false
): PortDisplayInfo[] {
  return entries.map((entry) => ({
    port: entry.port,
    type: entry.port_type,
    directory: verbose ? entry.directory : basename(entry.directory),
    fullPath: entry.directory,
    description: entry.description,
  }));
}

/**
 * Calculate column widths for table formatting.
 *
 * @param entries - Array of display info objects
 * @returns Object with column widths
 */
function calculateColumnWidths(entries: PortDisplayInfo[]): {
  port: number;
  type: number;
  directory: number;
  description: number;
} {
  const widths = {
    port: "PORT".length,
    type: "TYPE".length,
    directory: "DIRECTORY".length,
    description: "DESCRIPTION".length,
  };

  for (const entry of entries) {
    widths.port = Math.max(widths.port, String(entry.port).length);
    widths.type = Math.max(widths.type, entry.type.length);
    widths.directory = Math.max(widths.directory, entry.directory.length);
    widths.description = Math.max(
      widths.description,
      (entry.description ?? "").length
    );
  }

  return widths;
}

/**
 * Format a row of the table with padding.
 */
function formatRow(
  values: { port: string; type: string; directory: string; description: string },
  widths: { port: number; type: number; directory: number; description: number }
): string {
  return [
    values.port.padEnd(widths.port),
    values.type.padEnd(widths.type),
    values.directory.padEnd(widths.directory),
    values.description.padEnd(widths.description),
  ].join("  ");
}

/**
 * Print a formatted table of port entries.
 *
 * @param entries - Array of display info objects
 */
function printTable(entries: PortDisplayInfo[]): void {
  if (entries.length === 0) {
    console.log("No ports have been assigned yet.");
    return;
  }

  const widths = calculateColumnWidths(entries);

  // Print header
  const header = formatRow(
    { port: "PORT", type: "TYPE", directory: "DIRECTORY", description: "DESCRIPTION" },
    widths
  );
  console.log(header);

  // Print separator
  console.log("-".repeat(header.length));

  // Print rows
  for (const entry of entries) {
    console.log(
      formatRow(
        {
          port: String(entry.port),
          type: entry.type,
          directory: entry.directory,
          description: entry.description ?? "",
        },
        widths
      )
    );
  }
}

/**
 * Execute the list command - shows all assigned ports across projects.
 *
 * @param options - Command options (verbose, json)
 */
export function executeList(options: ListCommandOptions = {}): void {
  const entries = getAllPorts();
  const displayEntries = formatPortsForDisplay(entries, options.verbose ?? false);

  if (options.json) {
    // Output JSON array
    console.log(JSON.stringify(displayEntries, null, 2));
  } else {
    // Output formatted table
    printTable(displayEntries);
  }
}

