# api2cli Commands Reference

All commands use the locally installed `api2cli` binary (do not use `npx` — api2cli is local-only and not published on npm).

## Core Commands

### create

Generate a new CLI from API documentation.

```bash
api2cli create <app> [options]
```

| Flag | Description | Default |
|------|-------------|---------|
| `<app>` | API/app name (e.g. typefully, dub) | required |
| `--base-url <url>` | API base URL | `https://api.example.com` |
| `--auth-type <type>` | bearer, api-key, basic, custom | `bearer` |
| `--auth-header <name>` | Auth header name | `Authorization` |
| `--docs <url>` | API docs URL | - |
| `--openapi <url>` | OpenAPI/Swagger spec URL | - |
| `--force` | Overwrite existing CLI | `false` |

Examples:
```bash
api2cli create typefully --base-url https://api.typefully.com --auth-type bearer
api2cli create dub --openapi https://api.dub.co/openapi.json
api2cli create my-api --docs https://docs.example.com/api
```

### bundle

Build a CLI from source and compile `.api2cli/skill/*.md` into the generated AgentSkill.

```bash
api2cli bundle [app] [options]
```

| Flag | Description | Default |
|------|-------------|---------|
| `[app]` | CLI to build (omit with --all) | - |
| `--compile` | Create standalone binary (~50MB) | `false` |
| `--all` | Build all installed CLIs | `false` |

### link / unlink

Add or remove a CLI from PATH. `link` also compiles `.api2cli/skill/*.md` into the generated AgentSkill, then links it locally through `cc-hub` for Claude/Codex.

```bash
api2cli link [app] [--all]
api2cli unlink <app>
```

## Management Commands

### list

List all installed CLIs with build and auth status.

```bash
api2cli list [--json]
```

### tokens

List all configured API tokens (masked by default).

```bash
api2cli tokens [--show]
```

### remove

Remove a CLI entirely (directory, PATH entry, and token).

```bash
api2cli remove <app> [--keep-token]
```

### doctor

Check system requirements (bun, git, directories).

```bash
api2cli doctor
```

### update

Re-sync a CLI when the upstream API changes.

```bash
api2cli update <app> [--docs <url>] [--openapi <url>]
```

This is agent-driven: update resources in `<cli>/src/resources/` then rebuild.

## Registry Commands

### install

Install a CLI from a GitHub repo. Clones, builds, links to PATH, and symlinks the skill to agent directories.

```bash
api2cli install <source> [--force]
```

| Flag | Description |
|------|-------------|
| `<source>` | GitHub repo (`owner/repo` or full URL) |
| `--force` | Overwrite existing CLI |

```bash
api2cli install julien-m/typefully-cli
api2cli install https://github.com/julien-m/typefully-cli
```
