import { resolve } from "node:path";
import { getPortsForDirectory } from "./info.js";

/** Options for the env command */
interface EnvCommandOptions {
  dir?: string;
  prefix?: string;
  uppercase?: boolean;
}

/**
 * Convert a port type to an environment variable name.
 * 
 * @param portType - The port type (e.g., "dev", "pg", "redis")
 * @param prefix - Optional prefix for the variable name
 * @param uppercase - Whether to uppercase the variable name (default: true)
 * @returns Environment variable name (e.g., "DEV_PORT", "PG_PORT")
 */
function toEnvVarName(portType: string, prefix?: string, uppercase = true): string {
  // Replace hyphens and spaces with underscores
  let name = portType.replace(/[-\s]+/g, "_");
  
  // Add _PORT suffix if not already present
  if (!name.toLowerCase().endsWith("_port")) {
    name = `${name}_PORT`;
  }
  
  // Add prefix if provided
  if (prefix) {
    name = `${prefix}_${name}`;
  }
  
  return uppercase ? name.toUpperCase() : name;
}

/**
 * Generate environment variable lines for all ports in a directory.
 * 
 * @param options - Command options
 * @returns Array of "KEY=value" strings
 */
export function generateEnvLines(options: EnvCommandOptions = {}): string[] {
  const directory = resolve(options.dir ?? process.cwd());
  const entries = getPortsForDirectory(directory);
  const uppercase = options.uppercase !== false;
  
  return entries.map((entry) => {
    const varName = toEnvVarName(entry.port_type, options.prefix, uppercase);
    return `${varName}=${entry.port}`;
  });
}

/**
 * Execute the env command - outputs ports in .env format.
 * 
 * @param options - Command options (dir, prefix, uppercase)
 */
export function executeEnv(options: EnvCommandOptions = {}): void {
  const lines = generateEnvLines(options);
  
  if (lines.length === 0) {
    // Output nothing - allows safe appending to .env
    // User can check with `portmaster info` if they want to see status
    return;
  }
  
  for (const line of lines) {
    console.log(line);
  }
}

