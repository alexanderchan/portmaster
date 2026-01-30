import { Command } from "commander";
import { executeGet } from "./commands/get.js";
import { executeInfo } from "./commands/info.js";
import { executeList } from "./commands/list.js";
import { executeRm } from "./commands/rm.js";

const program = new Command();

program
  .name("port-master")
  .description("Track and assign consistent development ports per project directory");

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

program.parse();

