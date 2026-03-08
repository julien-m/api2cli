---
name: api2cli
description: "Generate a CLI + AgentSkill from any REST API. Use when: user says 'create a CLI for X', 'wrap this API', 'make a skill for X', or 'publish my CLI'. Handles discovery, scaffolding, resource implementation, building, linking, skill generation, and publishing."
---

# api2cli

Turn any REST API into a standardized, agent-ready CLI.

Always use `npx api2cli` to run commands. Always use `--json` when calling generated CLIs programmatically.

## Prerequisites

```bash
bun --version || curl -fsSL https://bun.sh/install | bash
```

## Workflow

### 1. Discover the API

Find the API docs or OpenAPI spec. Identify: base URL, auth type, auth header, all resources and endpoints.

### 2. Create the scaffold

```bash
npx api2cli create <app> --base-url <url> --auth-type bearer
```

See [references/create.md](references/create.md) for all flags and what gets generated.

### 3. Implement resources

Create `~/.cli/<app>-cli/src/resources/<resource>.ts` for each API resource. Register in `src/index.ts`.

See [references/resource-patterns.md](references/resource-patterns.md) for the CRUD template and library API.

### 4. Build, link, and test

```bash
npx api2cli bundle <app>
npx api2cli link <app>
<app>-cli --help
<app>-cli <resource> list --json
```

`api2cli link` adds `~/.local/bin` to PATH automatically. No `export PATH` needed.

### 5. Finalize skill and README

Update `skills/<app>-cli/SKILL.md` and `README.md` with actual resources, then symlink skill to agent directories.

See [references/skill-generation.md](references/skill-generation.md) for the template, format, and symlink instructions.

### 6. Publish (when user asks)

Push to GitHub and register on api2cli.dev so others can install with one command.

See [references/publish.md](references/publish.md) for the full publish workflow.

## Conventions

```
<app>-cli <resource> <action> [flags]
<app>-cli auth set|show|remove|test
```

`--json` returns: `{ "ok": true, "data": [...], "meta": { "total": 42 } }`

Other flags: `--format <text|json|csv|yaml>`, `--verbose`, `--no-color`, `--no-header`

Exit codes: 0 = success, 1 = API error, 2 = usage error

Tokens: `~/.config/tokens/<app>-cli.txt` (chmod 600)
