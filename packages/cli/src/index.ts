import { Command } from "commander";
import { executeGet } from "./commands/get.js";

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

program.parse();

