---
name: portmaster
description: |
  Track and assign consistent development ports per project directory.
  Use when: asking for port assignments, managing port allocations, setting up docker-compose ports, configuring package.json dev scripts, or cleaning up stale port entries.
  Trigger phrases: "get a port", "assign port", "port for", "which port", "list ports", "show ports", "remove port", "cleanup ports", "portmaster"
allowed-tools:
  - Bash
  - Read
  - Edit
  - Write
---

# portmaster

A CLI tool that tracks and assigns consistent development ports per project directory. Each project gets predictable, non-conflicting ports based on service type.

## Quick Start

```bash
# Get or create a port for current project
portmaster get dev

# Get a postgres port with description
portmaster get pg --desc "local postgres for testing"

# See all assigned ports across projects
portmaster list

# See ports for current project
portmaster info

# Remove a port assignment
portmaster rm redis

# Clean up entries for deleted directories
portmaster cleanup
```

## Command Reference

### get / add

Get or create a port for a service type in the current project.

```bash
portmaster get <type> [options]
portmaster add <type> [options]  # alias for get
```

**Options:**
- `-d, --dir <path>` - Target directory instead of current working directory
- `--desc <description>` - Optional description for the port assignment

**Examples:**
```bash
portmaster get dev                          # Get dev port for cwd
portmaster get pg --desc "main database"    # With description
portmaster get redis --dir /path/to/project # For specific directory
```

**Output:** Just the port number (for scripting)

---

### list

Show all assigned ports across all projects.

```bash
portmaster list [options]
```

**Options:**
- `-v, --verbose` - Show full absolute paths instead of basenames
- `--json` - Output as JSON array

**Examples:**
```bash
portmaster list           # Table format with basenames
portmaster list --verbose # Table format with full paths
portmaster list --json    # JSON for scripting
```

---

### info

Show all ports assigned to the current (or specified) project.

```bash
portmaster info [options]
```

**Options:**
- `-d, --dir <path>` - Target directory instead of current working directory
- `--json` - Output as JSON

**Examples:**
```bash
portmaster info                    # Ports for cwd
portmaster info --dir /path/to/project
portmaster info --json             # JSON output
```

---

### rm

Remove a port assignment for a service type.

```bash
portmaster rm <type> [options]
```

**Options:**
- `-d, --dir <path>` - Target directory instead of current working directory
- `-i, --interactive` - Prompt for confirmation before removing

**Examples:**
```bash
portmaster rm redis                # Remove redis port for cwd
portmaster rm dev --dir /project   # Remove from specific directory
portmaster rm pg --interactive     # Confirm before removing
```

---

### cleanup

Remove entries for project directories that no longer exist on the filesystem.

```bash
portmaster cleanup [options]
```

**Options:**
- `-n, --dry-run` - Show what would be removed without removing
- `-i, --interactive` - Prompt for confirmation before removing

**Examples:**
```bash
portmaster cleanup            # Remove stale entries
portmaster cleanup --dry-run  # Preview what would be removed
portmaster cleanup -i         # Confirm before removing
```

---

## Port Ranges by Type

| Type         | Range         | Description            |
|--------------|---------------|------------------------|
| `dev`        | 3100-3999     | Development servers    |
| `pg`/`postgres` | 5500-5599  | PostgreSQL databases   |
| `db`         | 5600-5699     | Generic databases      |
| `redis`      | 6400-6499     | Redis servers          |
| `mongo`      | 27100-27199   | MongoDB servers        |
| *(other)*    | 9100-9999     | Catch-all for custom types |

If a type-specific range is exhausted, ports are allocated from the catch-all range.

---

## Storage

Database location: `~/.config/portmaster/ports.db`

---

## Usage Examples

### package.json Scripts

Use portmaster in npm scripts with command substitution:

```json
{
  "scripts": {
    "dev": "next dev -p $(portmaster get dev)",
    "db:start": "docker run -p $(portmaster get pg):5432 postgres"
  }
}
```

### docker-compose.yml

Use portmaster to assign consistent ports in docker-compose:

```yaml
services:
  postgres:
    image: postgres:16
    ports:
      - "${POSTGRES_PORT:-5432}:5432"
    environment:
      POSTGRES_PASSWORD: password

  redis:
    image: redis:7
    ports:
      - "${REDIS_PORT:-6379}:6379"
```

Then in a setup script or `.env` file:

```bash
# Generate .env with assigned ports
echo "POSTGRES_PORT=$(portmaster get pg --desc 'docker postgres')" > .env
echo "REDIS_PORT=$(portmaster get redis --desc 'docker redis')" >> .env
```

### Shell Aliases

Add to your `.bashrc` or `.zshrc`:

```bash
# Quick port lookup
alias pm='portmaster'
alias pmg='portmaster get'
alias pml='portmaster list'
alias pmi='portmaster info'
```

### CI/CD Integration

Use `--json` output for programmatic access:

```bash
# Get all ports as JSON
PORTS=$(portmaster list --json)

# Parse with jq
echo "$PORTS" | jq '.[] | select(.port_type == "dev") | .port'
```
