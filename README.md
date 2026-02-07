# portmaster

CLI tool that tracks and assigns consistent development ports per project directory.

## Installation

```bash
npm install -g portmaster
```

## Usage

```bash
# Get/create a dev port for the current project
portmaster get dev

# Get a postgres port with a description
portmaster get pg --desc "local postgres"

# List ports for current directory
portmaster list

# List all ports across all directories
portmaster list --all

# Show detailed info for current project
portmaster info

# Output ports as .env format
portmaster env

# Remove a specific port assignment
portmaster rm redis

# Remove all ports for current directory
portmaster rm

# Clean up entries for deleted directories
portmaster cleanup
```

## Port Ranges

| Type         | Range       | Description          |
|--------------|-------------|----------------------|
| dev          | 3100-3999   | Development servers  |
| pg/postgres  | 5500-5599   | PostgreSQL databases |
| db           | 5600-5699   | Generic databases    |
| redis        | 6400-6499   | Redis servers        |
| mongo        | 27100-27199 | MongoDB servers      |
| (other)      | 9100-9999   | Catch-all for custom |

## Storage

Port assignments are stored in `~/.config/portmaster/ports.db` (SQLite).

## Commands

### `portmaster get <type>`

Get or create a port for a service type in the current project.

Options:
- `-d, --dir <path>` - Target directory instead of cwd
- `--desc <description>` - Optional description

### `portmaster list`

Show assigned ports.

Options:
- `-a, --all` - Show all ports across all directories
- `-d, --dir <path>` - Target directory instead of cwd
- `--json` - Output as JSON

### `portmaster info`

Show all ports for the current project.

Options:
- `-d, --dir <path>` - Target directory instead of cwd
- `--json` - Output as JSON

### `portmaster rm [type]`

Remove a port assignment. If no type given, removes all ports for the directory.

Options:
- `-d, --dir <path>` - Target directory instead of cwd
- `-i, --interactive` - Prompt for confirmation

### `portmaster env`

Output all ports for the current project in `.env` format.

```bash
$ portmaster env
DEV_PORT=3142
PG_PORT=5523
```

Options:
- `-d, --dir <path>` - Target directory instead of cwd
- `-p, --prefix <prefix>` - Add prefix to variable names (e.g., `--prefix APP` → `APP_DEV_PORT`)
- `--no-uppercase` - Don't uppercase variable names

### `portmaster cleanup`

Remove entries for deleted project directories.

Options:
- `-n, --dry-run` - Show what would be removed
- `-i, --interactive` - Prompt for confirmation

## Using with Docker Compose

The `env` command makes it easy to use dynamic ports with Docker Compose.

### Step 1: Generate .env file

```bash
portmaster get dev
portmaster get pg
portmaster env > .env
```

This creates a `.env` file:
```
DEV_PORT=3142
PG_PORT=5523
```

### Step 2: Reference in compose.yml

```yaml
services:
  app:
    build: .
    ports:
      - "${DEV_PORT}:3000"
    environment:
      - DATABASE_URL=postgres://user:pass@db:5432/mydb
    depends_on:
      - db

  db:
    image: postgres:16
    ports:
      - "${PG_PORT}:5432"
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
      - POSTGRES_DB=mydb
```

### Step 3: Run

```bash
docker compose up
```

## Using with npm scripts

Use [dotenvx](https://dotenvx.com/) to load the `.env` file in your scripts:

```json
{
  "scripts": {
    "ports": "portmaster env > .env",
    "dev": "dotenvx run -- next dev --port $DEV_PORT",
    "dev:db": "dotenvx run -- docker run -p $PG_PORT:5432 postgres:16"
  }
}
```

Run `npm run ports` once (or in a setup script) to generate the `.env`, then `dotenvx run` loads it automatically.

For projects where portmaster may not be installed, use a fallback script:

```bash
#!/bin/bash
# scripts/setup-ports.sh

if command -v portmaster &> /dev/null; then
  portmaster get dev
  portmaster get pg
  portmaster env > .env
else
  echo "DEV_PORT=${DEV_PORT:-3000}" > .env
  echo "PG_PORT=${PG_PORT:-5432}" >> .env
fi
```

## Philosophy

portmaster is a **helper tool**, not a hard dependency:

1. **Design your app to read ports from environment variables** (`PORT`, `DATABASE_URL`, etc.)
2. **Use portmaster to generate consistent values** for those env vars across projects
3. **Provide fallbacks** so projects work without portmaster installed

This way, each developer can choose whether to use portmaster or set ports manually.

## License

MIT

