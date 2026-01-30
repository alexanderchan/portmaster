import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { homedir } from "node:os";

/**
 * Database path: ~/.config/port-master/ports.db
 */
export const DB_PATH = join(homedir(), ".config", "port-master", "ports.db");

/**
 * SQL schema for the ports table
 */
const SCHEMA = `
CREATE TABLE IF NOT EXISTS ports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  directory TEXT NOT NULL,
  port_type TEXT NOT NULL,
  port INTEGER NOT NULL,
  description TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(directory, port_type),
  UNIQUE(port)
);

CREATE INDEX IF NOT EXISTS idx_ports_directory ON ports(directory);
CREATE INDEX IF NOT EXISTS idx_ports_port_type ON ports(port_type);
CREATE INDEX IF NOT EXISTS idx_ports_port ON ports(port);
`;

/**
 * Singleton database instance
 */
let db: Database.Database | null = null;

/**
 * Initialize the database connection and schema.
 * Creates parent directories if they don't exist.
 */
function initDb(): Database.Database {
  // Create parent directories if they don't exist
  const dir = dirname(DB_PATH);
  mkdirSync(dir, { recursive: true });

  // Create and configure the database
  const database = new Database(DB_PATH);
  database.pragma("journal_mode = WAL");
  database.pragma("foreign_keys = ON");

  // Create schema
  database.exec(SCHEMA);

  return database;
}

/**
 * Get the database instance, initializing it lazily if needed.
 * This is the main export that other modules should use.
 */
export function getDb(): Database.Database {
  if (!db) {
    db = initDb();
  }
  return db;
}

/**
 * Close the database connection.
 * Useful for cleanup in tests or when the application exits.
 */
export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}

