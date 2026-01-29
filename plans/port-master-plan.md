# Port Master - Development Plan

## Overview

Port Master is a CLI tool (with future UI) that tracks port assignments per project directory. It persists assignments in SQLite at `~/.config/port-master/ports.db`.

### Research: Existing Solutions

**BloopAI/dev-manager-mcp** - Not suitable. It manages *running* dev servers with temporary port allocation but doesn't persist assignments, track by directory, or support custom port types. We need persistent assignment tracking.

---

## Phase 1: CLI Core

### Tech Stack

- TypeScript (ESM)
- `@commander-js/extra-typings` - CLI framework with type safety
- `@clack/prompts` - Beautiful CLI prompts
- `zx` - Shell scripting utilities
- `better-sqlite3` - SQLite driver (fast, synchronous)
- `zod` - Schema validation

### Database Schema

```sql
CREATE TABLE ports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  directory TEXT NOT NULL,           -- absolute path
  port_type TEXT NOT NULL,           -- 'dev', 'redis', 'pg', 'dev:db', etc.
  port INTEGER NOT NULL UNIQUE,      -- assigned port number
  description TEXT,                  -- optional short description
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  UNIQUE(directory, port_type)
);

CREATE INDEX idx_directory ON ports(directory);
CREATE INDEX idx_port ON ports(port);
```

### Port Allocation Strategy

**Reserved port ranges to avoid:**
- 3000-3010 (common dev servers)
- 5432 (postgres default)
- 5433 (postgres alt)
- 6379 (redis default)
- 27017 (mongodb default)
- 8080, 8000, 8888 (common http)

**Allocation ranges by type:**
| Type | Range | Notes |
|------|-------|-------|
| `dev` | 3100-3999 | Dev servers |
| `pg`, `postgres` | 5500-5599 | PostgreSQL |
| `redis` | 6400-6499 | Redis |
| `mongo` | 27100-27199 | MongoDB |
| `db` | 5600-5699 | Generic database |
| `*` (unknown) | 9100-9999 | Catch-all |

Algorithm:
1. Query existing ports in range for type
2. Find first available port in range
3. If range exhausted, fall back to catch-all range

### CLI Commands

```bash
# List all port assignments
port-master list
port-master list --verbose       # Full directory paths
port-master list --json          # JSON output for scripting

# Get or create port for current directory
port-master get <type>           # e.g., port-master get dev
port-master get <type> --desc "Description"
port-master add <type>           # alias for get

# Get for specific directory
port-master get <type> --dir /path/to/project

# Remove port assignment
port-master rm <type>            # Remove from current directory
port-master rm <type> --dir /path/to/project

# Cleanup: remove entries for non-existent directories
port-master cleanup
port-master cleanup --dry-run    # Preview what would be removed

# Show info for current directory
port-master info
port-master info --dir /path/to/project
```

### Output Formats

**list (default):**
```
PORT   TYPE    DIRECTORY          DESCRIPTION
3100   dev     port-master        Main dev server
5500   pg      port-master        PostgreSQL
3101   dev     my-other-project   Next.js dev
```

**list --verbose:**
```
PORT   TYPE    DIRECTORY                              DESCRIPTION
3100   dev     /Users/alex/dev/port-master            Main dev server
5500   pg      /Users/alex/dev/port-master            PostgreSQL
3101   dev     /Users/alex/dev/my-other-project       Next.js dev
```

**get (returns just the port for easy scripting):**
```
3100
```

**info:**
```
Directory: port-master (/Users/alex/dev/port-master)

Ports:
  dev     3100  Main dev server
  pg      5500  PostgreSQL
```

### Project Structure

```
packages/
  cli/
    src/
      index.ts          # CLI entry point
      commands/
        list.ts
        get.ts
        rm.ts
        cleanup.ts
        info.ts
      lib/
        db.ts           # Database operations
        ports.ts        # Port allocation logic
        config.ts       # Paths, constants
        types.ts        # Zod schemas, types
    package.json
    tsconfig.json
```

### Help Text (LLM-friendly)

```
port-master - Track port assignments per project directory

USAGE
  port-master <command> [options]

COMMANDS
  list              List all port assignments
  get <type>        Get or create port for type (dev, pg, redis, etc.)
  add <type>        Alias for get
  rm <type>         Remove port assignment
  cleanup           Remove entries for deleted directories
  info              Show ports for current directory

OPTIONS
  --dir, -d <path>  Target directory (default: cwd)
  --desc <text>     Description for new port
  --verbose, -v     Show full paths
  --json            Output as JSON
  --dry-run         Preview changes without applying
  --help, -h        Show help

EXAMPLES
  port-master get dev              # Get/create dev port for cwd
  port-master get pg --desc "Main DB"
  port-master list --verbose
  port-master cleanup --dry-run

STORAGE
  ~/.config/port-master/ports.db
```

---

## Phase 1b: Claude Code Skill

Create a Claude Code skill so AI agents can use port-master directly.

### Skill Structure

Based on [vercel-labs/agent-browser](https://github.com/vercel-labs/agent-browser) skill format:

```
skills/
  port-master/
    SKILL.md              # Main skill definition
    templates/
      package-json.sh     # Template for adding port to package.json scripts
```

### SKILL.md Format

```markdown
---
name: port-master
description: Use when you need to assign or look up development ports for the current project. Triggers on requests like "what port should I use", "assign a port for redis", "list my ports", or when setting up dev servers, databases, or services that need consistent port assignments.
allowed-tools: Bash(port-master:*)
---

# port-master

Track and assign consistent development ports per project directory.

## Quick Start

\`\`\`bash
port-master get dev                    # Get/create dev server port
port-master get pg --desc "Main DB"    # Get postgres port with description
port-master list                       # List all assignments
port-master info                       # Show ports for current directory
\`\`\`

## Core Workflow

1. **Check existing**: `port-master info` to see current directory's ports
2. **Get or create**: `port-master get <type>` returns existing or allocates new
3. **Use the port**: Output is just the port number for easy scripting

## Commands

### Get/Add Port (idempotent)
\`\`\`bash
port-master get <type>                 # Get or create port for type
port-master get <type> --desc "text"   # With description
port-master get <type> --dir /path     # For specific directory
port-master add <type>                 # Alias for get
\`\`\`

**Common types**: `dev`, `pg`, `postgres`, `redis`, `mongo`, `db`, `api`, `web`

### List All Ports
\`\`\`bash
port-master list                       # Short directory names
port-master list --verbose             # Full paths
port-master list --json                # JSON output
\`\`\`

### Show Current Directory
\`\`\`bash
port-master info                       # Ports for cwd
port-master info --dir /path           # Ports for specific dir
\`\`\`

### Remove Port
\`\`\`bash
port-master rm <type>                  # Remove from cwd
port-master rm <type> --dir /path      # Remove from specific dir
\`\`\`

### Cleanup Stale Entries
\`\`\`bash
port-master cleanup                    # Remove entries for deleted directories
port-master cleanup --dry-run          # Preview what would be removed
\`\`\`

## Port Ranges

| Type | Range | Notes |
|------|-------|-------|
| dev | 3100-3999 | Dev servers |
| pg, postgres | 5500-5599 | PostgreSQL |
| redis | 6400-6499 | Redis |
| mongo | 27100-27199 | MongoDB |
| db | 5600-5699 | Generic database |
| other | 9100-9999 | Catch-all |

## Examples

### Setting up a new project
\`\`\`bash
cd /path/to/my-project
DEV_PORT=$(port-master get dev --desc "Next.js dev server")
DB_PORT=$(port-master get pg --desc "Local postgres")
echo "Dev: $DEV_PORT, DB: $DB_PORT"
\`\`\`

### Using in package.json scripts
\`\`\`bash
# Get the port, then update package.json
PORT=$(port-master get dev)
# Use $PORT in your dev script configuration
\`\`\`

### Docker Compose port mapping
\`\`\`bash
PG_PORT=$(port-master get pg)
# Use in docker-compose.yml: ports: ["${PG_PORT}:5432"]
\`\`\`

## Storage

Database: `~/.config/port-master/ports.db`
```

### Templates

**templates/package-json.sh** - Helper to update package.json with assigned port:
```bash
#!/bin/bash
# Usage: source this after getting a port
# Expects: $PORT variable set

PORT=${PORT:-$(port-master get dev)}
echo "Assigned port: $PORT"
echo "Add to package.json scripts:"
echo "  \"dev\": \"next dev -p $PORT\""
```

### Installation as Skill

To install the skill for Claude Code:

```bash
# Copy skill to Claude Code skills directory
cp -r skills/port-master ~/.claude/skills/
```

Or symlink for development:
```bash
ln -s $(pwd)/skills/port-master ~/.claude/skills/port-master
```

---

## Phase 2: Traefik Integration

### Goal

Generate/update Traefik config to map `<project>.localhost` to local ports.

### Config Location

`~/.config/port-master/traefik/dynamic.yaml`

### Generated Config Example

```yaml
http:
  routers:
    port-master-dev:
      rule: "Host(`port-master.localhost`)"
      service: port-master-dev
      tls: {}
      middlewares:
        - authentik

  services:
    port-master-dev:
      loadBalancer:
        servers:
          - url: "http://127.0.0.1:3100"
```

### New Commands

```bash
port-master traefik sync          # Regenerate traefik config
port-master traefik show          # Show current config
port-master traefik path          # Print config path
```

### Authentik Middleware

Will add Authentik forward-auth middleware for all routes.

---

## Phase 3: Web UI

### Features

- Dashboard listing all projects, ports, Traefik domains
- Add/remove port assignments
- Manual Traefik sync trigger
- Status indicators (port in use, directory exists)

### Tech

- Next.js (already in project)
- Uses same SQLite DB via API routes
- Tailwind CSS for styling

---

## Implementation Order

### Phase 1 Tasks

1. **Setup CLI package** - pnpm workspace, tsconfig, dependencies
2. **Database layer** - Init, migrations, CRUD operations
3. **Port allocation** - Range logic, conflict detection
4. **Commands** - list, get, rm, cleanup, info
5. **Build & bin** - ESM build, executable entry point
6. **Tests** - Unit tests for port allocation, DB operations

### Phase 1b Tasks

1. **Create skill directory** - `skills/port-master/`
2. **Write SKILL.md** - Full skill definition with examples
3. **Add templates** - Helper scripts for common integrations
4. **Test skill loading** - Verify Claude Code picks up the skill
5. **Document installation** - README instructions for skill setup

### Dependencies to Install

```bash
pnpm add -D typescript @types/node tsx
pnpm add @commander-js/extra-typings @clack/prompts zx better-sqlite3 zod
pnpm add -D @types/better-sqlite3
```

---

## Notes

- All port assignments are per-directory + type (compound unique key)
- Ports are globally unique (one port = one assignment)
- `get` is idempotent - returns existing port or creates new
- Descriptions are optional, can be updated
- CLI should work headless (no prompts when piped)

---

## References

- [vercel-labs/agent-browser](https://github.com/vercel-labs/agent-browser) - Skill format reference
- [BloopAI/dev-manager-mcp](https://github.com/BloopAI/dev-manager-mcp) - Evaluated, not suitable (runtime only)
