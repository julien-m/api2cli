# Skill Generation for Generated CLIs

The scaffold already includes `skills/<app>-cli/SKILL.md` with placeholders. After implementing resources, update it.

## Location

The skill lives inside the CLI repo at `skills/<app>-cli/SKILL.md`. This way when pushed to GitHub, anyone can install it:

```bash
npx skills add <github-user>/<app>-cli
```

## What to update

1. Replace `{{RESOURCES_LIST}}` with comma-separated resource names (e.g. "drafts, links, accounts")
2. Replace `{{RESOURCES_HELP}}` with a resource map - every resource with its commands and flags
3. In `README.md`, replace `{{GITHUB_REPO}}` with the actual GitHub repo path (e.g. `Melvynx/typefully-cli`)

## Resource map format

Use this exact format for `{{RESOURCES_HELP}}` in both SKILL.md and README.md. Run `<app>-cli <resource> --help` for each resource to get the real flags.

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

Every command must include `--json`. List all actual flags from `--help` (not guessed ones). Only list resources that exist in the CLI.

## Rules

1. Run `<app>-cli --help` and each `<resource> --help` to get actual commands and flags
2. Only list resources that actually exist in the CLI
3. Keep description concise - list the key resources and trigger words
4. Include actual flags from `--help` output, not guessed ones
5. Always include the auth setup section
6. All command examples must include `--json` flag
7. Always use `--json` when calling commands - table output is for humans only
