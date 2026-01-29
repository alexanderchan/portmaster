# PRD: Port Master - Development Port Assignment CLI

## Introduction

Port Master is a CLI tool that tracks and assigns consistent development ports per project directory. It solves the problem of port conflicts and forgotten assignments when developers manage multiple projects with various services (dev servers, databases, Redis, etc.). Ports are persisted in SQLite at `~/.config/port-master/ports.db` and can be queried by any tool or script.

This PRD covers Phase 1 (CLI) and Phase 1b (Claude Code Skill).

## Goals

- Provide consistent, persistent port assignments per project directory
- Support multiple port types per project (dev, pg, redis, etc.)
- Avoid common default ports that cause conflicts (5432, 6379, 3000, etc.)
- Enable scripting via simple output (just the port number)
- Distribute as npm global package (`npm install -g port-master`)
- Create Claude Code skill for AI agent integration
- Fail fast with clear errors by default; support `--interactive` mode

## User Stories

### US-001: Initialize database on first run
**Description:** As a developer, I need the database to be created automatically so I don't have to run setup commands.

**Acceptance Criteria:**
- [ ] Database created at `~/.config/port-master/ports.db` on first command
- [ ] Parent directories created if they don't exist
- [ ] Schema includes: id, directory, port_type, port, description, created_at, updated_at
- [ ] Unique constraint on (directory, port_type)
- [ ] Unique constraint on port (globally unique)
- [ ] Typecheck passes

### US-002: Get or create port for current directory
**Description:** As a developer, I want to get a port for a service type so I can use it in my dev scripts.

**Acceptance Criteria:**
- [ ] `port-master get <type>` returns existing port if one exists for cwd + type
- [ ] Creates and returns new port if none exists
- [ ] Output is just the port number (no extra text) for easy scripting
- [ ] `--desc "text"` adds optional description
- [ ] `--dir /path` targets specific directory instead of cwd
- [ ] `port-master add` works as alias for `get`
- [ ] Typecheck passes

### US-003: Port allocation by type ranges
**Description:** As a developer, I want ports assigned in logical ranges so related services are grouped.

**Acceptance Criteria:**
- [ ] `dev` type: 3100-3999
- [ ] `pg`, `postgres` type: 5500-5599
- [ ] `redis` type: 6400-6499
- [ ] `mongo` type: 27100-27199
- [ ] `db` type: 5600-5699
- [ ] Unknown types: 9100-9999 (catch-all)
- [ ] Allocation finds first available port in range
- [ ] Falls back to catch-all if range exhausted
- [ ] Typecheck passes

### US-004: List all port assignments
**Description:** As a developer, I want to see all assigned ports across projects so I can manage my development environment.

**Acceptance Criteria:**
- [ ] `port-master list` shows table: PORT, TYPE, DIRECTORY, DESCRIPTION
- [ ] Directory shown as basename by default (e.g., "my-project")
- [ ] `--verbose` shows full absolute paths
- [ ] `--json` outputs JSON array for scripting
- [ ] Sorted by port number
- [ ] Typecheck passes

### US-005: Show ports for current directory
**Description:** As a developer, I want to see all ports assigned to my current project.

**Acceptance Criteria:**
- [ ] `port-master info` shows all ports for cwd
- [ ] Shows directory name and full path
- [ ] Lists each port type with port number and description
- [ ] `--dir /path` targets specific directory
- [ ] `--json` outputs JSON for scripting
- [ ] Shows helpful message if no ports assigned
- [ ] Typecheck passes

### US-006: Remove port assignment
**Description:** As a developer, I want to remove a port assignment when I no longer need it.

**Acceptance Criteria:**
- [ ] `port-master rm <type>` removes port for cwd + type
- [ ] `--dir /path` targets specific directory
- [ ] Fails with clear error if no matching assignment exists
- [ ] `--interactive` prompts for confirmation before removing
- [ ] Outputs removed port number on success
- [ ] Typecheck passes

### US-007: Cleanup stale entries
**Description:** As a developer, I want to remove entries for deleted project directories.

**Acceptance Criteria:**
- [ ] `port-master cleanup` removes entries where directory no longer exists
- [ ] `--dry-run` shows what would be removed without removing
- [ ] Reports count of removed entries
- [ ] `--interactive` prompts for confirmation
- [ ] Typecheck passes

### US-008: Helpful CLI help text
**Description:** As a developer (or AI agent), I need clear help text to understand available commands.

**Acceptance Criteria:**
- [ ] `port-master --help` shows all commands with brief descriptions
- [ ] `port-master <command> --help` shows command-specific options
- [ ] Help text is concise but complete (LLM-friendly)
- [ ] Includes usage examples
- [ ] Shows storage location (`~/.config/port-master/ports.db`)
- [ ] Typecheck passes

### US-009: Global options
**Description:** As a developer, I want consistent global options across commands.

**Acceptance Criteria:**
- [ ] `--dir, -d <path>` works on get, rm, info commands
- [ ] `--interactive, -i` enables prompts on destructive commands
- [ ] `--json` works on list, info commands
- [ ] `--verbose, -v` works on list command
- [ ] `--help, -h` works on all commands
- [ ] `--version` shows package version
- [ ] Typecheck passes

### US-010: Error handling - fail fast
**Description:** As a developer, I want clear error messages when things go wrong.

**Acceptance Criteria:**
- [ ] Invalid command shows error + help suggestion
- [ ] Missing required argument shows specific error
- [ ] Database errors show actionable message
- [ ] Non-existent directory (with --dir) fails with clear error
- [ ] Exit code 1 on any error
- [ ] Exit code 0 on success
- [ ] Typecheck passes

### US-011: npm package setup
**Description:** As a developer, I want to install port-master globally via npm.

**Acceptance Criteria:**
- [ ] Package named `port-master` (or scoped if taken)
- [ ] `npm install -g port-master` works
- [ ] Binary available as `port-master` in PATH
- [ ] Works on macOS, Linux, Windows
- [ ] Dependencies bundled correctly (better-sqlite3 native module)
- [ ] Typecheck passes

### US-012: Create Claude Code skill
**Description:** As an AI agent user, I want port-master available as a Claude Code skill.

**Acceptance Criteria:**
- [ ] `skills/port-master/SKILL.md` created with proper frontmatter
- [ ] Frontmatter includes: name, description (triggers), allowed-tools
- [ ] Quick start section with common commands
- [ ] Full command reference
- [ ] Port range documentation
- [ ] Real-world examples (package.json, docker-compose)
- [ ] Installation instructions in README
- [ ] Typecheck passes (for any TypeScript in skill)

## Functional Requirements

- FR-1: Store port assignments in SQLite at `~/.config/port-master/ports.db`
- FR-2: Auto-create database and schema on first use
- FR-3: Enforce unique constraint on (directory, port_type) - one port per type per project
- FR-4: Enforce unique constraint on port - globally unique assignments
- FR-5: `get` command is idempotent - returns existing or creates new
- FR-6: `get` output is just the port number (no formatting) for `PORT=$(port-master get dev)` usage
- FR-7: Allocate ports from type-specific ranges, avoiding common defaults
- FR-8: `list` command shows all assignments in tabular format
- FR-9: `info` command shows assignments for single directory
- FR-10: `rm` command removes single assignment by directory + type
- FR-11: `cleanup` command removes entries for non-existent directories
- FR-12: `--interactive` flag enables confirmation prompts on destructive operations
- FR-13: `--json` flag outputs machine-readable JSON where applicable
- FR-14: All commands fail fast with clear errors and exit code 1

## Non-Goals

- No Traefik integration (Phase 2)
- No web UI (Phase 3)
- No import from existing config files
- No automatic detection of ports in use on system
- No port reservation without assignment (always tied to directory)
- No multi-user or team sync features
- No port forwarding or proxy functionality

## Technical Considerations

- **Runtime:** Node.js with TypeScript (ESM)
- **CLI Framework:** `@commander-js/extra-typings` for type-safe commands
- **Database:** `better-sqlite3` (synchronous, fast, native module)
- **Validation:** `zod` for schema validation
- **Prompts:** `@clack/prompts` for interactive mode
- **Utilities:** `zx` for shell helpers if needed
- **Build:** `tsx` for development, `tsup` or similar for production build
- **Native modules:** better-sqlite3 requires node-gyp; consider prebuild binaries

### Project Structure

```
packages/
  cli/
    src/
      index.ts           # CLI entry point
      commands/
        list.ts
        get.ts
        rm.ts
        cleanup.ts
        info.ts
      lib/
        db.ts            # Database operations
        ports.ts         # Port allocation logic
        config.ts        # Paths, constants
        types.ts         # Zod schemas, types
    package.json
    tsconfig.json
skills/
  port-master/
    SKILL.md
    templates/           # Optional helper scripts
```

## Success Metrics

- `port-master get dev` returns port in under 100ms
- Zero port conflicts when following assigned ports
- Help text sufficient for LLM to use correctly without documentation
- Installs successfully via `npm install -g` on macOS/Linux/Windows

## Open Questions

- Should `list` support filtering by directory pattern (e.g., `--filter "*api*"`)?
- Should there be a `port-master init` command for explicit setup, or is auto-init sufficient?
- Package name availability on npm - need to check if `port-master` is taken
- Should we support config file for custom port ranges?
