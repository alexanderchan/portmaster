---
name: port-master
description: |
  Track and assign consistent development ports per project directory.
  Use when: asking for port assignments, managing port allocations, setting up docker-compose ports, configuring package.json dev scripts, or cleaning up stale port entries.
  Trigger phrases: "get a port", "assign port", "port for", "which port", "list ports", "show ports", "remove port", "cleanup ports", "port-master"
allowed-tools:
  - Bash
  - Read
  - Edit
  - Write
---

# port-master

A CLI tool that tracks and assigns consistent development ports per project directory. Each project gets predictable, non-conflicting ports based on service type.

## Quick Start

```bash
# Get or create a port for current project
port-master get dev

# Get a postgres port with description
port-master get pg --desc "local postgres for testing"

# See all assigned ports across projects
port-master list

# See ports for current project
port-master info

# Remove a port assignment
port-master rm redis

# Clean up entries for deleted directories
port-master cleanup
```

## Command Reference

### get / add

Get or create a port for a service type in the current project.

```bash
port-master get <type> [options]
port-master add <type> [options]  # alias for get
```

**Options:**
- `-d, --dir <path>` - Target directory instead of current working directory
- `--desc <description>` - Optional description for the port assignment

**Examples:**
```bash
port-master get dev                          # Get dev port for cwd
port-master get pg --desc "main database"    # With description
port-master get redis --dir /path/to/project # For specific directory
```

**Output:** Just the port number (for scripting)

---

### list

Show all assigned ports across all projects.

```bash
port-master list [options]
```

**Options:**
- `-v, --verbose` - Show full absolute paths instead of basenames
- `--json` - Output as JSON array

**Examples:**
```bash
port-master list           # Table format with basenames
port-master list --verbose # Table format with full paths
port-master list --json    # JSON for scripting
```

---

### info

Show all ports assigned to the current (or specified) project.

```bash
port-master info [options]
```

**Options:**
- `-d, --dir <path>` - Target directory instead of current working directory
- `--json` - Output as JSON

**Examples:**
```bash
port-master info                    # Ports for cwd
port-master info --dir /path/to/project
port-master info --json             # JSON output
```

---

### rm

Remove a port assignment for a service type.

```bash
port-master rm <type> [options]
```

**Options:**
- `-d, --dir <path>` - Target directory instead of current working directory
- `-i, --interactive` - Prompt for confirmation before removing

**Examples:**
```bash
port-master rm redis                # Remove redis port for cwd
port-master rm dev --dir /project   # Remove from specific directory
port-master rm pg --interactive     # Confirm before removing
```

---

### cleanup

Remove entries for project directories that no longer exist on the filesystem.

```bash
port-master cleanup [options]
```

**Options:**
- `-n, --dry-run` - Show what would be removed without removing
- `-i, --interactive` - Prompt for confirmation before removing

**Examples:**
```bash
port-master cleanup            # Remove stale entries
port-master cleanup --dry-run  # Preview what would be removed
port-master cleanup -i         # Confirm before removing
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

Database location: `~/.config/port-master/ports.db`

---

## Usage Examples

### package.json Scripts

Use port-master in npm scripts with command substitution:

```json
{
  "scripts": {
    "dev": "next dev -p $(port-master get dev)",
    "db:start": "docker run -p $(port-master get pg):5432 postgres"
  }
}
```

### docker-compose.yml

Use port-master to assign consistent ports in docker-compose:

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
echo "POSTGRES_PORT=$(port-master get pg --desc 'docker postgres')" > .env
echo "REDIS_PORT=$(port-master get redis --desc 'docker redis')" >> .env
```

### Shell Aliases

Add to your `.bashrc` or `.zshrc`:

```bash
# Quick port lookup
alias pm='port-master'
alias pmg='port-master get'
alias pml='port-master list'
alias pmi='port-master info'
```

### CI/CD Integration

Use `--json` output for programmatic access:

```bash
# Get all ports as JSON
PORTS=$(port-master list --json)

# Parse with jq
echo "$PORTS" | jq '.[] | select(.port_type == "dev") | .port'
```
