import { z } from "zod";

/**
 * Known port types with specific ranges.
 * These are the "official" types with dedicated port ranges.
 */
export const KNOWN_PORT_TYPES = [
  "dev",
  "pg",
  "postgres",
  "redis",
  "mongo",
  "db",
] as const;

/**
 * Schema for known port types.
 * Used for validation and type inference.
 */
export const KnownPortTypeSchema = z.enum(KNOWN_PORT_TYPES);
export type KnownPortType = z.infer<typeof KnownPortTypeSchema>;

/**
 * Schema for any port type (known or custom).
 * Custom types will use the catch-all range.
 */
export const PortTypeSchema = z.string().min(1, "Port type cannot be empty");
export type PortType = z.infer<typeof PortTypeSchema>;

/**
 * Schema for a port entry as stored in the database.
 */
export const PortEntrySchema = z.object({
  id: z.number().int().positive(),
  directory: z.string().min(1),
  port_type: PortTypeSchema,
  port: z.number().int().min(1).max(65535),
  description: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type PortEntry = z.infer<typeof PortEntrySchema>;

/**
 * Schema for creating a new port entry (without auto-generated fields).
 */
export const CreatePortEntrySchema = z.object({
  directory: z.string().min(1),
  port_type: PortTypeSchema,
  port: z.number().int().min(1).max(65535),
  description: z.string().optional(),
});
export type CreatePortEntry = z.infer<typeof CreatePortEntrySchema>;

// ============================================================
// CLI Options Schemas
// ============================================================

/**
 * Common CLI options shared across commands.
 */
export const DirectoryOptionSchema = z.object({
  dir: z.string().optional(),
});

/**
 * Options for the 'get' (alias: 'add') command.
 */
export const GetOptionsSchema = DirectoryOptionSchema.extend({
  desc: z.string().optional(),
});
export type GetOptions = z.infer<typeof GetOptionsSchema>;

/**
 * Options for the 'list' command.
 */
export const ListOptionsSchema = z.object({
  verbose: z.boolean().optional().default(false),
  json: z.boolean().optional().default(false),
});
export type ListOptions = z.infer<typeof ListOptionsSchema>;

/**
 * Options for the 'info' command.
 */
export const InfoOptionsSchema = DirectoryOptionSchema.extend({
  json: z.boolean().optional().default(false),
});
export type InfoOptions = z.infer<typeof InfoOptionsSchema>;

/**
 * Options for the 'rm' command.
 */
export const RmOptionsSchema = DirectoryOptionSchema.extend({
  interactive: z.boolean().optional().default(false),
});
export type RmOptions = z.infer<typeof RmOptionsSchema>;

/**
 * Options for the 'cleanup' command.
 */
export const CleanupOptionsSchema = z.object({
  dryRun: z.boolean().optional().default(false),
  interactive: z.boolean().optional().default(false),
});
export type CleanupOptions = z.infer<typeof CleanupOptionsSchema>;

// ============================================================
// Utility Types
// ============================================================

/**
 * Port range definition.
 */
export const PortRangeSchema = z.object({
  start: z.number().int().min(1).max(65535),
  end: z.number().int().min(1).max(65535),
});
export type PortRange = z.infer<typeof PortRangeSchema>;

/**
 * Port info for display purposes (used in list/info commands).
 */
export const PortDisplayInfoSchema = z.object({
  port: z.number().int(),
  type: z.string(),
  directory: z.string(),
  fullPath: z.string(),
  description: z.string().nullable(),
});
export type PortDisplayInfo = z.infer<typeof PortDisplayInfoSchema>;

