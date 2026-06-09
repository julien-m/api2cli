# Finalize Skill Instructions and README

After implementing resources, keep custom skill guidance in `.api2cli/skill/*.md`, refresh the compiled `.agent-sync` skill, then link it through `cc-hub`.

## 1. Update custom skill instructions

Edit `~/.cli/<app>-cli/.api2cli/skill/instruction.md`:

1. Use `$skill-creator` before writing or revising custom skill instructions
2. Add concise workflow/business rules the agent should follow when using this CLI
3. Add more top-level `.md` files in `.api2cli/skill/` when separating policies or workflows helps

`api2cli bundle <app>` and `api2cli link <app>` compile every non-empty top-level `.md` file from `.api2cli/skill/` into `.agent-sync/skills/<app>-cli/SKILL.md`. `instruction.md` is compiled first, then other `.md` files alphabetically.

## 2. Update the README

Edit `~/.cli/<app>-cli/README.md`:

1. Replace `{{RESOURCES_HELP}}` with the same resource map
2. Remove or leave blank any `{{GITHUB_REPO}}` placeholders — the CLI stays local, no public repo

## Resource map format

Run `<app>-cli <resource> --help` for each resource to get real flags. Use this format:

```markdown
### drafts

| Command | Description |
|---------|-------------|
| `<app>-cli drafts list --json` | List all drafts |
| `<app>-cli drafts get <id> --json` | Get a draft by ID |
| `<app>-cli drafts create --text "Hello" --platform x --json` | Create a draft |
| `<app>-cli drafts update <id> --text "Updated" --json` | Update a draft |
| `<app>-cli drafts delete <id> --json` | Delete a draft |

### accounts

| Command | Description |
|---------|-------------|
| `<app>-cli accounts list --json` | List all accounts |
| `<app>-cli accounts get <id> --json` | Get account details |
```

## 3. Link skill through cc-hub

Run `api2cli link` after every instruction update. It refreshes the compiled skill, converts legacy `skills/<app>-cli/` folders when needed, then calls `cc-hub skill link --scope global --targets all --force`.

```bash
npx api2cli link <app>
cc-hub skill status --scope global --targets all --name <app>-cli
```

For OpenClaw or a custom skill directory, pass `--openclaw` or `--skills-path` after the cc-hub link is in place.

## Rules

1. Run `<app>-cli --help` and `<resource> --help` to get actual commands and flags
2. Only list resources that exist in the CLI
3. Every command example must include `--json`
4. Include actual flags from `--help`, not guessed ones
5. Always include the auth setup section
