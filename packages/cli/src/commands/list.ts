import { resolve } from "node:path";
import { getDb } from "../db.js";
import type { PortEntry, PortDisplayInfo } from "../types.js";

interface ListCommandOptions {
  verbose?: boolean;
  json?: boolean;
  all?: boolean;
  dir?: string;
}

export function getAllPorts(): PortEntry[] {
  const db = getDb();
  return db
    .prepare("SELECT * FROM ports ORDER BY port ASC")
    .all() as PortEntry[];
}

export function getPortsForDirectory(directory: string): PortEntry[] {
  const db = getDb();
  return db
    .prepare("SELECT * FROM ports WHERE directory = ? ORDER BY port ASC")
    .all(directory) as PortEntry[];
}

export function formatPortsForDisplay(
  entries: PortEntry[],
  verbose: boolean = false
): PortDisplayInfo[] {
  return entries.map((entry) => ({
    port: entry.port,
    type: entry.port_type,
    directory: entry.directory,
    fullPath: entry.directory,
    description: entry.description,
  }));
}

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

function printTable(entries: PortDisplayInfo[], showDirectory: boolean): void {
  if (entries.length === 0) {
    console.log("No ports have been assigned.");
    return;
  }

  if (showDirectory) {
    const widths = calculateColumnWidths(entries);
    const header = formatRow(
      { port: "PORT", type: "TYPE", directory: "DIRECTORY", description: "DESCRIPTION" },
      widths
    );
    console.log(header);
    console.log("-".repeat(header.length));

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
  } else {
    const widths = {
      port: "PORT".length,
      type: "TYPE".length,
      description: "DESCRIPTION".length,
    };

    for (const entry of entries) {
      widths.port = Math.max(widths.port, String(entry.port).length);
      widths.type = Math.max(widths.type, entry.type.length);
      widths.description = Math.max(
        widths.description,
        (entry.description ?? "").length
      );
    }

    const header = [
      "PORT".padEnd(widths.port),
      "TYPE".padEnd(widths.type),
      "DESCRIPTION".padEnd(widths.description),
    ].join("  ");
    console.log(header);
    console.log("-".repeat(header.length));

    for (const entry of entries) {
      console.log(
        [
          String(entry.port).padEnd(widths.port),
          entry.type.padEnd(widths.type),
          (entry.description ?? "").padEnd(widths.description),
        ].join("  ")
      );
    }
  }
}

export function executeList(options: ListCommandOptions = {}): void {
  const isAll = options.all ?? false;

  let entries: PortEntry[];
  if (isAll) {
    entries = getAllPorts();
  } else {
    const directory = resolve(options.dir ?? process.cwd());
    entries = getPortsForDirectory(directory);
  }

  const displayEntries = formatPortsForDisplay(entries);

  if (options.json) {
    console.log(JSON.stringify(displayEntries, null, 2));
  } else {
    printTable(displayEntries, isAll);
  }
}
