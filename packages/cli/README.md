# portmaster

CLI tool that tracks and assigns consistent development ports per project directory.

## Installation

```bash
npm install -g portmaster
```

## Usage

```bash
# Get/create a dev port for the current project
port-master get dev

# Get a postgres port with a description
port-master get pg --desc "local postgres"

# List ports for current directory
port-master list

# List all ports across all directories
port-master list --all

# Show detailed info for current project
port-master info

# Remove a specific port assignment
port-master rm redis

# Remove all ports for current directory
port-master rm

# Clean up entries for deleted directories
port-master cleanup
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

### `portmaster cleanup`

Remove entries for deleted project directories.

Options:
- `-n, --dry-run` - Show what would be removed
- `-i, --interactive` - Prompt for confirmation

## License

MIT

