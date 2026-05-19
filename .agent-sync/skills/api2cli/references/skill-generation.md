# Finalize Skill and README

After implementing resources, update the canonical `.agent-sync` skill and README, then link it through `cc-hub`.

## 1. Update the SKILL.md

Edit `~/.cli/<app>-cli/.agent-sync/skills/<app>-cli/SKILL.md`:

1. Update the description to include comma-separated resource names (e.g. "Manage typefully via CLI - drafts, links, accounts.")
2. Replace the resources TODO comment with the resource map (see format below)

Note: `{{RESOURCES_LIST}}` is auto-resolved from `src/resources/` at build time. Only manual update is needed for the RESOURCES_HELP section.

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

Run `api2cli link` after every skill update. It converts legacy `skills/<app>-cli/` folders when needed, then calls `cc-hub skill link --scope global --targets all --force`.

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
