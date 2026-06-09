---
name: api2cli
description: "Generate a CLI + AgentSkill from any REST API. Use when: user says 'create a CLI for X', 'wrap this API', 'make a skill for X'. Handles discovery, scaffolding, resource implementation, building, linking, and skill generation. Generated CLIs stay local."
---

# api2cli

Turn any REST API into a standardized, agent-ready CLI.

Always use `npx api2cli` to run commands. Always use `--json` when calling generated CLIs programmatically.

## Prerequisites

```bash
bun --version || curl -fsSL https://bun.sh/install | bash
```

## Workflow

Follow all steps in order — do not skip any.

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

### 4. Add project-specific skill instructions

If the user gives workflow or business instructions for the generated CLI, use `$skill-creator` first, then write the optimized instruction in `~/.cli/<app>-cli/.api2cli/skill/instruction.md` or another top-level `.md` file in that directory. Keep it concise, trigger-focused, and procedural. Do not edit `.agent-sync/skills/<app>-cli/SKILL.md` for custom instructions; `bundle` and `link` compile `.api2cli/skill/*.md` into the final skill automatically.

### 5. Build, link, and test

```bash
npx api2cli bundle <app>
npx api2cli link <app>
<app>-cli --help
<app>-cli <resource> list --json
```

`api2cli link` adds `~/.local/bin` to PATH and links the generated skill through `cc-hub` into Claude/Codex. No `export PATH` needed.

### 6. Finalize skill and README

Keep custom skill guidance in `.api2cli/skill/*.md`, then run `npx api2cli bundle <app>` or `npx api2cli link <app>` to refresh `.agent-sync/skills/<app>-cli/SKILL.md` before linking locally via `cc-hub`.

**Read** [`references/skill-generation.md`](references/skill-generation.md) for the template, format, and cc-hub linking instructions.

To also link skills for OpenClaw:

```bash
npx api2cli link <app> --openclaw
```

**Read** [`references/openclaw.md`](references/openclaw.md) for the one-prompt setup, API key auto-detection, and custom `--skills-path` usage.

## Privacy

Generated CLIs are **local only**. This skill does not publish to npm, GitHub, ClawHub, Sundial Hub, or any public registry. CLIs live in `~/.cli/<app>-cli/`; canonical skills live in `.agent-sync/skills/<app>-cli/` and are linked to Claude/Codex via `cc-hub`.

## Conventions

```
<app>-cli <resource> <action> [flags]
<app>-cli auth set|show|remove|test
```

`--json` returns: `{ "ok": true, "data": [...], "meta": { "total": 42 } }`

Other flags: `--format <text|json|csv|yaml>`, `--verbose`, `--no-color`, `--no-header`

Exit codes: 0 = success, 1 = API error, 2 = usage error

Tokens: stored in OS Keychain via `creds` (entry `global/dev/<app>` by default). The generated CLI uses `creds set/get/rm` — no plaintext files.
