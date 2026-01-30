import { getDb } from "./db.js";

/**
 * Port type to range mapping.
 * Each type has a specific port range for logical organization.
 */
export const PORT_RANGES: Record<string, { start: number; end: number }> = {
  dev: { start: 3100, end: 3999 },
  pg: { start: 5500, end: 5599 },
  postgres: { start: 5500, end: 5599 },
  redis: { start: 6400, end: 6499 },
  mongo: { start: 27100, end: 27199 },
  db: { start: 5600, end: 5699 },
};

/**
 * Catch-all range for unknown types
 */
export const CATCH_ALL_RANGE = { start: 9100, end: 9999 };

/**
 * Get the port range for a given type.
 * Returns the type-specific range if known, otherwise the catch-all range.
 */
export function getPortRange(type: string): { start: number; end: number } {
  const normalizedType = type.toLowerCase();
  return PORT_RANGES[normalizedType] ?? CATCH_ALL_RANGE;
}

/**
 * Get all ports currently in use from the database.
 */
function getUsedPorts(): Set<number> {
  const db = getDb();
  const rows = db.prepare("SELECT port FROM ports").all() as { port: number }[];
  return new Set(rows.map((row) => row.port));
}

/**
 * Find the first available port in a given range.
 * Returns null if all ports in the range are used.
 */
function findPortInRange(
  start: number,
  end: number,
  usedPorts: Set<number>
): number | null {
  for (let port = start; port <= end; port++) {
    if (!usedPorts.has(port)) {
      return port;
    }
  }
  return null;
}

/**
 * Find an available port for the given type.
 * First tries the type-specific range, then falls back to the catch-all range.
 *
 * @param type - The port type (dev, pg, postgres, redis, mongo, db, or any string)
 * @returns The first available port number
 * @throws Error if no ports are available in both primary and catch-all ranges
 */
export function findAvailablePort(type: string): number {
  const usedPorts = getUsedPorts();
  const primaryRange = getPortRange(type);

  // Try to find a port in the primary range
  const primaryPort = findPortInRange(
    primaryRange.start,
    primaryRange.end,
    usedPorts
  );

  if (primaryPort !== null) {
    return primaryPort;
  }

  // If primary range is exhausted, fall back to catch-all range
  // (unless we're already using the catch-all range)
  const isUsingCatchAll =
    primaryRange.start === CATCH_ALL_RANGE.start &&
    primaryRange.end === CATCH_ALL_RANGE.end;

  if (!isUsingCatchAll) {
    const catchAllPort = findPortInRange(
      CATCH_ALL_RANGE.start,
      CATCH_ALL_RANGE.end,
      usedPorts
    );

    if (catchAllPort !== null) {
      return catchAllPort;
    }
  }

  throw new Error(
    `No available ports for type "${type}". Both primary range (${primaryRange.start}-${primaryRange.end}) and catch-all range (${CATCH_ALL_RANGE.start}-${CATCH_ALL_RANGE.end}) are exhausted.`
  );
}

