#!/usr/bin/env node
import { createRequire } from "node:module";
import { Command } from "commander";
import { executeCleanup } from "./commands/cleanup.js";
import { executeGet } from "./commands/get.js";
import { executeInfo } from "./commands/info.js";
import { executeList } from "./commands/list.js";
import { executeRm } from "./commands/rm.js";

const require = createRequire(import.meta.url);
const { version } = require("../package.json") as { version: string };

const program = new Command();

program
  .name("port-master")
  .version(version, "-V, --version", "Display version number")
  .description(
    `Track and assign consistent development ports per project directory.

Storage location: ~/.config/port-master/ports.db

Port ranges by type:
  dev          3100-3999   Development servers
  pg/postgres  5500-5599   PostgreSQL databases
  db           5600-5699   Generic databases
  redis        6400-6499   Redis servers
  mongo        27100-27199 MongoDB servers
  (other)      9100-9999   Catch-all for custom types

Examples:
  $ port-master get dev          # Get/create dev port for current project
  $ port-master get pg --desc "local postgres"
  $ port-master list             # Show all port assignments
  $ port-master list --json      # Output as JSON
  $ port-master info             # Show ports for current project
  $ port-master rm redis         # Remove redis port assignment
  $ port-master cleanup          # Remove stale entries`
  );

// Get command - get or create a port for a service type
program
  .command("get <type>")
  .description("Get or create a port for a service type in the current project")
  .option("-d, --dir <path>", "Target directory instead of current working directory")
  .option("--desc <description>", "Optional description for the port assignment")
  .action((type: string, options: { dir?: string; desc?: string }) => {
    executeGet(type, options);
  });

// Add command - alias for get
program
  .command("add <type>")
  .description("Alias for 'get' - get or create a port for a service type")
  .option("-d, --dir <path>", "Target directory instead of current working directory")
  .option("--desc <description>", "Optional description for the port assignment")
  .action((type: string, options: { dir?: string; desc?: string }) => {
    executeGet(type, options);
  });

// List command - show all assigned ports
program
  .command("list")
  .description("Show all assigned ports across projects")
  .option("-v, --verbose", "Show full absolute paths instead of basenames")
  .option("--json", "Output as JSON array")
  .action((options: { verbose?: boolean; json?: boolean }) => {
    executeList(options);
  });

// Info command - show all ports for the current project
program
  .command("info")
  .description("Show all ports assigned to the current project")
  .option("-d, --dir <path>", "Target directory instead of current working directory")
  .option("--json", "Output as JSON")
  .action((options: { dir?: string; json?: boolean }) => {
    executeInfo(options);
  });

// Rm command - remove a port assignment
program
  .command("rm <type>")
  .description("Remove a port assignment for a service type")
  .option("-d, --dir <path>", "Target directory instead of current working directory")
  .option("-i, --interactive", "Prompt for confirmation before removing")
  .action(async (type: string, options: { dir?: string; interactive?: boolean }) => {
    await executeRm(type, options);
  });

// Cleanup command - remove entries for deleted project directories
program
  .command("cleanup")
  .description("Remove entries for deleted project directories")
  .option("-n, --dry-run", "Show what would be removed without removing")
  .option("-i, --interactive", "Prompt for confirmation before removing")
  .action(async (options: { dryRun?: boolean; interactive?: boolean }) => {
    await executeCleanup(options);
  });

program.parse();

